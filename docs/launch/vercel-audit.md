# SanOS — Vercel Audit

Date: 2026-06-23

## Build process

- `vercel.json` is minimal (`{"framework": "nextjs"}`) — correct, no custom build overrides needed.
- `next.config.ts` is the default scaffold (no custom config) — no `output: "export"`, no rewrites/redirects that could break dynamic routes.
- `npm run build` (`next build`) — see verification run below.

## Environment variables

Required in the Vercel project settings (Production + Preview):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only — must NOT be exposed to Preview deployments from forks if the repo is ever made public)
- `SUPABASE_PROJECT_ID` (only needed for local `db:types`, not required at runtime)
- `NEXT_PUBLIC_SITE_URL` — **newly required** (added this pass) for magic-link email redirects to resolve to the right deployed origin. **Action: set this in Vercel project settings before launch**, otherwise magic-link sign-in will redirect to a broken relative URL in production.

**Critical dependency on this audit's fix:** `lib/supabase/middleware.ts` now `console.error`s if Supabase env vars are missing in production — check Vercel function logs after first deploy to confirm this never fires. If it does, auth is silently disabled for all routes.

## Server Actions / dynamic routes

- All routes are dynamic (server components reading per-request auth state) — no static export, correct for this app.
- Server Actions consistently return `{ok, error}` discriminated results with try/catch (verified during the system audit) — no unhandled-action crash risk found.
- `app/api/search/route.ts` is the only API route; self-guards with its own `auth.getUser()` check (not inside the `(app)` layout group) — correct.

## Error boundaries

Previously **none existed** anywhere in the app — any production error rendered Vercel's default unstyled error page with no recovery action. **(fixed this pass)**: added `app/error.tsx` (global, includes `<html>/<body>` per Next.js's required global-error contract) and `app/(app)/error.tsx` (styled, scoped to the authenticated shell, with "Try again"/"Back to Overview").

## Verification gates run

- `tsc --noEmit` — clean.
- `eslint` — clean (0 errors; pre-existing warnings unrelated to this pass, see `prelaunch-checklist.md`).
- `next build` — see below.

## Open items for launch

| Item | Severity |
|---|---|
| Confirm `NEXT_PUBLIC_SITE_URL` is set in Vercel Production + Preview before shipping magic link | High |
| Confirm `SUPABASE_SERVICE_ROLE_KEY` is marked "Production only" if Preview deployments are ever exposed publicly (e.g. PR previews from forks) | Medium |
| No staging/preview-specific Supabase project — Preview deployments currently point at the same production DB as Production deployments (single `.env` set). Acceptable for a personal app with one user; flag if this ever needs multi-environment isolation | Low |
