# A1A Field App

Internal React Native app for A1A field representatives. See
[`REQUIREMENTS.md`](./REQUIREMENTS.md) for what it does and
[`ROADMAP.md`](./ROADMAP.md) for the build plan. Currently in **Phase 0 —
Foundations**, with a full-coverage layout prototype in front of it — see
**Prototype preview** below.

> **No PHI.** This app must never store, transmit, or display protected health
> information. See requirements §1.4.

---

## Getting started

```bash
nvm use                 # Node 24.11.1, pinned in .nvmrc
npm install
npm run web             # the clickable layout prototype, at http://localhost:8081
```

`npm run web` needs no `.env` and no backend — see **Prototype preview** below.

For the phone build:

```bash
cp .env.example .env    # then fill in real values — see SETUP.md
npm start
```

Running on a device requires a **custom EAS development client**, not Expo Go —
the PDF viewer is a native module (requirements §8.1). Build instructions land in
Checkpoint 6.

Full backend setup (Supabase project, migrations, first admin user) is in
`SETUP.md`, added in Checkpoint 2.

---

## Prototype preview

`npm run web` serves a complete, clickable version of all four functional areas
for layout review, ahead of the backend. It is the same code the phone build
runs: every screen is React Native primitives, rendered through
`react-native-web`. Nothing in it is throwaway web work.

**What is real:** navigation, every screen and state, the permission differences
between Admin and Standard, form validation, the preference-card revision log,
and the concurrency-conflict flow (FR-PREF-13).

**What is stubbed:** there is no network. Data is seeded in memory
(`src/lib/mock/data.ts`) and resets on reload. The PDF and image viewers are
chrome around a placeholder, because `react-native-pdf` is a native module with
no web build (§8.1). Uploads show real progress against a fake transfer.

The browser shows the app inside a phone frame with a review panel beside it:

- **View as** — switch between Admin and Standard. The §2.2 permission matrix
  changes what appears on nearly every screen, and both need reviewing.
- **Simulate offline** — shows the non-blocking banner from §3.

A few prototype-only affordances are marked as such in the UI: "Simulate someone
else saving first" on the preference card editor, and the oversized-file and
failed-upload entries in the Documents upload sheet. They exist so the error and
conflict paths can be reviewed without a second device or a flaky connection.

The seed data contains **no PHI** and deliberately models the §1.4 boundary:
hospitals, surgeons, and how to work with them — never a patient or a case.

### Open questions this prototype takes a position on

The prototype had to resolve the open questions in requirements §9 to render a
screen at all. These are choices to react to, not decisions:

| #   | Question                      | What the prototype does                                                                                                                     |
| --- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Q1  | Admin-only announcements?     | **No** — any user can post; only admins pin, and only authors or admins edit and delete.                                                    |
| Q2  | Admin-only document deletion? | **No** — users manage their own uploads and folders; admins manage anything. The typed confirmation on a non-empty folder is the guardrail. |
| Q4  | Real category names?          | Ships Red / Green / Blue, plus an admin screen that renames and recolours them without a release.                                           |

## Scripts

| Script                    | What it does                             |
| ------------------------- | ---------------------------------------- |
| `npm start`               | Start the bundler against the dev client |
| `npm run ios` / `android` | Build and run natively                   |
| `npm run lint`            | ESLint                                   |
| `npm run format`          | Prettier, writing in place               |
| `npm run typecheck`       | `tsc --noEmit`                           |
| `npm run check`           | All three — run this before committing   |

## Toolchain

| Layer           | Choice                                 |
| --------------- | -------------------------------------- |
| Node            | 24.11.1 (`.nvmrc`)                     |
| Expo SDK        | 57 (React Native 0.86.2, React 19.2.3) |
| Language        | TypeScript 6, strict                   |
| Navigation      | Expo Router (typed routes)             |
| Package manager | npm                                    |

## Project layout

Routes live in `app/`; everything else lives in `src/` behind the `@/` alias.
The full convention, including the import-direction rules, is documented in
[`src/README.md`](./src/README.md).

Two directories are prototype scaffolding with a defined replacement:

| Now                                                  | Becomes                                                                  |
| ---------------------------------------------------- | ------------------------------------------------------------------------ |
| `src/lib/mock/` — seeded data and an in-memory store | Supabase client + TanStack Query hooks under each `features/<area>/api/` |
| `src/lib/storage.ts` — `localStorage` shim           | `expo-secure-store` for the session, async storage for preferences       |

`src/stores/` uses React context rather than Zustand for now, to keep the
prototype dependency-free. The hook signatures (`useSession`, `useUiPrefs`) are
what the Zustand versions will expose, so no screen changes when they land.

## Configuration and secrets

Config is read from environment variables in `app.config.ts` and surfaced to the
app through `expo-constants` (`src/lib/env.ts`). `.env.example` documents every
variable.

**Everything in `app.config.ts` ships inside the app bundle and is public.** The
Supabase _anon_ key belongs there — it is RLS-scoped and designed for clients.
The Supabase _service role_ key never does; it bypasses row-level security
entirely and must not appear anywhere in this repository. The same goes for the
Sentry auth token, which lives only in EAS secrets. There is a comment saying so
at the point the config is read.

---

## Deviations from requirements

Things where the requirements and the code disagree, and why. Each needs a
ruling from the requirements owner.

### 1. Minimum iOS version is 16.4, not 15

Requirements §3 asks for **iOS 15+**. Expo SDK 56 and later (React Native 0.85+)
hard-require **iOS 16.4**; `expo-build-properties` refuses to build below it, so
this is not a setting we can override.

The options are:

- **Accept iOS 16.4** (current choice). Excludes iPhone 6s/7/SE-1st-gen. Every
  iPhone 8 and later runs it.
- **Pin to Expo SDK 55** (React Native 0.83), the last release supporting iOS
  15.1. Costs an SDK upgrade later and a smaller pool of libraries tested
  against it.

Android is unaffected — requirements §3 asks for API 29 (Android 10), which is
above Expo's floor of 21 and is set explicitly in `app.config.ts`.

### 2. New Architecture is not optional

From SDK 55 the React Native New Architecture is always on and the
`newArchEnabled` config key was removed. Consequence for Checkpoint 6: any
native module added to this project must ship Fabric/TurboModule support. There
is no legacy-bridge fallback to retreat to if `react-native-pdf` misbehaves.
