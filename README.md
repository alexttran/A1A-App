# A1A Field App

Internal React Native app for A1A field representatives. See
[`REQUIREMENTS.md`](./REQUIREMENTS.md) for what it does and
[`ROADMAP.md`](./ROADMAP.md) for the build plan. Currently in **Phase 0 —
Foundations**.

> **No PHI.** This app must never store, transmit, or display protected health
> information. See requirements §1.4.

---

## Getting started

```bash
nvm use                 # Node 24.11.1, pinned in .nvmrc
npm install
cp .env.example .env    # then fill in real values — see SETUP.md
npm start
```

Running the app requires a **custom EAS development client**, not Expo Go — the
PDF viewer is a native module (requirements §8.1). Build instructions land in
Checkpoint 6.

Full backend setup (Supabase project, migrations, first admin user) is in
`SETUP.md`, added in Checkpoint 2.

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
