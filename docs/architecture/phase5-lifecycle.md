# Phase 5A — Operational Lifecycle

This document describes how a user action propagates through SanOS after the
Phase 5A operationalization: the live database is at schema parity with the
code, every state-changing action emits immutable domain events, the dashboard
reads through a single aggregation service, and the taxonomy evolves on each
solve.

## Layering rules (unchanged, now enforced end-to-end)

```
Server Action / Route Handler
        │ calls
        ▼
   Services  (business logic, cross-domain orchestration, event emission)
        │ compose
        ▼
 Repositories (the ONLY direct database access; no business logic)
        │
        ▼
     Supabase (Postgres + RLS)
```

React components hold **no** analytics logic and issue **no** direct domain
queries. The overview page consumes exactly one service method:
`DashboardAggregationService.snapshot(userId)`.

## 1. Problem creation flow (the learning entry)

`createLearningEntry` (Server Action) → `ProblemsService.recordSolve` fans out
to every domain and funnels telemetry through the append-only event stream.

```
createLearningEntry (app/(app)/problems/actions.ts)
  └─ ProblemsService.create ─────────────► problems            ─emit─► problem.created
  └─ ProblemsService.recordSolve
       ├─ attempts.create ───────────────► problem_attempts
       ├─ reflections.create ────────────► problem_reflections ─emit─► reflection.created
       ├─ codeVersions.create ───────────► problem_code_versions ─emit─► code_version.created
       ├─ RevisionService.scheduleAfterSolve ► revision_queue   ─emit─► revision.scheduled
       ├─ fanOutToRoadmaps ──────────────► roadmap_progress     ─emit─► roadmap.progressed
       ├─ ActivityService.log ───────────► activity_logs
       ├─ ActivityService.bumpDailyCounters ► daily_logs
       └─ (emit) ─────────────────────────────────────────────► problem.solved
  └─ TaxonomyService.evolve (fail-soft) ──► topics/patterns/taxonomy_usage
                                                                 ─emit─► taxonomy.*
  └─ redirect → /problems/[id]
```

Every arrow labelled `emit` writes one immutable row to `events`. The whole
chain was verified against the live database by `scripts/verify-engine.mjs`.

## 2. Revision flow

```
RevisionService.recordReview(success?)
  success ─► success_count++  interval ladder advances [1,3,7,16,35,70]d
          ─► state: learning → reviewing → mastered      ─emit─► revision.succeeded
  failure ─► success_count=0  interval resets to rung 0
          ─► state → struggling                          ─emit─► revision.failed
```

Struggling items feed `weakTopics` and the AI battle plan in the dashboard
aggregate.

## 3. Taxonomy evolution flow

`evolve(userId)` is idempotent and self-healing — it recomputes from the source
of truth (attempts + concept notes), so calling it on every solve is safe.

```
TaxonomyService.evolve
  ├─ rerankFromAttempts ─► taxonomy_usage (recency-decayed relevance_score)
  ├─ mineTopicCandidates (from concept_notes.category frequency)
  │     count ≥ 5 → status=active  source=ai_auto   ─emit─► taxonomy.auto_added (+ ai_insight)
  │     count ≥ 2 → status=proposed source=ai_proposed ─emit─► taxonomy.proposed
  └─ minePatternCandidates (concept notes w/ recognition_clues, no pattern_id)
        understood/mastered → auto-add ; else → propose
  └─ (emit) ─────────────────────────────────────────► taxonomy.evolved
```

Proposals are never auto-promoted; `approve`/`dismiss` move them to
`active`/`dismissed`.

## 4. Event propagation flow (read side)

The event stream is the single source for activity history. Nothing re-queries
domain tables to build a timeline.

```
events (append-only, immutable via RLS: insert+select own, no update/delete)
   │
   ├─ EventService.listRecent / getEntityTimeline   (raw rows)
   │
   ├─ TimelineService.getUserTimeline ─► TimelineItem[] (human copy + deep link)
   │        consumed by → DashboardAggregationService.activityTimeline
   │                      problem detail "Activity history"
   │
   └─ (future) analytics / AI engines read the same stream
```

## 5. Dashboard aggregation

```
OverviewPage (server component)
  └─ DashboardAggregationService.snapshot(userId)   [30s per-process TTL cache]
       ├─ hero                 (totals, solved-this-week, due)
       ├─ battlePlan           (AiService.battlePlan — read-only, no writes)
       ├─ revisionQueue        (due items + titles)
       ├─ aiInsights           (active insights)
       ├─ activityTimeline     (TimelineService → events)
       ├─ weakTopics           (struggling revisions grouped by topic)
       ├─ roadmapProgress      (per-roadmap completed/total)
       ├─ upcomingAssignments  (iit_assignments due, not graded)
       └─ continueLearning     (most recently touched problems)
```

Each section is independently fail-soft: a behind-migration table or transient
error degrades that one section to empty rather than blanking the page.

## 6. Knowledge graph

`KnowledgeGraphService` answers "what is related to this problem?" from existing
columns and link tables (no new schema):

```
problem ──topic_id──► topic        problem ──pattern_id──► pattern
concept_problems: concept ◄──► problem     concept ──topic_id/pattern_id──► topic/pattern

getRelatedProblems  = same topic OR same pattern OR shares a linked concept
getRelatedConcepts  = concepts linked via concept_problems
getRelatedPatterns  = problem's pattern + patterns from linked concepts
getRelatedKnowledge = { problems, concepts, patterns, topics }  (detail-page rail)
```

## Verification

| Script | Proves |
|--------|--------|
| `node scripts/verify-db.mjs`     | schema parity — every expected table + column present (anon key, RLS-safe) |
| `node scripts/verify-engine.mjs` | the lifecycle runs end-to-end on the live DB (service role, throwaway user, full cleanup) |

Both must exit 0. `verify-db` additionally returns non-zero with a per-table
✅/❌/⚠ report when the schema is behind the code.
