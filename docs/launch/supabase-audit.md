# SanOS — Supabase Audit

Date: 2026-06-23
Project: `kcdenqufiajidivysuez` (Asia-Pacific)

## Schema parity

```
node scripts/verify-db.mjs
34/34 ok   0 missing   0 mismatch
```

All migrations 0001–0016 are applied to the live DB; no gaps in numbering; no drift between `types/database.ts` and the live schema.

## RLS

Every user-owned table has `ENABLE ROW LEVEL SECURITY` with matching policies — spot-checked 0003 (core 8 tables), 0009 (12 phase-2 tables), 0012 (dynamic taxonomy), 0016 (memory intelligence). No table found without RLS. **Low risk** — this layer is solid.

## Storage — gap found

| Finding | Severity |
|---|---|
| `lib/storage/buckets.ts` defines 5 buckets and migration `0010` has already created them + per-user-folder RLS policies live in Supabase — but **zero upload code exists anywhere in `app/**`** (no `storage.from()`, no `.upload()`, no signed URLs). | **High** — provisioned attack surface with no feature behind it. |
| `academic_documents` table has `storage_bucket`/`storage_path`/`file_url`/`mime_type`/`file_size_bytes` columns and `IitService.addDocument` accepts them, but no caller anywhere populates them — no upload UI, no route handler. The method's doc comment ("Registers an uploaded document") is aspirational. | Medium — schema-only feature. |

**Recommendation (not actioned this pass — feature work, not hardening):** either ship a minimal upload flow before launch (Supabase Storage signed upload + a file input on `iit-workspace`/`vault`), or drop bucket provisioning until the feature is actually built. Leaving unused buckets live is not a security hole (RLS is correctly scoped) but is needless production surface area.

## Service-role key containment

Grepped all usages of `SUPABASE_SERVICE_ROLE_KEY` — only 3 hits, all server-only:
1. `lib/supabase/admin.ts` — guarded by `import "server-only"`, throws if unset.
2. `scripts/verify-engine.mjs` — CLI script.
3. `.env.local.example` / README — docs only.

No leak path into client components or browser-reachable Server Actions. **Clean.**

## Env

`.env.local` present, 5 keys injected per `verify-db.mjs` output, names match `.env.local.example` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_PROJECT_ID`, `DATABASE_URL`). No undocumented vars found.

## Summary

| Area | Status |
|---|---|
| Migrations | 34/34 — fully applied, no gaps |
| RLS | Fully covered |
| Storage buckets | Provisioned, **unused** (High — feature gap, not a security issue) |
| Document uploads | Schema-only (Medium — feature gap) |
| Service-role key handling | Clean |
| Env config | Clean |
