-- ---------------------------------------------------------------------------
-- Phase 0 — extensions and the RLS helper functions.
--
-- Every later policy calls the helpers defined here, so the security properties
-- of this file are load-bearing for the whole §2.2 permission matrix.
--
-- Migrations are APPEND-ONLY. Once this has run against a real project, never
-- edit it; write a new migration instead (src/README.md).
-- ---------------------------------------------------------------------------

-- Trigram search for requirements §7.2. The indexes themselves land with the
-- tables they cover (surgeons, documents, folders, events) in Phases 2–4; the
-- extension is created here so no later migration has to reach for it.
create extension if not exists pg_trgm with schema extensions;

-- ---------------------------------------------------------------------------
-- auth_role() — the role of the caller, or NULL.
--
-- Returns NULL for: an unauthenticated request, a user with no profile row, and
-- a DEACTIVATED user. That last case is deliberate and is why policies test
-- `auth_role() is not null` rather than checking the JWT: deactivating a user
-- must cut off data access immediately (requirements §2.3), not merely revoke
-- their sessions.
--
-- SECURITY DEFINER is REQUIRED, not incidental. The function reads public.users,
-- and public.users' own policies call is_admin() → auth_role(). Running as the
-- definer (the table owner) bypasses RLS on that read and breaks what would
-- otherwise be infinite policy recursion. For the same reason public.users must
-- never have FORCE ROW LEVEL SECURITY applied — that would make the owner obey
-- its own policies and reinstate the recursion.
--
-- `select auth.uid()` is wrapped in a subselect so Postgres evaluates it once
-- per statement as an InitPlan instead of once per row.
-- ---------------------------------------------------------------------------
create or replace function public.auth_role()
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select u.role
  from public.users u
  where u.id = (select auth.uid())
    and u.is_active
$$;

comment on function public.auth_role() is
  'Role of the calling user (''admin''|''standard''), or NULL when unauthenticated, profile-less, or deactivated.';

-- ---------------------------------------------------------------------------
-- is_admin() — the admin half of the §2.2 matrix, in one place.
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(public.auth_role() = 'admin', false)
$$;

comment on function public.is_admin() is
  'True when the caller is an active admin. False for everyone else, never NULL.';

-- Policies are evaluated as the invoking role, so `authenticated` needs EXECUTE.
-- `anon` deliberately does not: there is no unauthenticated surface in this app.
revoke all on function public.auth_role() from public, anon;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.auth_role() to authenticated;
grant execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- set_updated_at() — shared BEFORE UPDATE trigger for every table carrying an
-- updated_at column (§7.1). Kept here so the timestamp can never be set by a
-- client that forgot, or lied.
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'BEFORE UPDATE trigger: stamps updated_at with now(), ignoring any client-supplied value.';
