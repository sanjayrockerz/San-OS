# SanOS — Prelaunch Checklist

Date: 2026-06-24. Source audits: `system-audit.md`, `supabase-audit.md`, `vercel-audit.md`.

## Verification gates (must all be green before shipping)

- [x] `node scripts/verify-db.mjs` — 34/34 schema parity
- [x] `node scripts/verify-engine.mjs` — 12/12 end-to-end writes
- [x] `npm run lint` — 0 errors (8 pre-existing unused-var warnings, none introduced this pass)
- [x] `npm run type-check` — clean
- [x] `npm run build` — 27/27 routes compile

## DSA lifecycle (Problem → Reflection → Revision → Memory → Coach → Mission Control)

- [x] Verified end-to-end via `verify-engine.mjs` (problem→attempt→reflection→code→revision→roadmap→activity→daily_log→event→timeline→dashboard, all pass against the live DB).
- [x] `createLearningEntry` fans out memory/taxonomy evolve fail-soft — confirmed in code.
- [ ] No graded-recall revision-session UI yet (memory: `recall_grades` write path exists via `gradeRecall()`, no UI). Not blocking for launch, tracked as a known gap.

## Knowledge lifecycle (Concept → Resource → Coverage → Coach Recommendation)

- [x] Concepts, resources, coverage gaps (`learning-gap-engine`), and coaching (`knowledge-coach`) are all wired into `/knowledge` and `/concepts`.
- [ ] `GpaProjectionService` and parts of `academic-health`/`resource-effectiveness` are built but not fully cross-linked into a single coherent "what should I do next" surface — flagged in `system-audit.md` as a duplication/orphan risk, not fixed this pass (would require product decisions about which engine wins).

## Academic lifecycle (Assignment → Risk → Coach → Completion)

- [x] IIT Workspace assignment CRUD verified present (`iit-workspace/[id]` + actions).
- [ ] Document upload is schema-only — `academic_documents` has no ingestion path; storage buckets are provisioned but unused. **Decide before launch: ship a minimal upload flow, or remove the unused bucket provisioning.**

## Habit lifecycle (Reminder → Notification → Missed Work → Recovery)

- [x] `HabitEngineService.evaluateForUser` verified and **performance-fixed** this pass (was 4x N+1 query loops on every overview/notifications load; now batched via `findExistingSourceIds`/`updateMany`).

## Coach lifecycle (Recommendation → Start → Complete → Outcome)

- [x] `StudentIntelligenceCoreService` is the single consolidated recommendation engine per architecture doc.
- [ ] **`AiService` is a confirmed orphan** — zero direct callers, fully superseded by `StudentIntelligenceCoreService`. Not deleted this pass (destructive removal needs explicit sign-off) — recommend deleting in a follow-up.
- [ ] `MemoryCoachService`/`CoachOutcomeService` shared instances are unused; 3 separate private instantiations exist instead. Wasteful, not a correctness bug.

## Authentication

- [x] Google OAuth — verified, consent-denial now distinguished from generic failure.
- [x] Email/password — "email not confirmed" now shows friendly copy instead of raw Supabase error.
- [x] Magic link — **was missing entirely, added this pass** (`magicLinkAction` + UI toggle).
- [x] Logout — verified working (both the server action and the POST route).
- [x] Session refresh — verified in `proxy.ts`/`middleware.ts`.
- [x] Protected routes — double-gated (`proxy.ts` + `app/(app)/layout.tsx`).
- [x] Silent auth-disable on missing prod env vars — **fixed**, now logs loudly via `captureException`.
- [ ] Action required: set `NEXT_PUBLIC_SITE_URL` in Vercel before shipping magic link (used to build the email redirect URL).

## Supabase

- [x] 34/34 schema parity, RLS on every user-owned table — see `supabase-audit.md`.
- [ ] Storage buckets provisioned but unused — decide before launch (see Academic lifecycle above).

## Vercel

- [x] Build/env/server-actions/dynamic-routes verified — see `vercel-audit.md`.
- [x] Error boundaries added (`app/error.tsx`, `app/(app)/error.tsx`) — previously **none existed anywhere**.
- [ ] Action required: confirm `NEXT_PUBLIC_SITE_URL` and `SUPABASE_SERVICE_ROLE_KEY` scoping in Vercel project settings.

## Mobile

- [x] Fixed 2 mobile-breaking 3-column grids (`coach-brief.tsx`, `academic-command-center.tsx`) that didn't collapse below `sm:`.
- [x] Tightened Focus Modes settings grid (`grid-cols-3` → `grid-cols-2` on mobile).
- [ ] Hover-only CTA affordances (`mission-control-panel.tsx`, `action-row.tsx`) are a touch-discoverability nit, not a launch blocker — left as-is.
- [x] Full nav (all routes) is reachable via the mobile drawer — confirmed NOT actually a gap despite the bottom nav only showing 4 items + FAB (by design).

## Empty states

- [x] Shared `EmptyState` component exists and is used across vault/revision/notifications/taxonomy/problems/concepts/roadmaps.
- [x] Spot-checked academic/knowledge/iit-workspace dashboards — all have zero-length guards in code.
- [ ] No full visual QA pass across every empty state was performed (would require a running browser session) — recommend a manual click-through before launch.

## Error / loading states

- [x] Added `error.tsx` at both the root and `(app)` levels — previously zero error boundaries existed anywhere.
- [x] Added `not-found.tsx`.
- [x] Added the 10 missing `loading.tsx` skeletons (academic, knowledge, concepts/[id], concepts/new, notifications, problems/[id], problems/new, settings, taxonomy, roadmaps/[id]).
- [x] Fixed 2 confirmed unguarded page-level awaits that would have hard-crashed (`problems/page.tsx`, `timeline/page.tsx`).
- [x] Fixed the OAuth callback so a profile/event-emit failure after a successful auth exchange no longer 500s the user.

## Performance

- [x] Fixed the highest-frequency N+1 (`habit-engine.service.ts`, runs on every overview/notifications load — was 4 separate per-row query loops, now batched).
- [x] Fixed `knowledge-graph.service.ts` N+1s (every problem-detail view).
- [x] Fixed `dashboard-aggregation.service.ts` per-topic N+1 (every overview load).
- [x] Added a generic `findByIds` to `BaseRepository` so future batch lookups don't need bespoke code.
- [ ] `taxonomy.service.ts` per-item existence checks (on concept/pattern creation) not fixed this pass — lower frequency (write path only), tracked as a follow-up.
- [ ] No shared `safe()` utility extracted — still duplicated across ~15 files. Tracked, not done (would touch every call site).

## Analytics & observability

- [x] Added `lib/observability/logger.ts` — single `captureException`/`captureEvent` choke point, currently console-based, ready to swap in Sentry/PostHog without touching call sites. Wired into both error boundaries, the OAuth callback, and the middleware auth-gate warning.
- [ ] No actual Sentry/PostHog SDK installed — intentionally deferred per the instruction not to overbuild this phase.

## Known open items (not fixed this pass — explicit follow-ups)

1. Delete `AiService` (confirmed dead/duplicate recommendation engine) — needs explicit sign-off since it's a deletion, not a hardening fix.
2. Decide the fate of `GpaProjectionService` (fully built, zero callers) — wire in or remove.
3. Decide on document/file uploads — ship a minimal flow or drop the unused storage buckets.
4. Extract the duplicated `safe()` helper into one shared utility.
5. Set `NEXT_PUBLIC_SITE_URL` and verify `SUPABASE_SERVICE_ROLE_KEY` scoping in Vercel before shipping.
6. Manual mobile/empty-state QA pass in a real browser (could not be done from this environment).
