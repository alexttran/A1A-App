# A1A Field App — Build Plan

**Companion to:** `requirements.md` v0.1
**Last updated:** August 15, 2026

---

## Guiding principles

**Vertical slices, not horizontal layers.** Each phase ships one feature area end to end — database, policies, API, screens, states — rather than building all the tables, then all the screens. Every phase ends with something demonstrable.

**Ship the hard, valuable thing early.** Preference cards (Phase 2) are why this app exists. They come before documents and calendar so there is maximum time to iterate on the flow that actually determines adoption.

**Enforce permissions at the database.** Row-level security policies are written in the same phase as the feature they protect, never deferred. A client-side role check is a UX affordance, not a security control.

**Estimates assume one full-time developer** who knows React and TypeScript but is new to React Native and Supabase. Adjust proportionally. Ranges reflect real uncertainty, not padding.

---

## Phase 0 — Foundations

**~1–1.5 weeks. Everything else depends on this.**

### Infrastructure

- Create the Supabase project (dev and prod). Enable email auth, disable public signup.
- Provision storage buckets: `documents` (private), with a 50 MB per-object cap.
- Set up the repo: Expo + TypeScript, ESLint, Prettier, absolute imports, strict TS config.
- Configure EAS Build and **produce a custom dev client immediately** (see requirements §8.1).
- Wire Sentry on both client and server.

### Schema and access foundation

- Migrations for `users` and `event_categories`, seeded with Red / Green / Blue.
- A `users` row auto-created on auth signup via trigger, so the app never has an authenticated user without a profile.
- Helper SQL functions `auth_role()` and `is_admin()` — every later RLS policy will call these, so getting them right once pays off repeatedly.
- Generate TypeScript types from the schema; add this to the build script so types can't drift.

### App shell

- Auth screens: login, forgot password, set password from invite link.
- Secure session persistence and silent refresh on launch.
- Expo Router tab navigation: Bulletin, Directory, Documents, Calendar, More.
- Design system pass: colors, type scale, spacing, and the shared primitives — `Button`, `Card`, `Input`, `EmptyState`, `ErrorState`, `Skeleton`, `ConfirmDialog`. Building these now prevents four inconsistent versions later.
- Global network-status banner (requirements §3).
- TanStack Query provider with sane defaults for retry, stale time, and error handling.

### Exit criteria

A user can install the dev client, log in, land on an empty tab shell, kill the app, reopen it, and still be logged in. A throwaway screen renders a PDF successfully, confirming the native module choice.

---

## Phase 1 — Bulletin board

**~1 week. The simplest complete vertical slice; it validates the patterns everything else copies.**

- `announcements` table, RLS policies, indexes.
- List screen: pinned section, infinite scroll, pull-to-refresh, skeletons, empty state.
- Detail screen.
- Compose and edit screens with validation and unsaved-changes guard.
- Delete with confirmation; admin pin/unpin.
- URL auto-linking in bodies.
- First-use PHI reminder on the compose screen (requirements §1.4).

**Exit criteria:** FR-BB-1 through FR-BB-9 pass. A Standard user cannot delete another user's post — verified by attempting the API call directly, not just by checking that the button is hidden.

**Decision needed before this phase:** Q1 (can Standard users post announcements?).

---

## Phase 2 — Directory and preference cards

**~2–3 weeks. The heart of the app.**

### 2a. Directory

- `hospitals` and `surgeons` tables, RLS (admin write, all read), trigram indexes.
- Hospital list with search; hospital detail with affiliated surgeons.
- Surgeon detail: contact block with tappable phone, email, and address.
- Global surgeon search across hospitals.
- Admin CRUD forms for both.
- If Q5 turns up an existing spreadsheet, write the import script here.

### 2b. Preference cards

- `preference_cards` table with `version` column for optimistic concurrency.
- `preference_card_revisions` table, the trigger that populates it, and **revoked write grants** so the log is immutable by construction.
- Preference section on the surgeon detail screen, with a deliberate empty state — this is the first thing users see on every new surgeon, and it should invite the first entry rather than look broken.
- Add and edit card screens.
- Concurrency conflict handling (FR-PREF-13): detect the version mismatch, preserve the user's draft, name who else edited it.
- History screen: chronological revision list, action labels, author, absolute timestamps, and before/after values on changed fields.
- Sort toggle (recently updated / alphabetical).
- Admin soft delete.

**Exit criteria:** FR-PREF-1 through FR-PREF-13 pass. Two devices editing the same card produce a clean conflict message rather than a silent overwrite. The revision log correctly reflects a create → edit → edit → delete sequence.

**Gate — do not skip.** Put this in front of 3–5 actual reps before starting Phase 3. Ask them to add a preference for a surgeon they know, then find one someone else added. If either task is awkward, fix it now. This is the flow that determines whether the app gets used.

---

## Phase 3 — Documents

**~2 weeks. The most technically fiddly area.**

- `folders` and `documents` tables, with a materialized `path` column maintained by trigger, plus depth and sibling-name-uniqueness constraints.
- Storage bucket policies: authenticated read, authenticated write, no public access.
- Folder browser with breadcrumbs and back navigation.
- Create folder.
- Upload: document picker, image picker, camera. Client-side type and size validation *before* transfer starts.
- Resumable upload with progress, cancel, and retry. Over-10 MB-on-cellular warning.
- PDF viewer (scroll, pinch-zoom, page navigation).
- Image viewer (full-screen, pinch-zoom).
- OS share sheet export.
- Rename and delete, with the item-count warning on non-empty folders.
- Tree-wide name search.
- Signed, time-limited URLs for all file access (FR-DOC-13).

**Exit criteria:** FR-DOC-1 through FR-DOC-13 pass. A signed URL fails after expiry. A 51 MB file is rejected without consuming bandwidth. An upload interrupted by airplane mode can be retried.

**Decision needed before this phase:** Q2 (who can delete documents?).

---

## Phase 4 — Calendar

**~1.5–2 weeks.**

- `events` table with the start/end check constraint and indexes.
- Month view with category-colored markers and multi-day spanning.
- Day detail list beneath the grid.
- Agenda view with persisted view preference.
- Event detail, including deep links to any linked hospital or surgeon.
- Admin create/edit forms: date-time pickers, all-day toggle, category picker, optional hospital and surgeon selectors.
- Category filter with persisted state and an unmistakable active-filter indicator.
- Title search covering past and future, respecting active filters.
- Timezone handling verified across a DST boundary.

**Exit criteria:** FR-CAL-1 through FR-CAL-12 pass. A Standard user sees no create affordance and cannot create an event via a direct API call. An event created in one timezone displays correctly in another.

---

## Phase 5 — Admin and hardening

**~1–1.5 weeks.**

- User management: list, invite, role change, deactivate/reactivate.
- Last-admin and self-demotion guards (FR-ADM-4).
- Event category management (FR-ADM-5).
- Accessibility audit against NFR-6: contrast, touch targets, screen-reader labels, dynamic type. Confirm no information is conveyed by color alone.
- Full error-state sweep: every screen tested with no network, slow network, and a server error.
- Performance pass against NFR-1 with realistic data volumes — seed a few thousand documents and events rather than testing against twenty rows.
- Security review: attempt every write in the §2.2 matrix as a Standard user via direct API calls.
- App icon, splash screen, store metadata.

---

## Phase 6 — Pilot and launch

**~2 weeks, mostly not engineering time.**

- Content seeding: hospitals, surgeons, and the initial document tree (requirements §8.4). **This needs a named non-engineering owner.** An empty app on launch day gets opened once.
- Internal pilot with 5–10 users for one to two weeks. Collect friction, not feature requests.
- Fix what the pilot surfaces.
- Distribution setup per Q3 — start this early, since store review or MDM provisioning has a lead time that is easy to underestimate.
- One-page user guide and a short admin guide.
- Rollout.

---

## Sequencing summary

| Phase | Scope | Estimate | Cumulative |
|---|---|---|---|
| 0 | Foundations | 1–1.5 wk | 1.5 wk |
| 1 | Bulletin board | 1 wk | 2.5 wk |
| 2 | Directory + preference cards | 2–3 wk | 5.5 wk |
| 3 | Documents | 2 wk | 7.5 wk |
| 4 | Calendar | 1.5–2 wk | 9.5 wk |
| 5 | Admin + hardening | 1–1.5 wk | 11 wk |
| 6 | Pilot + launch | 2 wk | 13 wk |

**Roughly 11–13 weeks to launch for one developer.** Two developers can parallelize Phases 3 and 4 after Phase 2 completes, bringing it closer to 8–9 weeks — but Phases 0 through 2 are hard to split usefully, since Phase 0 is foundational and Phase 2 is where design iteration happens.

---

## Post-launch roadmap

**Phase 7 — Push notifications** (~1 week). Device token registration, `user_devices` table, fan-out on announcement insert, per-user preferences. Low complexity, high perceived value; a good first post-launch win.

**Phase 8 — AI chatbot over documents** (~3–5 weeks). The estimate range is wide because it depends almost entirely on document quality. Sequence it as:

1. **Text extraction pipeline first, before any AI work.** Extract from every uploaded document and measure what fraction yields usable text. If most documents are scans, OCR becomes the bulk of the project and the estimate goes to the high end.
2. Chunking and embedding into pgvector, with a backfill job for existing documents.
3. Retrieval and answer generation via an Edge Function, with strict grounding — answer only from retrieved context, and say so when the context doesn't contain the answer.
4. Chat UI with tappable citations deep-linking to source documents.
5. Evaluation against a set of real questions from reps before rollout. An assistant that confidently invents a specification is worse than no assistant.

**Phase 9 — candidates, in rough priority order.** Offline caching of surgeon preferences (highest field value); full-text document search (largely free once Phase 8's extraction exists); revertible preference revisions; recurring events; a web companion.

---

## What could go wrong

| Risk | Signal to watch for | Response |
|---|---|---|
| Preference card flow doesn't fit how reps actually work | Pilot users add one card and never return | The Phase 2 gate exists to catch this before three more phases are built on top |
| PDF rendering issues on specific devices | Blank viewer, crashes on large files | Verified in Phase 0, not Phase 3 — that is the whole point of testing it early |
| App launches empty | Nothing to see on day one | Phase 6 seeding, owned by a name, not a team |
| Scanned documents make the chatbot impractical | Text extraction yields little on real files | Measure in Phase 8 step 1 before committing to the rest |
| Requirements grow mid-build | New asks arriving during Phases 2–4 | Log them for Phase 9; the phase structure exists partly to make "not now" easy to say |
| PHI appears in a free-text field | A patient name in an event title | Admin deletion, plus training at onboarding |