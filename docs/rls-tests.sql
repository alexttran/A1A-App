-- ===========================================================================
-- RLS policy tests — Phase 0 tables (public.users, public.event_categories)
-- ===========================================================================
--
-- ROADMAP exit criteria are phrased as "verified by attempting the API call
-- directly, not just by checking that the button is hidden" (NFR-3). This file
-- is that check, expressed in SQL.
--
-- HOW TO RUN
--
--   Local:   npm run db:reset && psql "$(npx supabase status -o json | jq -r .DB_URL)" -f docs/rls-tests.sql
--   Hosted:  paste into the SQL editor and run (as the `postgres` role)
--
-- The whole file runs inside a transaction that ROLLS BACK at the end, so it
-- leaves no fixtures behind and is safe against a project with real data in it.
-- Any failed assertion aborts with an exception and rolls back the same way.
--
-- Each test sets `request.jwt.claims` the way PostgREST does, then switches to
-- the `authenticated` role — which is what makes policies apply. Without the
-- role switch you are still `postgres`, which bypasses RLS, and every test would
-- pass vacuously.
-- ===========================================================================

begin;

-- ---------------------------------------------------------------------------
-- Fixtures. Inserting into auth.users fires on_auth_user_created, so the
-- public.users rows below are created by the trigger, not by hand — which makes
-- this a test of that trigger too.
-- ---------------------------------------------------------------------------
\set admin_id   '11111111-1111-1111-1111-111111111111'
\set user_id    '22222222-2222-2222-2222-222222222222'
\set other_id   '33333333-3333-3333-3333-333333333333'
\set inactive_id '44444444-4444-4444-4444-444444444444'

insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
values
  (:'admin_id',    '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'rls-admin@example.test',    '{"full_name":"RLS Admin","role":"admin"}',    now(), now()),
  (:'user_id',     '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'rls-standard@example.test', '{"full_name":"RLS Standard","role":"standard"}', now(), now()),
  (:'other_id',    '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'rls-other@example.test',    '{}',                                         now(), now()),
  (:'inactive_id', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'rls-inactive@example.test', '{"full_name":"RLS Inactive","role":"standard"}', now(), now());

-- Deactivate one, to prove deactivation cuts off reads (§2.3).
update public.users set is_active = false where id = :'inactive_id';

-- A helper that fails loudly. RAISE EXCEPTION aborts the transaction, so the
-- first failure stops the run and nothing is committed.
create or replace function pg_temp.assert(condition boolean, description text)
returns void language plpgsql as $$
begin
  if condition then
    raise notice '  PASS  %', description;
  else
    raise exception 'FAIL  %', description;
  end if;
end;
$$;

-- Impersonate a user the way PostgREST does for one statement batch.
create or replace function pg_temp.become(uid text)
returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
                     json_build_object('sub', uid, 'role', 'authenticated')::text,
                     true);
  perform set_config('role', 'authenticated', true);
end;
$$;

create or replace function pg_temp.become_anon()
returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', '', true);
  perform set_config('role', 'anon', true);
end;
$$;

-- ===========================================================================
do $$
declare
  admin_id    text := '11111111-1111-1111-1111-111111111111';
  user_id     text := '22222222-2222-2222-2222-222222222222';
  other_id    text := '33333333-3333-3333-3333-333333333333';
  inactive_id text := '44444444-4444-4444-4444-444444444444';
  n integer;
  ok boolean;
begin
  raise notice '--- signup trigger -------------------------------------------';

  select count(*) into n from public.users
   where id in (admin_id::uuid, user_id::uuid, other_id::uuid, inactive_id::uuid);
  perform pg_temp.assert(n = 4, 'a profile row is created for every auth user');

  select (role = 'admin') into ok from public.users where id = admin_id::uuid;
  perform pg_temp.assert(ok, 'invite metadata role=admin is honoured');

  select (role = 'standard') into ok from public.users where id = other_id::uuid;
  perform pg_temp.assert(ok, 'missing metadata role defaults to standard');

  select (full_name = 'RLS Admin') into ok from public.users where id = admin_id::uuid;
  perform pg_temp.assert(ok, 'full_name comes from invite metadata when present');

  select (full_name = 'rls-other') into ok from public.users where id = other_id::uuid;
  perform pg_temp.assert(ok, 'full_name falls back to the email local part when absent');

  raise notice '--- helper functions -----------------------------------------';

  perform pg_temp.become(admin_id);
  perform pg_temp.assert(public.auth_role() = 'admin', 'auth_role() returns admin for an admin');
  perform pg_temp.assert(public.is_admin(), 'is_admin() is true for an admin');
  reset role;

  perform pg_temp.become(user_id);
  perform pg_temp.assert(public.auth_role() = 'standard', 'auth_role() returns standard');
  perform pg_temp.assert(public.is_admin() = false, 'is_admin() is false for a standard user');
  reset role;

  perform pg_temp.become(inactive_id);
  perform pg_temp.assert(public.auth_role() is null, 'auth_role() is NULL for a deactivated user');
  reset role;

  perform pg_temp.become_anon();
  perform pg_temp.assert(public.auth_role() is null, 'auth_role() is NULL when unauthenticated');
  reset role;

  raise notice '--- public.users: reads --------------------------------------';

  perform pg_temp.become(user_id);
  select count(*) into n from public.users;
  perform pg_temp.assert(n = 4, 'a standard user reads all profiles (authorship attribution)');
  reset role;

  perform pg_temp.become(inactive_id);
  select count(*) into n from public.users;
  perform pg_temp.assert(n = 0, 'a DEACTIVATED user reads nothing');
  reset role;

  perform pg_temp.become_anon();
  select count(*) into n from public.users;
  perform pg_temp.assert(n = 0, 'an unauthenticated caller reads nothing');
  reset role;

  raise notice '--- public.users: writes (§2.2) ------------------------------';

  -- A standard user must not be able to promote themselves. This is THE test
  -- that matters most on this table.
  perform pg_temp.become(user_id);
  update public.users set role = 'admin' where id = user_id::uuid;
  get diagnostics n = row_count;
  perform pg_temp.assert(n = 0, 'a standard user CANNOT promote themselves');

  update public.users set full_name = 'Renamed' where id = other_id::uuid;
  get diagnostics n = row_count;
  perform pg_temp.assert(n = 0, 'a standard user CANNOT edit another profile');
  reset role;

  perform pg_temp.become(admin_id);
  update public.users set role = 'admin' where id = other_id::uuid;
  get diagnostics n = row_count;
  perform pg_temp.assert(n = 1, 'an admin CAN promote another user');

  update public.users set role = 'standard' where id = other_id::uuid;
  reset role;

  -- Column grants are a separate gate from the policy: even an admin has no
  -- UPDATE privilege on email, so this fails at the grant, not at RLS.
  perform pg_temp.become(admin_id);
  begin
    update public.users set email = 'hijack@example.test' where id = other_id::uuid;
    perform pg_temp.assert(false, 'an admin CANNOT rewrite email (column grant)');
  exception when insufficient_privilege then
    perform pg_temp.assert(true, 'an admin CANNOT rewrite email (column grant)');
  end;
  reset role;

  perform pg_temp.become(user_id);
  begin
    insert into public.users (id, email, full_name)
    values (gen_random_uuid(), 'sneaky@example.test', 'Sneaky');
    perform pg_temp.assert(false, 'nobody can INSERT a profile directly');
  exception when insufficient_privilege or check_violation then
    perform pg_temp.assert(true, 'nobody can INSERT a profile directly');
  end;
  reset role;

  perform pg_temp.become(admin_id);
  begin
    delete from public.users where id = other_id::uuid;
    perform pg_temp.assert(false, 'nobody can DELETE a profile (§2.3 retention)');
  exception when insufficient_privilege then
    perform pg_temp.assert(true, 'nobody can DELETE a profile (§2.3 retention)');
  end;
  reset role;

  raise notice '--- FR-ADM-4 guards ------------------------------------------';

  perform pg_temp.become(admin_id);
  begin
    update public.users set role = 'standard' where id = admin_id::uuid;
    perform pg_temp.assert(false, 'an admin CANNOT demote themselves');
  exception when check_violation then
    perform pg_temp.assert(true, 'an admin CANNOT demote themselves');
  end;
  reset role;

  -- Promote a second admin, then prove the last one standing cannot be removed.
  perform pg_temp.become(admin_id);
  update public.users set role = 'admin' where id = other_id::uuid;
  reset role;

  perform pg_temp.become(other_id);
  update public.users set role = 'standard' where id = admin_id::uuid;
  get diagnostics n = row_count;
  perform pg_temp.assert(n = 1, 'one admin CAN demote another while a second remains');
  reset role;

  -- other_id is now the only active admin. The self-demotion guard cannot be
  -- what catches this, because no *other* admin exists to attempt it — which is
  -- precisely the case the last-admin guard is for. It is reachable only with
  -- auth.uid() NULL, i.e. the service role or a server-side script.
  begin
    update public.users set is_active = false where id = other_id::uuid;
    perform pg_temp.assert(false, 'the LAST active admin cannot be deactivated, even by the service role');
  exception when check_violation then
    perform pg_temp.assert(true, 'the LAST active admin cannot be deactivated, even by the service role');
  end;

  begin
    update public.users set role = 'standard' where id = other_id::uuid;
    perform pg_temp.assert(false, 'the LAST active admin cannot be demoted, even by the service role');
  exception when check_violation then
    perform pg_temp.assert(true, 'the LAST active admin cannot be demoted, even by the service role');
  end;

  raise notice '--- event_categories (§2.2, FR-ADM-5) ------------------------';

  perform pg_temp.become(user_id);
  select count(*) into n from public.event_categories;
  perform pg_temp.assert(n = 3, 'seeded with Red / Green / Blue, readable by everyone');

  update public.event_categories set name = 'Renamed' where name = 'Red';
  get diagnostics n = row_count;
  perform pg_temp.assert(n = 0, 'a standard user CANNOT rename a category');

  begin
    insert into public.event_categories (name, color_hex, sort_order)
    values ('Sneaky', '#000000', 9);
    perform pg_temp.assert(false, 'a standard user CANNOT create a category');
  exception when insufficient_privilege then
    perform pg_temp.assert(true, 'a standard user CANNOT create a category');
  end;
  reset role;

  perform pg_temp.become(other_id);  -- now an admin
  update public.event_categories set name = 'Crimson' where name = 'Red';
  get diagnostics n = row_count;
  perform pg_temp.assert(n = 1, 'an admin CAN rename a category (FR-ADM-5)');

  insert into public.event_categories (name, color_hex, sort_order)
  values ('Amber', '#DC6803', 4);
  get diagnostics n = row_count;
  perform pg_temp.assert(n = 1, 'an admin CAN create a category');

  begin
    delete from public.event_categories where name = 'Amber';
    perform pg_temp.assert(false, 'nobody can DELETE a category (retire via is_active)');
  exception when insufficient_privilege then
    perform pg_temp.assert(true, 'nobody can DELETE a category (retire via is_active)');
  end;
  reset role;

  -- The colour format is constrained in the database, not just the admin form.
  perform pg_temp.become(other_id);
  begin
    insert into public.event_categories (name, color_hex, sort_order)
    values ('Bad', 'red', 5);
    perform pg_temp.assert(false, 'color_hex must be #RRGGBB');
  exception when check_violation then
    perform pg_temp.assert(true, 'color_hex must be #RRGGBB');
  end;
  reset role;

  raise notice '';
  raise notice 'All RLS assertions passed.';
end;
$$;

-- ---------------------------------------------------------------------------
-- Every table in public must have RLS enabled. This catches the failure mode
-- where a later migration adds a table and forgets the policy block entirely —
-- which is silent, and total.
-- ---------------------------------------------------------------------------
do $$
declare
  unguarded text;
begin
  select string_agg(c.relname, ', ')
    into unguarded
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind = 'r'
    and not c.relrowsecurity;

  if unguarded is not null then
    raise exception 'Tables in public without RLS enabled: %', unguarded;
  end if;

  raise notice 'RLS is enabled on every table in public.';
end;
$$;

rollback;
