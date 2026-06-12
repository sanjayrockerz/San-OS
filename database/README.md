# Database

SQL source of truth for SanOS / DSA OS, organised for Supabase.

```
database/
  migrations/   ordered, idempotent schema changes (the source of truth)
  seeds/        idempotent reference data (run with the service role)
  functions/    readable copies of reusable SQL/PLpgSQL functions
  views/        readable copies of SQL views
```

## Migrations (apply in order)

| File                                      | Purpose                                            |
| ----------------------------------------- | -------------------------------------------------- |
| `0001_init_extensions_and_helpers.sql`    | pgcrypto, enum types, `set_updated_at()` trigger fn |
| `0002_core_schema.sql`                    | 8 core tables, indexes, `updated_at` triggers      |
| `0003_rls_policies.sql`                   | Enable RLS + policies on every table               |

## Seeds

| File                                  | Purpose                            |
| ------------------------------------- | ---------------------------------- |
| `0001_seed_topics_and_patterns.sql`   | Global topics + common DSA patterns |

## How to apply

**Supabase CLI (recommended)** — copy each migration into `supabase/migrations/`
with a timestamped name and run:

```bash
supabase db push          # apply migrations to the linked project
psql "$DATABASE_URL" -f database/seeds/0001_seed_topics_and_patterns.sql
```

**MCP / dashboard** — paste each file into the SQL editor (or
`apply_migration`) in filename order, then run the seed.

After applying, regenerate types:

```bash
npm run db:types          # writes types/database.ts
```

## Conventions

- uuid primary keys via `gen_random_uuid()`.
- `user_id` on every user-owned table (FK to `auth.users`).
- `created_at` / `updated_at` on every table; `updated_at` maintained by trigger.
- RLS enabled on every table; user data isolated by `auth.uid() = user_id`.
  Global taxonomy (`topics`, `patterns`) is read-only to authenticated users
  and written only via the service role (seeds).
