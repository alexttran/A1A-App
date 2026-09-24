# Backend setup

Everything needed to go from a fresh clone to a working Supabase project.

You only need this to work on backend-connected features. The layout prototype
(`npm run web`) runs with no `.env` and no database — see README "Prototype
preview".

**Status:** the Phase 0 schema is written but has never been executed. Nothing in
this repository has run against a real Postgres yet. Expect to fix something on
the first `db:reset`; that is what step 3 is for.

---

## What exists so far

| Migration                        | Contents                                                    |
| -------------------------------- | ----------------------------------------------------------- |
| `..._extensions_and_helpers.sql` | `pg_trgm`; `auth_role()`, `is_admin()`, `set_updated_at()`  |
| `..._users.sql`                  | `public.users`, signup trigger, FR-ADM-4 guards, RLS        |
| `..._event_categories.sql`       | `public.event_categories` seeded Red/Green/Blue, RLS        |
| `..._documents_bucket.sql`       | private `documents` bucket, 50 MB cap, read/upload policies |

Tables for announcements, hospitals, surgeons, preference cards, folders,
documents, and events arrive with their features in Phases 1–4 (ROADMAP), each
with its RLS policies in the same migration.

---

## 1. Local development

Requires **Docker Desktop running** — `supabase start` boots Postgres, Auth,
Storage, and Studio in containers.

```bash
nvm use
npm install
npm run db:start      # first run pulls several GB of images
```

`db:start` prints an API URL, an anon key, and a service role key. Copy the first
two into `.env`:

```bash
cp .env.example .env
```

```
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=<anon key from db:start>
APP_VARIANT=development
```

Leave `SENTRY_DSN` empty for now — `src/lib/env.ts` treats it as optional and
disables Sentry rather than failing.

> Config is read at **config-evaluation time** by `app.config.ts`. A running
> bundler will not notice a `.env` change; restart with `npm start -- --clear`.

Apply the migrations and confirm they work:

```bash
npm run db:reset      # drops, re-runs every migration, re-seeds
```

Studio is at http://127.0.0.1:54323.

## 2. Generate the types

`src/lib/database.types.ts` was **hand-written** to match the migrations, because
no database was available when they were authored. Replace it with the real thing
as soon as you have one:

```bash
npm run types:generate:local     # local Docker project
npm run typecheck
```

Treat any diff as a bug in the hand-written file, not in the generator. From this
point the file is generated output — never edit it by hand.

## 3. Run the RLS tests

**Do this before trusting any of it.** The policies are the entire authorization
model (NFR-3), and they have not been executed.

```bash
psql "$(npx supabase status -o json | jq -r .DB_URL)" -f docs/rls-tests.sql
```

Every assertion prints `PASS`. The first failure aborts the run and rolls back —
nothing is left behind either way. The script also asserts that every table in
`public` has RLS enabled, which is the check that catches a future migration
adding a table and forgetting its policies.

The SQL has been checked against the Postgres grammar but never executed, so
expect to fix something here on the first run.

---

## 4. Hosted projects

Create **two** projects at https://supabase.com/dashboard — `a1a-field-dev` and
`a1a-field-prod`. Pick the region closest to your users. Save the database
password somewhere durable; it is shown once.

For each project:

```bash
npx supabase login                       # opens a browser, stores an access token
npx supabase link --project-ref <ref>    # <ref> is in the dashboard URL
npm run db:push                          # applies the migrations
npm run types:generate                   # regenerate against the hosted schema
```

Then, in the dashboard:

**Authentication → Providers → Email**

- **Disable "Enable sign ups".** Non-negotiable. Requirements §2.1 is
  invitation-only, and the signup trigger reads `role` from invite metadata — with
  self-signup on, anyone could self-assign admin. `supabase/config.toml` sets this
  for local development; the hosted project is a separate setting.
- Leave email confirmations on.

**Authentication → URL Configuration**

- Site URL: `a1afield://`
- Redirect URLs: `a1afield://auth/callback`, `a1afield://auth/reset-password`
- Add `http://localhost:8081` while the web prototype is still in use.

**Authentication → Email Templates**

Point the invite and password-reset templates at the redirect URLs above. The
defaults link to a web page that does not exist for this app.

**Project Settings → Data API**

Copy the project URL and the **anon / publishable** key into the environment for
that build variant.

> Never copy the **service role** key anywhere in this repository — not `.env`,
> not `app.config.ts`, not an `EXPO_PUBLIC_*` variable. It bypasses RLS entirely.
> Server-side work that needs it belongs in an Edge Function, where the platform
> supplies it as a function secret.

### Storage

The `documents` bucket is created by a migration, so `db:push` provisions it.
Verify under **Storage** that it is **not public** and shows a 50 MB per-file
limit.

Its UPDATE and DELETE policies are deliberately missing until Phase 3, because
the own-upload-vs-any-upload split in §2.2 needs `documents.uploaded_by`. Until
then clients can read and upload but not modify or remove.

---

## 5. Create the first admin

The signup trigger defaults everyone to `standard`, and `role` is only honoured
from invite metadata. So the first admin has to be made by hand — after that,
admins invite everyone else from inside the app.

In the dashboard: **Authentication → Users → Add user**, with "Auto Confirm User"
checked. Then in the **SQL Editor**:

```sql
update public.users
   set role = 'admin'
 where email = 'you@yourcompany.com';
```

This runs as `postgres`, so it bypasses RLS and the FR-ADM-4 guards — which is
also the break-glass path if you ever lock yourself out.

Verify:

```sql
select email, role, is_active from public.users;
```

Subsequent users are invited with their role attached:

```ts
await supabase.auth.admin.inviteUserByEmail(email, {
  data: { full_name: 'Jane Rep', role: 'standard' },
  redirectTo: 'a1afield://auth/callback',
});
```

That call needs the service role key, so it belongs in an Edge Function, not in
the app. It lands with user management in Phase 5.

---

## Environment variables

`.env.example` documents all of them. Summary of where each lives:

| Variable                | Local     | EAS build profile | Notes                                     |
| ----------------------- | --------- | ----------------- | ----------------------------------------- |
| `SUPABASE_URL`          | `.env`    | `eas.json` env    | Public                                    |
| `SUPABASE_ANON_KEY`     | `.env`    | `eas.json` env    | Public, RLS-scoped                        |
| `SENTRY_DSN`            | `.env`    | `eas.json` env    | Public; optional, absent disables Sentry  |
| `APP_VARIANT`           | `.env`    | `eas.json` env    | `development` / `preview` / `production`  |
| `SENTRY_AUTH_TOKEN`     | —         | EAS secret        | **Never** in the repo                     |
| `SUPABASE_ACCESS_TOKEN` | shell env | CI secret         | For `types:generate`; or `supabase login` |
| Service role key        | —         | —                 | **Never** anywhere in this repo           |

---

## Keeping types honest

`npm run types:check` regenerates against the linked project and diffs the result
against the checked-in file. It is not part of `npm run check`, which must keep
working offline — wire it into CI instead, so a migration that lands without a
regenerated type file fails the build (ROADMAP Phase 0).

---

## Troubleshooting

**`supabase start` hangs or errors on ports** — something else is on 54321–54324.
`npm run db:stop`, then start again.

**"Missing required config value" on launch** — `.env` is absent or incomplete,
or the bundler was started before it existed. Restart with `npm start -- --clear`.

**Every query returns an empty array, no error** — the normal shape of an RLS
denial: policies filter rows rather than raising. Check that the user has a
`public.users` row and `is_active = true`. `select public.auth_role();` as that
user returns `NULL` when either is wrong.

**"infinite recursion detected in policy"** — a policy on `public.users` is
reading `public.users` without going through the SECURITY DEFINER helpers, or
`FORCE ROW LEVEL SECURITY` was enabled on it. See the note in migration 0001.
