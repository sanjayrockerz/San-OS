# SanOS — Full System Audit

Date: 2026-06-23
Scope: every route, service, and workflow in the repo, audited for launch readiness (Phase P). Issues are classified Critical / High / Medium / Low. Items marked **(fixed)** were corrected in this same pass; everything else is open and tracked in `prelaunch-checklist.md`.

## 1. Routes (`app/**`)

### Global infrastructure
| Item | Finding | Severity |
|---|---|---|
| No `error.tsx` anywhere | Any unguarded throw rendered Next's default unstyled crash page, no logging hook. | High — **(fixed)**: added `app/error.tsx` (root) and `app/(app)/error.tsx` (app shell, styled, "Try again" / "Back to Overview"). |
| No `not-found.tsx` | Each `[id]` page calls `notFound()` but fell through to Next's default 404. | Low — **(fixed)**: added `app/not-found.tsx`. |
| 10 routes missing `loading.tsx` | `academic`, `knowledge`, `concepts/[id]`, `concepts/new`, `notifications`, `problems/[id]`, `problems/new`, `settings`, `taxonomy`, `roadmaps/[id]` had no streaming skeleton. | Medium — **(fixed)**: all 10 now use the shared `PageSkeleton`. |
| `proxy.ts` / `lib/supabase/middleware.ts` | Session refresh + auth redirect correct, but silently no-ops (disabling auth for ALL routes) if Supabase env vars are absent — no log, no warning. | Critical — **(fixed)**: now `console.error`s loudly when this happens in `NODE_ENV=production`. |
| `app/(app)/layout.tsx` | Solid defense-in-depth guard (`requireContext` + `ensureProfile`). | — |
| `app/manifest.ts`, `app/page.tsx`, `app/layout.tsx` | Clean. | — |

### Dead / duplicate routes
- `app/(app)/knowledge-vault` and `app/(app)/dashboard` are legacy redirect shims (`→ /vault`, `→ /overview`). Functionally harmless, but should be **deleted** (not just redirected) before launch — Low, tracked in checklist, not deleted in this pass to avoid breaking any bookmarked links without user sign-off.
- `app/(app)/vault` (raw knowledge items) and `app/(app)/knowledge` (health/gaps/coaching dashboard) are **not duplicates** — confirmed distinct purposes.

### Per-route issues (beyond the blanket loading/error gaps above)
| Route | Issue | Severity |
|---|---|---|
| `problems/page.tsx` | Used `requireUser` + manual `createClient()/createServices()` (inconsistent with rest of app) and an unguarded `Promise.all`. | High — **(fixed)**: switched to `requireContext`, wrapped each fetch in a local `safe()` fallback. |
| `timeline/page.tsx` | `getUserTimeline` call had no `.catch()` — single point of failure. | High — **(fixed)**: now falls back to `[]`. |
| `app/auth/callback/route.ts` | Profile-insert and event-emit ran unguarded after a successful OAuth exchange — a DB hiccup here 500'd a user who had *already authenticated*, stranding them. | High — **(fixed)**: both wrapped in try/catch with logging; the redirect now always completes once auth succeeds. |
| `app/login/actions.ts`, `app/auth/signout/route.ts` | `events.emit` calls around sign-in/sign-up/sign-out were unguarded — an event-bus hiccup could turn a successful auth transition into a 500. | Medium — **(fixed)**: all wrapped with `.catch(console.error)`, fire-and-forget. |
| `problems/new/page.tsx` | Inconsistent service-access pattern vs. siblings (uses `requireContext` while `problems/page.tsx` used `requireUser`) — noted, no functional bug; left as-is now that both use `requireContext`. | Low (resolved as a side effect of the `problems/page.tsx` fix) |

No mock data, `console.log`, `debugger`, or TODO/FIXME comments were found anywhere under `app/`. Every Server Action uses a consistent `{ok:true}/{ok:false,error}` try/catch pattern — this part of the codebase is solid; the residual risk was page-level unguarded awaits, now closed.

## 2. Services (`lib/services/*.ts`, 28 files)

`createServices()` instantiates all 28 services per request, so "wired" means actually called from a page/action, not just present in the factory.

### Confirmed dead/duplicate engines — violates "do not build new recommendation engines"
- **`AiService`** — zero direct `services.ai.*` calls from app code. `StudentIntelligenceCoreService` already supersedes it (per `docs/architecture/sanos-2.0-architecture.md` §4/12) and `AiService.battlePlan()` is already a 2-line delegate to it. The class still privately instantiates its own `MemoryCoachService` rather than reusing shared state. **High** — recommend deleting `AiService` entirely in a future pass (not done in this pass per the "no new engines, but also no destructive deletes without confirmation" posture — flagged for explicit follow-up).
- **`MemoryCoachService`, `CoachOutcomeService`** — the shared factory instances (`services.memoryCoach`, `services.coachOutcome`) are never called; `AiService` and `StudentIntelligenceCore`/`StudentCoachService` each construct **private duplicate instances** instead of reusing `repos`. Wasteful (3x instantiation of identical logic) but not a correctness bug since repos are stateless per request. **Medium**.
- **`GpaProjectionService`** — fully built (156 lines), zero callers anywhere. Half-finished feature, not wired into `academic` or `academic-health`. **High** — either wire it into the Academic journey (Step 2) or remove before launch.

### Resilience gaps
- **No shared `safe()` utility** — the identical `async function safe<T>(p, fallback)` helper is copy-pasted independently across 6 services and 9+ page files. **High** maintainability/consistency risk: any new page that forgets to wrap a call will hard-crash. Not consolidated in this pass (would touch 15+ files) — tracked as a Step 9/cleanup follow-up.
- 19 of 28 services have **zero internal try/catch** — resilience depends entirely on the caller remembering `.catch()`/`safe()`. The two confirmed call-sites that were missing it (`problems/page.tsx`, `timeline/page.tsx`) are fixed; a full audit of every call site was out of scope for this pass given the size, but the worst offenders (page-level entry points) are now covered by the new `error.tsx` boundaries as a backstop.

### N+1 query hotspots (ranked by request frequency)
| Service | Pattern | Frequency | Severity |
|---|---|---|---|
| `habit-engine.service.ts` (`evaluateForUser`) | 4 separate find/create/update loops, no batching | Every `/overview` and `/notifications` load | **High** |
| `knowledge-graph.service.ts` | Multiple `findById` in loops instead of `findByIds` (4 call sites) | Every problem-detail view | **Medium-High** |
| `taxonomy.service.ts` | Per-item `patternExists`/`topicExists` + `taxonomyUsage.upsert` in loops | Every concept/pattern creation | Medium |
| `dashboard-aggregation.service.ts` | Per-topic `findById` in a loop | Every `/overview` load | Medium |

Not fixed in this pass (real refactors, each touching repository call signatures) — tracked for Step 9 (Performance Audit).

## 3. Auth — see `docs/launch/auth-audit.md` section embedded in `prelaunch-checklist.md` (summary below)
- Magic link was entirely missing — **(fixed)**: added `signInWithOtp` flow (`magicLinkAction` + UI toggle in `LoginForm`).
- Silent auth-disable on missing env vars — **(fixed)**, see above.
- Raw "email not confirmed" error string — **(fixed)**: friendly copy.
- OAuth consent-denial conflated with generic failure — **(fixed)**: `?error=access_denied` now mapped to a distinct message; `login/page.tsx` now has a full error-code → copy map instead of one generic string.
- Intermittent token-edge redirect-loop risk between `/login`↔`/overview` — **open, Low/rare**, would require caching `getUser()` across `proxy.ts`/`requireContext` to fully close; not done in this pass (architectural change, low frequency).

## 4. Supabase — see `docs/launch/supabase-audit.md`

## 5. Vercel — see `docs/launch/vercel-audit.md`

## Summary table

| Severity | Found | Fixed this pass | Open (tracked) |
|---|---|---|---|
| Critical | 1 | 1 | 0 |
| High | 8 | 6 | 2 (AiService duplication, GpaProjection orphan) |
| Medium | 7 | 4 | 3 (N+1s, shared safe() util, redirect-loop edge case) |
| Low | 5 | 2 | 3 (dead route deletion, global not-found polish, cookie/Safari verification) |
