# SanOS 2.0 — Master Architecture & Product Blueprint

**Status:** CTO audit, read-only. No code, schema, or UI was changed to produce this document.
**Audit date:** 2026-06-18
**Audited surface:** ~4,800 lines of `lib/services/*`, ~30 repositories, full `app/(app)/**` route tree, design tokens, navigation config, and the three most recently built engines (Memory Intelligence, Memory Coach, Habit Engine — partially uncommitted at audit time).

This is the canonical reference for all SanOS development going forward. Treat conflicting older docs (`phase5-lifecycle.md`, per-phase memory notes) as historical record, not current direction.

---

## Section 1 — Current State Analysis

### What exists

SanOS is a single Next.js 16 / React 19 / Supabase app with **18 backend services**, **30 repositories**, and **17 page modules**. Every module was built in a separate phase (see project history) and is functionally complete at the CRUD layer. The system has real, working:

- A DSA problem engine with attempts, reflections, code versions, and SM-2-style spaced revision (`revision_queue`, interval ladder `[1,3,7,16,35,70]` days).
- A dynamic, self-evolving topic/pattern taxonomy with a genuine propose→approve workflow.
- A Memory Intelligence Engine (recall strength, topic health, forgetting prediction) and a Memory Coach that turns weak signal into concrete interventions.
- A Habit Engine that unifies reminders, revision due-dates, and IIT deadlines into one Notification Center with a real state machine (unread→read/snoozed/completed/expired).
- A Knowledge Vault (notes/links, file upload explicitly deferred), Concepts (with manual mastery status), Roadmaps (real tree, real fan-out), a lightweight Knowledge Graph (FK-join based), IIT Workspace (pure tracker), Daily Brief and Focus Modes (both rule-based, real, wired into the UI).
- An append-only event log (`events` table, 33 `EVENT_TYPES`) that powers a Timeline view and dashboard activity feed.
- One aggregation read-model, `DashboardAggregationService`, with a 30s in-process TTL cache, feeding the `/overview` page.

```
                         ┌─────────────────────────┐
                         │   /overview (Server)     │
                         │  11-way Promise.all +    │
                         │  DashboardAggregation     │
                         └──────────┬────────────────┘
                                    │ reads only
        ┌───────────────┬──────────┼──────────┬───────────────┐
        ▼                ▼          ▼          ▼               ▼
  RevisionService   AiService  TimelineService MemoryIntel  HabitEngine
        │                │          │              │              │
        ▼                ▼          ▼              ▼              ▼
   revision_queue   ai_daily_briefs events    recall_strength  notifications
                     ai_insights              topic_memory_health reminders
```

### What works well

- **Per-domain craftsmanship is high.** Every service is fail-soft, well-commented, and internally consistent (e.g. `TaxonomyService.evolve()`, `MemoryIntelligenceService.evolve()` are genuinely idempotent and self-healing).
- **The repository pattern is consistent at the base level** (`BaseRepository`/`UserScopedRepository`) even where naming drifts above it.
- **The Command Palette is the one place the whole product feels unified** — global entity search across problems/concepts/vault plus full nav, reachable from both desktop and mobile.
- **`ResumePriorityCards` ("Continue Learning") on Overview is genuine cross-module integration** — it ranks and deep-links into revision/concepts/vault/problems/IIT in one list.
- **The Overview page's architecture is clean in intent**: it is documented and largely implemented as "reads ONLY the DashboardAggregationService snapshot, no direct domain queries" — a good aggregation-root pattern, partially undermined by the gaps below.

### What is weak

- **No orchestration layer.** `createServices()` is 18 flat siblings with no DAG, no DI container, and heavy duplicate construction (e.g. `EventService` is `new`'d separately inside 10+ other services instead of being shared).
- **No scheduled execution.** Every "idempotent self-healing evolve()" engine (taxonomy, memory intelligence) depends entirely on being incidentally triggered by an unrelated Server Action. Code comments say "a nightly job will catch up" — **no such job exists anywhere in the repo.**
- **The event bus is not a bus.** `events` is an audit/timeline log with zero subscribers; nothing reacts to an emitted event. All cross-service sequencing is hand-written, synchronous, and duplicated per Server Action.
- **Three independent "what should I do next" engines exist in parallel**: `AiService.battlePlan()`, `ContextEngineService.recommendations()/buildDailyPlan()`, and `MemoryCoachService.interventions()` — each built in isolation rather than one being extended.
- **The Memory Coach insight pipeline has a broken/unconfirmed trigger chain**: `getDailyBrief → generateDailyBrief → refreshInsights → memoryCoach.writeInsights` has no confirmed caller from any page — meaning memory-driven `ai_insights` may never be written in practice.
- **IIT Workspace and Knowledge Graph are intelligence-free.** IIT is pure CRUD with a hardcoded `daysUntil <= 3` urgency flag in a page component; "Knowledge Graph" is three FK-join lookups with no graph structure, no traversal, one UI surface.
- **Roadmap templates are ~5–10% seeded.** Striver A2Z/Blind75/NeetCode150 exist as section skeletons; almost no `problem_id` is ever set on a leaf item, so the real fan-out-on-solve mechanism (which is correctly implemented) has nothing to match against for the official templates.

### What is duplicated

| Logic | Implementations | Detail |
|---|---|---|
| Exponential half-life decay (`2^(-x/h)`) | `TaxonomyService.decayedScore()` (14-day fixed half-life) and `MemoryIntelligenceService.computeRecallStrength()` (half-life = 2× the item's own SM-2 interval) | Same primitive, different units, acknowledged in code comments, never factored into a shared helper. |
| Streak computation | `RevisionService.streakFromLogs()`, `ContextEngineService.countStreak()`, `DashboardAggregationService.activeDayStreak()`, `HabitEngineService.activeDayStreak()` | Four near-identical ~15-line implementations. |
| `safe(promise, fallback)` fail-soft wrapper | Redefined independently in `context-engine.service.ts`, `dashboard-aggregation.service.ts`, `habit-engine.service.ts` | Never hoisted to `BaseService`. |
| "What should I do next" recommendation generation | `AiService.battlePlan`, `ContextEngineService.recommendations`/`resumePriority`/`buildDailyPlan`, `MemoryCoachService.interventions` | Three parallel engines, no shared scoring model. |
| Due/weak queue fetch inside one method | `AiService.generateDailyBrief()` fetches `dueQueue`/`weakQueue` directly, then calls `this.battlePlan()` which re-fetches the same data | Two round-trips for identical data. |
| Composite-key upsert | `TaxonomyUsageRepository`, `RecallStrengthRepository`, `TopicMemoryHealthRepository` | Structurally identical, hand-written three times instead of a generic `BaseRepository.upsertOn()`. |
| Category-tint color values | Hardcoded inline hex per component (`overview-client.tsx`, `revision-client.tsx`, `vault-client.tsx`) | Not a shared design token — a rebrand touches N files. |

### What is disconnected

Of the 12 nav-reachable modules, **only Overview, Problems, and Timeline meaningfully cross-link to other modules.** Revision, Vault, Roadmaps, IIT Workspace, Analytics, and Taxonomy are functional islands: reachable from the hub, but once inside, none link onward to domain-adjacent siblings even where the data model clearly relates (a Vault note about a pattern doesn't link to that pattern's Taxonomy entry; a Taxonomy proposal doesn't link back to the Concept/Problem that triggered it; an IIT course has zero links to DSA prep). The cohesion that exists is concentrated almost entirely in one page (`/overview`) acting as a hub-and-spoke center, rather than being woven through the modules themselves — this is the literal, file-level mechanism behind "feels like multiple disconnected products."

---

## Section 2 — Product Cohesion Audit

**Why does SanOS still feel like multiple products?**

Three root causes, all confirmed in code:

1. **There is no shared "mental model" object that every module reads from and writes to.** Each module owns its own private notion of "what matters right now" — Revision has a due-queue, IIT has assignment due-dates, Memory Intelligence has health/forgetting scores, Habit Engine has notifications, Taxonomy has proposals. These get glued together only at `/overview`, and only by fetching each one separately and laying them out in adjacent cards. There's no single student-state object (see Section 4) that modules read and write through, so each module has no awareness of the others' state.

2. **Navigation is a sidebar, not a journey.** The 6 nav groups (Overview / Learning / Knowledge / Growth / IIT / Settings, confirmed in `nav-config.ts`) are an org chart of features, not a sequence of user intent. A student opening Concepts has no path forward into Vault, Taxonomy, or Problems without going back to the sidebar or Overview — every module is a dead end once entered, with the single exception of the Problems → post-solve panel flow.

3. **Intelligence is fragmented across three competing engines with no single owner.** `battlePlan`, `ContextEngineService`, and `MemoryCoachService` each independently decide "what should the student do next," at different layers, computed from overlapping data, surfaced (or not surfaced — see Section 4 on `MemoryCoachService`'s broken trigger chain) inconsistently. A user cannot trust any single "next action" signal because there isn't one.

### Disconnected workflows
- Solve a problem → roadmap fan-out silently does nothing for official templates (no `problem_id` wired in seed data) — a real workflow that looks complete in code but is dead in practice for 90%+ of roadmap content.
- Write a Concept note → no automatic surfacing in Vault, Taxonomy, or Revision, despite Taxonomy mining `concept_notes.category`/`recognition_clues` behind the scenes (the user never sees *why* a topic appeared).
- Approve a Taxonomy proposal → no link back to the source Concept/Problem that generated it.

### Dead ends
Revision, Vault, Roadmaps, IIT Workspace, Analytics, Taxonomy — confirmed zero outbound cross-module links (see Frontend audit §10). A student finishing a Revision session has no link forward into "log a concept note about what you just relearned" even though `PostActionPrompt`-style nudging already exists elsewhere (Problems' post-solve panel).

### Isolated modules
IIT Workspace is architecturally and visually isolated: its detail page (`/iit-workspace/[id]`) breaks the shared `PageTransition`/`surface-card` convention used everywhere else, uses a narrower content width, and has zero links to DSA content despite academic workload and DSA practice time being a real trade-off for the same student.

### Weak user journeys
- **The "why am I seeing this" problem**: Taxonomy auto-adds are silently announced via a generic `ai_insights` row; a student sees "New topic tracked: X" with no path to the concept/problem evidence that triggered it.
- **The "what do I do with this" problem**: Memory Health Panel on Overview shows `atRisk`/`neglected` topic badges with **no links at all** — a dead-end UI element showing risk with no affordance to act on it, even though `MemoryCoachService.interventions()` already computes exactly the right next action — it's just not rendered there.

### Poor information hierarchy
Overview's `overview-client.tsx` renders **13 sections** in a single scroll (Hero, Daily Digest, Missed Work, Notification Center, Daily Session, Resume Priority, Recommendations, Revision Queue, Weekly Ring, Evening Review, Memory Health, Taxonomy Waiting, IIT Reminders, Recent Knowledge, Activity Timeline, Recent Solved, Recent Concepts — 16 distinct data sections). There is no prioritization: a missed assignment and a "you're on a 12-day streak" congratulation compete for the same visual weight. This is symptomatic of additive development — every phase added one more card to the same page rather than asking what the page should *not* show.

---

## Section 3 — User Journey Audit

### DSA Journey
**Path:** Add Entry → 4-step new-problem wizard → Problem Detail (two-column workspace) → post-solve panel (save vault note / write concept / go to revision) → Revision Workspace (due cards → graded recall modal) → back to Problems.
- **Strengths:** The single best-built journey in the product. Real SM-2 scheduling, real fan-out (attempt → revision → roadmap → activity → events), the post-solve panel is a genuine connective-tissue UI element that should be the template for every other module.
- **Weaknesses:** Roadmap fan-out is mechanically correct but practically inert for official templates (seed gap). No "log another attempt" flow on an existing problem — only net-new entries.
- **Friction:** None major; this journey is close to the bar the rest of the product should hit.

### Revision Journey
**Path:** Overview "Start Revision" or Revision nav item → due-card grid → graded-recall modal (4 self-checks + confidence) → Got it/Failed/Snooze.
- **Strengths:** Polished, single-purpose, real data, optimistic UI removal.
- **Weaknesses:** No outbound links except to the underlying problem. A revision that resurfaces a forgotten concept has no link to write/update the concept note. `recall_grades` has a write path (`gradeRecall`) but the UI never shows the historical grade trend back to the student.
- **Friction:** Concepts and Revision are clearly related (a problem's concept-level confusion is exactly what Recall Strength is trying to measure) but the two modules never reference each other in the UI.

### Knowledge Journey (Concepts + Vault + Taxonomy + Knowledge Graph)
**Path:** Fragmented — there is no single "Knowledge Journey," there are four separate, barely-connected entry points.
- **Strengths:** Concepts↔Problems linking (`concept_problems`) is real; Vault's `forEntity` pattern is a genuinely reusable cross-module primitive (already used on Concept detail); Taxonomy mining from Concepts is real intelligence.
- **Weaknesses:** Vault search is a client-side substring filter, not real search. File uploads (image/PDF) are explicitly stubbed. Taxonomy has no link back to its source evidence. Knowledge Graph only surfaces on the Problem detail page, nowhere else, despite computing relationships that would be equally useful from Concepts or Vault.
- **Friction:** A student building a mental model of "what do I know" has to separately check Concepts (manual status), Vault (notes), Taxonomy (auto-tracked topics), and the Knowledge Graph rail (only on problems) — four different UIs for one underlying question.

### IIT Journey
**Path:** IIT Workspace list → course detail (assignments/lectures CRUD).
- **Strengths:** Clean CRUD, real event emission feeding the timeline and Notification Center.
- **Weaknesses:** Zero intelligence (Section 7 covers this in depth) — no GPA, no risk model, no urgency scoring beyond an inline hardcoded 3-day flag. Visually inconsistent with the rest of the app (breaks `PageTransition`/`surface-card` convention).
- **Friction:** Total isolation from DSA — a student juggling academic deadlines and DSA practice gets no unified workload view; Focus Mode's `deep_focus` setting hides academic battle-plan steps, but nothing in IIT itself is aware of DSA load or vice versa.

### Dashboard Journey
**Path:** Single scroll on `/overview`.
- **Strengths:** Genuinely the most "intelligent" page in the product — it is where every engine's output actually meets.
- **Weaknesses:** 16 sections, no prioritization, two near-duplicate "what to do" panels (`RecommendationsPanel` from `ContextEngineService` and the battle-plan-derived sections from `AiService`/`DashboardAggregationService`), Memory Health badges with no action affordance.
- **Friction:** Information overload masquerading as comprehensiveness.

### Mobile Journey
**Path:** Bottom nav (Overview/Problems/Revision/Analytics + FAB) + Command Palette for everything else.
- **Strengths:** The 4-item curated bottom nav (rather than cramming all 12 items) is a sound design decision; Command Palette is fully reachable on mobile via the `TopBar` search button, not desktop-only.
- **Weaknesses:** **8 of 12 nav destinations (Notifications, Roadmaps, Concepts, Vault, Taxonomy, Timeline, IIT Workspace, Settings) have no persistent one-tap mobile entry point** — there is no mobile hamburger/drawer exposing the full sidebar structure; the desktop `Sidebar` is simply `hidden` below `lg` with nothing replacing it.
- **Friction:** A mobile-only student effectively can't reach most of the product without memorizing Command Palette queries.

---

## Section 4 — Student Intelligence Core

### Why this is needed

The product currently has the right ingredients (taxonomy evolution, memory decay modeling, habit/notification fusion, rule-based daily brief) but three competing decision engines and no shared state object. The fix is not to build a fourth engine — it's to **consolidate the three existing ones into one core that owns "what does this student need right now," and have every module both feed it and read from it.**

### `StudentIntelligenceCore` — design

**Responsibility:** the single source of truth for "where this student stands and what they should do next." It does not replace `RevisionService`, `MemoryIntelligenceService`, `TaxonomyService`, `IitService`, etc. — those remain the systems of record for their domain. The Core is a pure orchestration/aggregation layer that:

1. **Unifies all engines** — wraps `MemoryIntelligenceService`, `TaxonomyService`, `HabitEngineService`, `RevisionService`, `IitService` (once it gains intelligence — Section 7), and `AnalyticsService` behind one read interface, replacing `AiService.battlePlan`, `ContextEngineService.recommendations/resumePriority/buildDailyPlan`, and `MemoryCoachService.interventions` as three separate call sites with **one scoring pipeline that produces all three of today's outputs from a single ranked list.**
2. **Prioritizes actions** — a single `PriorityQueue<StudentAction>` ranking every candidate action (revise problem X, review concept Y, approve taxonomy proposal Z, submit assignment W) by a shared urgency/impact score, instead of three independent threshold-based generators.
3. **Identifies risks** — folds `MemoryIntelligenceService.forgettingForecast`, `HabitEngineService.getMissedWorkQueue`, and (once built, Section 7) IIT academic risk into one `RiskRegister` keyed by entity, not three disjoint risk lists.
4. **Generates missions** — short, time-boxed bundles of 2-4 prioritized actions ("Today's Mission") replacing the current undifferentiated 16-section dashboard scroll with a curated, ranked subset.
5. **Generates recommendations** — the existing rule-based logic in `battlePlan`/`ContextEngineService` is the right *content*; it just needs one home instead of three.

**Must not duplicate logic** — concretely: `StudentIntelligenceCore` calls into `MemoryIntelligenceService.healthSnapshot()`/`forgettingForecast()`, `TaxonomyService.listProposals()`, `RevisionService.dueQueue()`/`weakQueue()`, `HabitEngineService.getMissedWorkQueue()`/`getNotificationCenter()`, and a new `IitService.riskSnapshot()` (Section 7) — it never recomputes scores those services already own. Its only original logic is the **cross-domain ranking function** that takes heterogeneous inputs (a memory-health score, a habit-engine due-date, a taxonomy proposal count) and produces one ordered list with a single, documented scoring rubric (e.g. weighted blend of: urgency [days overdue / grace window], impact [tied to a weak topic vs. isolated], and momentum [streak-preserving actions ranked up]).

```
┌──────────────────────────────────────────────────────────┐
│                  StudentIntelligenceCore                   │
│  ┌────────────────────────────────────────────────────┐  │
│  │  PriorityQueue<StudentAction>  (single ranked list) │  │
│  │  RiskRegister<EntityRef, RiskLevel>                  │  │
│  │  MissionBuilder → Mission[] (2-4 actions, time-boxed)│  │
│  └────────────────────────────────────────────────────┘  │
│        ▲             ▲             ▲             ▲        │
│        │ reads        │ reads        │ reads        │ reads │
└────────┼─────────────┼─────────────┼─────────────┼────────┘
         │             │             │             │
  RevisionService  MemoryIntel  TaxonomyService  HabitEngine
         │             │             │             │
   (+ IitService.riskSnapshot() — new, Section 7)
```

**Replaces, by deletion (not addition):**
- `AiService.battlePlan()` → becomes a thin formatter over `core.missions()`.
- `ContextEngineService.recommendations()`/`resumePriority()`/`buildDailyPlan()` → fully absorbed; `ContextEngineService` either shrinks to pure session-memory (`user_context` touch/resume timestamp) or is deleted outright once the Core takes over recommendation generation.
- `MemoryCoachService.interventions()` → becomes one input feed into the Core's `RiskRegister`/`PriorityQueue`, not a parallel output.

This is the single highest-leverage refactor available: it removes ~3 duplicated engines, fixes the "memory coach insights never get written" gap by giving the Core (not a fragile call chain through `AiService.generateDailyBrief`) direct, scheduled ownership of writing `ai_insights`, and gives every module a single object to both contribute to and read from — which is also the mechanism that fixes Section 2's root cause #1.

---

## Section 5 — Command Center Architecture

The dashboard should stop being "16 cards in arrival order" and start answering four questions, in this order, with everything else demoted to a secondary tab or removed:

| Question | Section | Source |
|---|---|---|
| What should I do today? | **Morning Brief** + **Mission Center** | `StudentIntelligenceCore.missions()` |
| What is at risk? | **Risk Center** | `StudentIntelligenceCore.risks()` |
| What is improving? | **Weekly Wins** | `AnalyticsService.growthMetrics()` + streak |
| What should I ignore? | *(implicit — everything not surfaced)* | Core's ranking demotes/suppresses low-priority items rather than listing them |

### Morning Brief
Replaces the current Hero + Daily Digest + AI summary blockquote with one compact block: greeting, streak, one-sentence state-of-the-student summary (already exists as `AiService`'s `summary` string — keep the content, change the container), and a single CTA into Mission Center. No metrics duplicated from Weekly Wins.

### Mission Center
Replaces `RecommendationsPanel` + `ResumePriorityCards` + `RevisionQueue` + battle-plan rendering with **one ranked list of 3-5 missions**, each sourced from `StudentIntelligenceCore.missions()`, each deep-linking to the real module (this part already works well via `ResumePriorityCards` — keep that linking pattern, just feed it from the unified Core instead of three separate panels).

### Risk Center
Replaces the dead-end Memory Health badges + Missed Work Panel + IIT Reminders (currently link-less) with one list, each row carrying **both** the risk signal and a direct action link (the existing `MemoryCoachService.interventions()` already produces exactly this shape — `{ riskLevel, entity, recommendedAction: { label, href } }` — it just isn't rendered as a unified list today).

### Continue Learning
Keep `ResumePriorityCards` largely as-is — it's already the best-built cross-module surface in the app — but feed it through the Core rather than `ContextEngineService.resumePriority()` directly, so its ranking is consistent with Mission Center's.

### Recommended Actions
Folded into Mission Center — do not keep as a separate section (this is exactly the duplication identified in Section 1).

### Weekly Wins
New section, intentionally separate from risk/missions: weekly solve count vs. target (already computed as `WeeklyRing`), streak, "what got easier this week" (e.g. topics that moved from `at_risk`→`stable` in `topic_memory_health` — data already exists, just never surfaced as a positive signal today; currently Memory Health only shows risk, never improvement).

**Net effect:** 16 sections → 5 (Morning Brief, Mission Center, Risk Center, Continue Learning, Weekly Wins), each backed by one ranked/structured query instead of N parallel fetches.

---

## Section 6 — Experience Architecture

### Learning Flow (DSA)
Already close to ideal — keep as the template:
`Add Entry → Solve → Post-Solve Panel (vault note / concept / revision) → Revision Workspace → back into Mission Center`
**Required fix:** wire roadmap official templates so fan-out is real (Section 9), and add "log another attempt" so the loop can repeat on an existing problem.

### Academic Flow (IIT)
Currently a closed loop with no exits. Target:
`IIT Workspace → (new) Academic Risk surfaced in Risk Center → assignment deep-link both ways (Risk Center → assignment detail, assignment → "this affects your DSA time budget today")`. The connective tissue is the Core's shared time/risk budget — IIT and DSA should both feed the same "today's available focus time" signal that Focus Mode already partially gestures at (`hideBattlePlanKinds`) but doesn't fully use.

### Knowledge Flow
Currently four disconnected entry points (Concepts/Vault/Taxonomy/Graph). Target: a single **Knowledge Graph rail**, reused everywhere (Problem detail today; extend to Concept detail, Vault item detail, Taxonomy proposal row), so wherever a student is, they see "related: 2 problems, 1 vault note, 1 concept" with real deep links — turning the existing `KnowledgeGraphService` (already correctly scoped to "no new schema, FK-derived edges") into the connective tissue instead of a single-page widget.

### Revision Flow
Already strong; missing exit is the same as Learning Flow's entry — a revision session that surfaces a weak concept should link forward into editing that concept note, closing the loop (`Revision ↔ Concepts`, today one-directional via Taxonomy's quiet mining, never user-visible).

### Daily Flow
`Morning Brief (Core) → Mission Center → execute missions across whichever module each mission targets → Evening Review (already built, `HabitEngineService.getEveningReview()`) → tomorrow's Morning Brief incorporates today's outcome`. This loop already exists end-to-end in code (Daily Brief + Evening Review both real) — the only gap is Mission Center sitting in the middle, replacing the current undifferentiated card list.

---

## Section 7 — IIT Intelligence Roadmap

**Current state (confirmed code-level):** 4 tables (courses/assignments/lectures/documents), full CRUD, `creditSummary()` (sum-by-status only), a hardcoded `daysUntil <= 3` urgency flag inline in a page component. Zero GPA math, zero risk model, zero workload balancing.

### Missing intelligence
- **GPA/CGPA calculation** — `grade`/`marks`/`max_marks` columns exist on `iit_courses` today but are never read into a weighted average anywhere in `IitService`.
- **Academic risk scoring** — no model combining grade trend + missed-assignment rate + time-to-deadline into a single risk signal per course.
- **Workload balancing** — no awareness of "3 assignments due this week + how much DSA time is realistic," despite Focus Mode's `deep_focus` mode already hiding DSA battle-plan steps as a one-way gesture at this problem.

### Missing planning
No assignment-to-calendar planning, no "best order to tackle this week's deadlines" sequencing — `IitService` exposes due dates but no scheduling logic at all (contrast with `RevisionService`'s real interval scheduling for DSA).

### Architecture plan (design only — do not implement)

```
IitService (existing CRUD, unchanged)
        │
        ▼
IitIntelligenceService (new)
  - gpaSnapshot(userId): per-course weighted grade → CGPA, trend vs. last term
  - riskSnapshot(userId): per-course {missedAssignments, avgGrade, trend} → risk bucket
      (reuse the same risk-bucket vocabulary MemoryIntelligenceService already
       established: strong/stable/at_risk/decaying/neglected — don't invent a 4th taxonomy)
  - workloadForecast(userId, days): assignments due in window, weighted by course credits
        │
        ▼
StudentIntelligenceCore.risks()  ← feeds in alongside memory/habit risk
```

**Dependencies:** requires `grade`/`marks` to actually be populated by students (currently optional fields with no enforced entry point — likely needs a "record result" action on the assignment-complete flow, not just a status flip). No new tables required — this is a pure service-layer addition over existing columns.

---

## Section 8 — Memory Intelligence Audit

### Strengths
- Three models (Recall Strength, Topic Health, Forgetting Prediction) are genuinely well-designed: Laplace-smoothed reliability, decay scaled to the item's *own* SM-2 interval (not a fixed window), a documented calibration penalty for overconfidence, and risk buckets keyed on `ageRatio` rather than raw score (correctly distinguishing "due tomorrow at 70%" from "due in 3 weeks at 70%").
- `evolve()` is correctly idempotent/self-healing, matching `TaxonomyService`'s established pattern.
- `MemoryCoachService` never surfaces a bare percentage — every intervention ends in a concrete action (revise specific problem, review specific concept, solve new), which is exactly right product behavior.

### Weaknesses
- **Duplicated decay math** vs. `TaxonomyService` (Section 1) — acknowledged in comments, not factored out.
- **Two parallel paths feed memory signal into the dashboard** (`DashboardAggregationService` → `MemoryIntelligenceService` directly for raw health/forecast, and `AiService.refreshInsights` → `MemoryCoachService` → `ai_insights` rows) — no single "memory section" owner, and the second path's trigger chain is unconfirmed/likely broken (Section 1).
- **No UI write path for `recall_grades`** — `gradeRecall()` exists and is called conditionally from the Revision flow's recall checklist, but there's no page showing the historical grade trend back to the student (write-only feature today).
- **Memory Health badges on Overview have no action affordance** (`atRisk`/`neglected` topics shown with no link), despite `MemoryCoachService.interventions()` already computing the exact right next action.

### Missing models
- No **interference model** — multiple similar patterns/topics confusing each other is a real forgetting mechanism not modeled.
- No **trend forecasting beyond a single 5-event window** — `trendFor()` compares the last 5 events to all-time reliability; no longer-horizon trend line.

### Missing interventions
- No spaced-repetition equivalent for **Concepts** (Section 2 of the domain audit) — Memory Intelligence models DSA-problem recall only; a concept's "forgetting curve" isn't modeled at all today, even though Concepts have a `status` field that gestures at the same need.

### Recommendation
Fold Memory Intelligence into `StudentIntelligenceCore`'s `RiskRegister` as planned in Section 4 — this single change fixes the "two parallel paths" weakness and gives Memory Coach's interventions a guaranteed, scheduled write path instead of depending on an unconfirmed call chain.

---

## Section 9 — Knowledge System Evolution

**Current state:** Concepts (manual status), Vault (notes/links, file upload stubbed, client-side substring search), Roadmaps (real tree, ~5-10% seeded content, fan-out mechanically correct but practically inert), Knowledge Graph (3-4 FK-join rules, one UI surface).

**How they should evolve into a connected ecosystem:**

1. **One shared relationship layer.** `KnowledgeGraphService` already has the right shape (no new schema, derives from existing FKs/join tables) — extend its surface area, not its data model: render the same "related" rail on Concept detail, Vault item detail, and Taxonomy proposal rows, not just Problem detail.
2. **Close the Taxonomy→source loop.** Every auto-added/proposed topic should carry a reference to the `concept_notes` row(s) that triggered it (the mining functions already know this at compute time — `mineTopicCandidates`/`minePatternCandidates` group by source concepts before discarding that link) — persist it so the "New topic tracked: X" insight and the `/taxonomy` review UI can link back to evidence.
3. **Fix Roadmap content, not Roadmap code.** The tree structure and fan-out are correctly built; the only gap is seed data. Re-seed Striver A2Z/Blind75/NeetCode150 with full problem lists and, critically, populate `roadmap_items.problem_id` against the real `problems` catalog (note: this likely requires the `problems` catalog to contain those exact canonical problems first — check coverage before re-seeding).
4. **Real search for Vault**, once volume justifies it — Postgres full-text (`tsvector`) is sufficient at this scale; no need for an external search service.
5. **Give Concepts a forgetting model**, reusing `MemoryIntelligenceService`'s decay primitive (once factored into a shared utility per Section 1) rather than inventing a second one.

---

## Section 10 — Responsive Architecture

### Mobile
- **Broken/missing:** 8 of 12 nav destinations (Notifications, Roadmaps, Concepts, Vault, Taxonomy, Timeline, IIT Workspace, Settings) have no persistent one-tap entry — no hamburger/drawer replaces the desktop `Sidebar`, which is simply `hidden` below `lg`.
- **Hidden functionality:** none of these are actually broken in a rendering sense (responsive Tailwind classes work fine within each page) — the gap is purely navigational discovery, not page-level responsiveness.
- **Working well:** Command Palette is fully mobile-reachable (via `TopBar`'s search button) and is today's de facto answer to the missing drawer — but it requires the user to already know what they're looking for; it's not a browse surface.

### Tablet
Not separately audited at the component level in this pass (pages use the same breakpoint system as mobile/desktop, with `lg:` as the single hinge point); recommend a follow-up pass once the mobile-drawer gap is fixed, since a tablet-width drawer-vs-sidebar decision will interact with whatever solution is chosen below.

### Desktop
Fully featured; no broken flows identified at the desktop breakpoint.

### Unified responsive strategy
Add a mobile drawer (slide-over, triggered from `TopBar`) rendering the full `NAV_GROUPS` structure exactly as defined in `nav-config.ts` — no new navigation taxonomy needed, just a second renderer for the data that already exists. This closes the mobile gap without touching desktop and without inventing new IA.

---

## Section 11 — Design System Audit

### Current state
- Tailwind v4 token system (`globals.css`), light/dark parity, a coherent base palette (violet primary `#5b5fef`/`#7c7dff`, near-black dark mode `#09090b`), single-source radius scale, Inter + JetBrains Mono, deliberate "Apple material" surface highlight (`--surface-highlight` inset + shadow combo on `.surface-card`).
- This base is genuinely good and close to the stated inspirations (Linear/Notion/Arc/Apple) in *intent*.

### Where it breaks down
- **`app/(app)/iit-workspace/[id]/page.tsx` does not use the shared `PageTransition`/`PageHeader`/`surface-card` conventions** that every other module page uses — different max-width, different header construction, no stagger animation. This is the one concrete piece of evidence that the IIT module was built on a different convention pass than the rest of the app.
- **Category-tint colors are not tokens.** The same handful of hex values (`#60a5fa`, `#34d399`, `#a78bfa`, `#fbbf24`, etc.) are hand-picked and repeated inline across `overview-client.tsx`, `revision-client.tsx`, `vault-client.tsx` independently rather than living in `globals.css` as a `--category-*` scale.
- **Radius/shadow scale exists but is bypassed** — components write `rounded-2xl`/`rounded-xl` directly almost everywhere rather than the semantic `--radius-sm/md/lg/xl` names, meaning a global radius change requires a grep-and-replace across components instead of one variable edit.

### Compared to Linear / Notion / Arc / Apple
- **Linear**: SanOS's density and motion restraint (`.lift`, `prefers-reduced-motion` respect) are in the right direction, but Linear's information hierarchy discipline (one clear primary action per view) is exactly what Section 5's dashboard consolidation is meant to import.
- **Notion**: Notion's strength is letting disparate content types (notes, databases, embeds) feel like one fabric via consistent block-level primitives — SanOS's Vault/Concepts/Knowledge split is the inverse: three different primitives for what is conceptually one "things I know" fabric.
- **Arc**: Arc's command-bar-first browsing model is already SanOS's best feature (Command Palette) — the design language gap is that Arc treats the command bar as a *primary* navigation surface with rich previews, while SanOS's palette is plain-text list only.
- **Apple**: the `.surface-card`/`--surface-highlight` material approach is a genuine, well-executed homage; the gap vs. Apple's actual products is restraint in *quantity* of simultaneous surfaces (Apple rarely shows more than 3-4 cards of equal visual weight on one screen; SanOS's Overview shows 16).

### Future design language (directional, not exhaustive)
1. Tokenize category colors as CSS custom properties.
2. Enforce the `PageTransition`/`surface-card` convention via a lint rule or shared layout wrapper component that IIT (and any future module) must use — not just a convention to remember.
3. Apply Apple's restraint principle directly via Section 5's 16→5 section consolidation — this is a content decision more than a CSS one.

---

## Section 12 — Product Recovery Roadmap

### Phase A — Unify Intelligence (foundation)
- **Objective:** Build `StudentIntelligenceCore` (Section 4); retire `AiService.battlePlan`/`ContextEngineService.recommendations`/`MemoryCoachService.interventions` as three separate call sites in favor of one.
- **Expected impact:** Fixes the single biggest "feels disconnected" root cause; unblocks Section 5's dashboard redesign and gives every future module one place to plug into.
- **Complexity:** Medium-high — requires careful behavior-preserving refactor (the underlying rule-based logic mostly already exists and is correct; this is consolidation, not new algorithm design).
- **Dependencies:** None — can start immediately; does not require new tables.

### Phase B — Command Center Redesign
- **Objective:** Implement Section 5's 5-section dashboard (Morning Brief / Mission Center / Risk Center / Continue Learning / Weekly Wins), replacing the current 16-section scroll.
- **Expected impact:** Directly addresses "poor information hierarchy"; turns dead-end Memory Health badges into actionable Risk Center rows.
- **Complexity:** Medium — mostly UI consolidation once Phase A supplies the unified data shape.
- **Dependencies:** Phase A (Core must exist first; otherwise this just rearranges the same fragmented sources).

### Phase C — Close the Knowledge Loop + Roadmap Content
- **Objective:** Extend `KnowledgeGraphService`'s rail to Concept/Vault/Taxonomy pages (Section 9 #1), persist Taxonomy's source-evidence link (Section 9 #2), re-seed Roadmap templates with real `problem_id` links (Section 9 #3).
- **Expected impact:** Fixes the "four disconnected knowledge UIs" problem and makes the already-correct roadmap fan-out mechanism actually fire for real users.
- **Complexity:** Low-medium for the Graph rail extension (reuses existing service); medium for roadmap re-seeding (data entry/curation work, not architecture work).
- **Dependencies:** None on Phase A/B — can run in parallel.

### Phase D — IIT Intelligence + Mobile Navigation
- **Objective:** Build `IitIntelligenceService` (Section 7: GPA, risk, workload), feed it into the Core's `RiskRegister`; add the mobile nav drawer (Section 10).
- **Expected impact:** Closes the last major intelligence gap (IIT) and the last major UX gap (mobile discoverability).
- **Complexity:** Medium (IIT intelligence is new logic over existing columns, no schema change required); Low (mobile drawer reuses existing `NAV_GROUPS` data, no new IA).
- **Dependencies:** IIT Intelligence should land after Phase A so it plugs directly into the unified `RiskRegister` rather than becoming a fourth parallel risk source.

**Sequencing rationale:** A → B is strictly ordered (B consumes A's output). C and D's mobile piece can run anytime, in parallel with A/B. D's IIT-intelligence piece should follow A to avoid creating a fourth competing engine — the exact mistake this roadmap is correcting for.

---

## Section 13 — Final Product Assessment

| Dimension | Current Score (/10) | Future Potential (/10) | Rationale |
|---|---|---|---|
| Learning Effectiveness | 7 | 9 | DSA + Revision loop is genuinely strong today; ceiling is closing the Concepts-forgetting-model gap. |
| Memory Retention | 7 | 9 | Models are well-designed; score capped by the broken insight-write trigger chain and lack of Concept-level decay modeling. |
| Academic Utility (IIT) | 3 | 7 | Pure CRUD today; Phase D closes most of the gap, but GPA/risk intelligence needs real usage data (grades entered) to be useful, capping the ceiling below DSA's. |
| Daily Usage Potential | 5 | 8 | Currently undermined by 16-section dashboard overload; Phase B directly targets this. |
| Intelligence | 5 | 8 | Real rule-based intelligence exists in 3+ places but fragmented; consolidation (Phase A) is most of the path to 8, not new ML. |
| Product Cohesion | 3 | 8 | The core finding of this audit — currently the weakest dimension; Phases A-C directly target the three root causes identified in Section 2. |
| UI Quality | 6 | 8 | Strong base design system, undermined by one inconsistent module (IIT) and ungoverned color tokens — both are bounded, knowable fixes. |
| Mobile Experience | 4 | 7 | Core interactions (palette, bottom nav, FAB) work well; capped by the 8-of-12 missing nav entry points until Phase D's drawer ships. |
| Long-Term Vision | 6 | 9 | The ingredients for a genuinely differentiated "Student Intelligence OS" already exist in the codebase; what's missing is the unifying layer (Section 4), not new feature surface area. |

**Overall current state: a well-engineered collection of independently strong modules without a unifying intelligence or navigation layer.** The future potential is high specifically *because* most of the hard algorithmic work (SM-2 scheduling, decay-based memory modeling, rule-based recommendation logic, idempotent self-healing evolution engines) is already built correctly — what's missing is consolidation, not invention. Phase A (`StudentIntelligenceCore`) is the highest-leverage single piece of work in this roadmap: it is the dependency every other cohesion fix sits behind.
