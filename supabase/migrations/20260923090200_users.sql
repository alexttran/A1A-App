-- ---------------------------------------------------------------------------
-- Phase 0 — public.users (requirements §7.1).
--
-- Mirrors auth.users, which owns credentials and sessions. This table owns the
-- things the app cares about: display name, role, and active state.
--
-- Deactivated users are RETAINED, never deleted, so authorship on historical
-- content stays attributable (§2.3, NFR-10). There is consequently no DELETE
-- path here for anyone but the service role.
-- ---------------------------------------------------------------------------

create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text not null,
  role text not null default 'standard' check (role in ('admin', 'standard')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.users is
  'Application profile for each auth.users row. Created automatically by on_auth_user_created.';

-- Admin screens list active users first, then alphabetically (FR-ADM-1).
create index users_active_name_idx on public.users (is_active desc, full_name);

-- ---------------------------------------------------------------------------
-- Profile creation on signup.
--
-- The app must never see an authenticated user without a profile: auth_role()
-- would return NULL and every policy would deny, which reads to the user as a
-- broken app rather than a permissions problem. A trigger guarantees the row
-- exists before the client can make its first request.
--
-- `role` is read from invite metadata, which an admin sets when calling
-- inviteUserByEmail() with the service role. THIS IS ONLY SAFE WHILE SELF-SIGNUP
-- IS DISABLED (requirements §2.1, enforced in supabase/config.toml and in the
-- dashboard's auth settings). With signup enabled, anyone could self-assign
-- admin by passing role in their own signup metadata. Unrecognised values fall
-- back to 'standard' rather than erroring, so a malformed invite produces a
-- least-privilege account instead of a failed signup.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  invited_role text := nullif(trim(meta ->> 'role'), '');
  invited_name text := nullif(trim(meta ->> 'full_name'), '');
begin
  insert into public.users (id, email, full_name, role)
  values (
    new.id,
    new.email,
    -- A name is required by the schema but not by the invite. Fall back to the
    -- local part of the address so the admin list is never blank; the user can
    -- be corrected afterwards.
    coalesce(invited_name, split_part(new.email, '@', 1)),
    case when invited_role in ('admin', 'standard') then invited_role else 'standard' end
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_auth_user();

-- ---------------------------------------------------------------------------
-- FR-ADM-4 — last-admin and self-demotion guards.
--
-- Enforced as a trigger rather than in the admin screen because the failure mode
-- is unrecoverable from inside the app: an org with zero active admins can no
-- longer invite, promote, or manage anything, and needs manual database surgery
-- to escape.
--
-- auth.uid() is NULL under the service role, so the self-demotion check does not
-- fire there. That is the intended break-glass path (see SETUP.md).
-- ---------------------------------------------------------------------------
create or replace function public.guard_admin_demotion()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  remaining_admins integer;
begin
  if old.role = 'admin' and (new.role <> 'admin' or new.is_active = false) then
    if old.id = (select auth.uid()) then
      raise exception 'You cannot remove your own admin access. Ask another admin to do it.'
        using errcode = 'check_violation';
    end if;

    select count(*) into remaining_admins
    from public.users
    where role = 'admin'
      and is_active
      and id <> old.id;

    if remaining_admins = 0 then
      raise exception 'At least one active admin must remain.'
        using errcode = 'check_violation';
    end if;
  end if;

  return new;
end;
$$;

create trigger users_guard_admin_demotion
  before update on public.users
  for each row
  execute function public.guard_admin_demotion();

-- ---------------------------------------------------------------------------
-- Grants and RLS.
--
-- Grants are set explicitly rather than left to Supabase's permissive defaults
-- on the public schema. A missing grant is a structural denial that no policy
-- mistake can re-open, which is the stronger guarantee of the two.
-- ---------------------------------------------------------------------------
revoke all on public.users from anon, authenticated;
grant select on public.users to authenticated;
-- Column-scoped: even an admin cannot rewrite id, email, or created_at from the
-- client. Email is owned by auth.users; changing it here would silently desync.
grant update (full_name, role, is_active) on public.users to authenticated;

alter table public.users enable row level security;
-- NOTE: no FORCE ROW LEVEL SECURITY — see the recursion note in migration 0001.

-- Every screen renders author names (announcements, preference card revisions,
-- document uploads), so every active user reads the full profile list. Nothing
-- here is sensitive: name, email, role, active state, all internal.
create policy "users: active users read all profiles"
  on public.users
  for select
  to authenticated
  using (public.auth_role() is not null);

-- §2.2 — invite, deactivate, and promote are admin-only. Both clauses are
-- required: USING selects the rows an admin may target, WITH CHECK validates the
-- row they are writing, and omitting the latter would allow an admin to edit a
-- row into a shape they could not have selected.
create policy "users: admins update profiles"
  on public.users
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- No INSERT policy: profiles come from on_auth_user_created, which runs as
-- SECURITY DEFINER and is not subject to RLS.
-- No DELETE policy or grant: users are deactivated, never removed (§2.3).
