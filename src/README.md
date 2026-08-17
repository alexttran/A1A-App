# Source layout

The split is **routes vs. code**. `app/` at the repo root contains nothing but
Expo Router route files; everything importable lives under `src/` and is reached
through the `@/` alias. That keeps the router's file-based conventions from
leaking into the rest of the codebase, and means a route file can be moved,
renamed, or deleted without touching the logic it renders.

```
app/                      Expo Router routes ONLY. Thin files that compose a
                          screen out of feature code. No data fetching, no
                          business logic, no styling beyond layout.

src/
  components/ui/          Design-system primitives: Button, Card, Input,
                          EmptyState, ErrorState, Skeleton, ConfirmDialog,
                          Banner. Generic, feature-agnostic, no imports from
                          src/features/. This is the boundary that stops four
                          slightly-different Buttons from existing by Phase 4.

  features/<area>/        One directory per functional area — bulletin,
                          directory, documents, calendar, admin, auth. Each
                          owns its screens/, hooks/ (TanStack Query hooks),
                          api/ (Supabase calls), and schemas/ (Zod). Features
                          may import from components/ui, lib, and theme, but
                          NOT from each other. Cross-feature needs get promoted
                          into src/lib or src/components/ui.

  lib/                    Clients and cross-cutting utilities: the Supabase
                          client, generated database types, the TanStack Query
                          client, Sentry setup, env reading, date/format
                          helpers. No React components.

  stores/                 Zustand stores. Deliberately narrow — auth session
                          and UI preferences only (requirements §6.2). Server
                          data belongs in TanStack Query, never here.

  theme/                  Design tokens: colors, typography, spacing, radii,
                          shadows. Values only, no components.

  hooks/                  App-wide React hooks that are not feature-specific
                          and not tied to a store (e.g. network status).

supabase/
  migrations/             Numbered, ordered SQL. Append-only — once a migration
                          has been applied to a real project, never edit it;
                          write a new one.

docs/                     Operational documentation, including the RLS policy
                          test queries.
```

## Rules of thumb

- **Import direction is one-way.** `app/` → `features/` → `components/ui/`,
  `lib/`, `theme/`. Never the reverse, and never feature-to-feature.
- **Anything a second feature needs gets promoted**, not copy-pasted.
- **Permissions are enforced in the database**, not here. A role check in this
  tree hides an affordance; it never protects data (requirements NFR-3).
