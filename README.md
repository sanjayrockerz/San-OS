# SanOS — Personal Engineering OS

A personal DSA / engineering operating system: a problem engine, spaced-revision
("forgetting") engine, evolving knowledge taxonomy, roadmaps, an academic (IIT)
workspace, and an analytical AI mentor — built on Next.js 16 (App Router,
Turbopack), React 19, Tailwind v4 and Supabase (Postgres + RLS).

## Getting started

```bash
npm install
npm run dev          # http://localhost:3000
```

Environment lives in `.env.local` (gitignored): `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_PROJECT_ID`.

## Architecture

```
Server Action / Route Handler → Services → Repositories → Supabase (Postgres + RLS)
```

- **Repositories** (`lib/repositories`) are the only direct database access.
- **Services** (`lib/services`) hold business logic and orchestrate cross-domain
  workflows. Every state-changing action emits an immutable domain **event**.
- **React components** hold no analytics logic and run no direct queries. The
  overview consumes a single read model: `DashboardAggregationService.snapshot`.

See **[docs/architecture/phase5-lifecycle.md](docs/architecture/phase5-lifecycle.md)**
for the full lifecycle (problem creation, revision, taxonomy evolution, event
propagation, dashboard aggregation, knowledge graph) with flow diagrams.

## Database

Migrations live in `database/migrations` (`0001`–`0012`). The live project is at
full schema parity — confirmed by `node scripts/verify-db.mjs` (25/25 ok).

- Canonical paste-and-run bundle: `database/migrations/_production_bundle_phase5.sql`
  (idempotent, covers `0004`–`0012`). Safe to re-run on the live DB — it only
  adds what's missing. Paste it into the Supabase SQL Editor when standing up a
  fresh project.

## Scripts

```bash
npm run type-check               # tsc --noEmit
npm run lint                     # eslint
npm run build                    # next build

node scripts/verify-db.mjs       # schema parity: every table + column present (anon key)
node scripts/verify-engine.mjs   # full lifecycle runs on the live DB (service role, throwaway user, auto-cleanup)
```

Both verify scripts exit non-zero on failure and print a per-check ✅/❌ report.
