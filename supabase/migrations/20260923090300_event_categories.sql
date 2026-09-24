-- ---------------------------------------------------------------------------
-- Phase 0 — public.event_categories (requirements §7.1).
--
-- Seeded with Red / Green / Blue. Open question Q4 asks what these are really
-- called; the answer does not block anything, because FR-ADM-5 lets an admin
-- rename and recolour them from inside the app without a release.
--
-- The calendar that consumes these arrives in Phase 4. The table is here because
-- events.category_id is NOT NULL, so the categories must exist before the first
-- event can.
-- ---------------------------------------------------------------------------

create table public.event_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  -- Rendered directly into a style, so the format is constrained here rather
  -- than trusted from the admin form.
  color_hex text not null check (color_hex ~* '^#[0-9a-f]{6}$'),
  sort_order integer not null,
  is_active boolean not null default true
);

comment on table public.event_categories is
  'Calendar event categories. is_active retires one without breaking events that reference it.';

comment on column public.event_categories.is_active is
  'Soft-retire flag (NFR-5). Inactive categories stay readable so existing events still render a label and colour, but are not offered when creating an event.';

-- The picker and the filter row both read every category in display order.
create index event_categories_sort_idx on public.event_categories (sort_order);

-- ---------------------------------------------------------------------------
-- Seed (ROADMAP Phase 0). Colours match src/theme categoryPalette, which is
-- contrast-checked against NFR-6.
--
-- Guarded by NOT EXISTS rather than ON CONFLICT: there is no unique constraint
-- on name (admins may legitimately end up with two categories named similarly),
-- so this seeds only into a genuinely empty table. That keeps `supabase db
-- reset` idempotent without inventing a constraint the requirements do not ask
-- for.
-- ---------------------------------------------------------------------------
insert into public.event_categories (name, color_hex, sort_order)
select v.name, v.color_hex, v.sort_order
from (
  values
    ('Red', '#D92D20', 1),
    ('Green', '#12855F', 2),
    ('Blue', '#2563EB', 3)
) as v (name, color_hex, sort_order)
where not exists (select 1 from public.event_categories);

-- ---------------------------------------------------------------------------
-- Grants and RLS.
-- ---------------------------------------------------------------------------
revoke all on public.event_categories from anon, authenticated;
grant select on public.event_categories to authenticated;
grant insert, update on public.event_categories to authenticated;

alter table public.event_categories enable row level security;

-- Everyone reads every category, including retired ones: an event created under
-- a since-retired category must still render its name and colour rather than a
-- blank chip.
create policy "event_categories: active users read all"
  on public.event_categories
  for select
  to authenticated
  using (public.auth_role() is not null);

-- §2.2 — "Manage event categories" is admin-only.
create policy "event_categories: admins insert"
  on public.event_categories
  for insert
  to authenticated
  with check (public.is_admin());

create policy "event_categories: admins update"
  on public.event_categories
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- No DELETE policy or grant, by design. events.category_id is NOT NULL, so
-- deleting a category in use would either fail on the foreign key or orphan
-- history. Retiring via is_active is the supported path (NFR-5).
