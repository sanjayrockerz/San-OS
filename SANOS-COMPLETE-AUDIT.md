# SAN OS 3.0 — COMPLETE PRODUCT, ARCHITECTURE & LIFECYCLE AUDIT

**Audit Date:** 2026-07-08  
**Repository:** dsa-os (SanOS Personal Engine)  
**Stack:** Next.js 16.2.9 | React 19.2.4 | Supabase (Postgres) | Tailwind CSS v4 | Zustand | Framer Motion | Recharts  
**Auth:** Supabase Auth (email+password, magic link, Google OAuth)  
**AI:** Deterministic rule-based engine (no LLM dependency) + optional OpenAI-compatible provider  
**Status:** ~400+ source files, 29 DB migrations, 59 services, 27 repositories, 131 React components

---

## PART 1 — PRODUCT OVERVIEW

### Vision

SanOS (also known internally as DSA OS) is a **personal engineering operating system** — a single, unified workspace that manages the complete life of a software engineer: DSA problem-solving, academic performance (IIT), project delivery, business operations, finance, knowledge management, daily execution, habit tracking, memory retention, and career/placement readiness.

It aspires to be the **operating system for a technical founder's or engineer's entire life**, eliminating the need for 10+ separate tools by providing a deeply integrated, AI-coached, event-driven platform.

### Philosophy

- **One workspace, one truth.** Every action — solving a problem, meeting a client, logging revenue, revising a concept, completing a lecture — is a first-class event in the system. Nothing is siloed.
- **Deterministic AI, not chatbot AI.** The "coach" is a rule-based decision engine that scores actions by urgency/impact/momentum. It never hallucinates. It has no LLM dependency — the optional LLM provider is for future enrichment only.
- **Event-driven architecture.** Every state change emits events. Workflows, timelines, analytics, memory, and coach recommendations all derive from the same immutable event stream.
- **Memory-first.** The system tracks what you know, what you're forgetting, what you've learned, and what your gaps are. Three bespoke memory models (recall strength, topic health, forgetting prediction) power every recommendation.
- **Build, don't configure.** SanOS assumes the user is technical. There are minimal settings screens. The system learns from behavior, not from preference forms.

### Target Users

1. **IIT/college student** preparing for placements (primary persona — the entire DSA revision, academic CGPA, placement readiness, and IIT workspace is built for this user)
2. **Freelance software engineer / agency owner** managing clients, projects, pipeline, invoices, and revenue
3. **Startup CTO / technical founder** juggling product work, team management, business development, and personal learning
4. **Job-seeking engineer** doing LeetCode, building concepts, tracking roadmaps, optimizing for interviews
5. **Knowledge worker** who wants a thinking environment that connects everything

### Core Objectives

| Objective | Status |
|---|---|
| Unified DSA problem catalog + solving workflow | ✅ Complete |
| Spaced-revision engine (SM-2 variant) | ✅ Complete |
| Knowledge vault (notes, resources, links) | ✅ Complete |
| Concept notes linked to problems/patterns | ✅ Complete |
| Dynamic taxonomy (topics + patterns) with AI proposals | ✅ Complete |
| Roadmap engine with progress tracking | ✅ Complete |
| IIT academic workspace (courses, grades, assignments, lectures) | ✅ Complete |
| CGPA engine with what-if simulation | ✅ Complete |
| Memory intelligence (3 models: recall, health, forgetting) | ✅ Complete |
| Daily planner (evening draft → morning adjust → afternoon replan → end-of-day review) | ✅ Complete |
| Universal intake (brain dump → structured entities) | ✅ Complete |
| Project management (tasks, milestones, time tracking, docs, change requests) | ✅ Complete |
| Business OS (clients, pipeline, invoices, quotes, finance) | ✅ Complete |
| Event-driven architecture + workflow engine | ✅ Complete |
| Coach intelligence layer (9 domain coaches) | ✅ Complete |
| Mission Control dashboard (16+ parallel data sources) | ✅ Complete |
| Universal search (across all entity types) | ✅ Complete |
| Command palette (⌘K) | ✅ Complete |
| Focus timer / execution engine | ✅ Complete |
| Notification center with browser bridge | ✅ Complete |
| Context system (what the user is doing, resume support) | ✅ Complete |
| Memory graph (entity relationship graph) | ✅ Complete |
| Voice capture | ⚠️ Basic |
| OCR capture | ⚠️ Basic |
| Calendar sync | ⚠️ Stub |

### Product Positioning

SanOS competes with the **entire suite of productivity tools** by replacing them with a single, interconnected, AI-coached system. It is not a "better Todoist" or a "better Notion" — it is a fundamentally different category: an **operating system for an engineering life**.

### Primary Differentiators

| Dimension | SanOS | Notion | Linear | Todoist | ClickUp | Raycast |
|---|---|---|---|---|---|---|
| Code-specific | Deep DSA + patterns + LeetCode | Generic notes | Bug tracking only | Tasks only | Generic PM | Launcher |
| Memory models | 3 bespoke recall models | ❌ | ❌ | ❌ | ❌ | ❌ |
| Academic (IIT) | Full workspace + CGPA | ❌ | ❌ | ❌ | ❌ | ❌ |
| Business OS | Clients + invoices + pipeline | ❌ | ❌ | ❌ | ✅ Partial | ❌ |
| Event-driven | Full event bus + workflows | ❌ | ❌ | ❌ | ❌ | ❌ |
| Deterministic AI | No-LLM coach engine | ❌ | ❌ | ❌ | ❌ | ❌ |
| Ownership | Self-hosted Supabase | SaaS | SaaS | SaaS | SaaS | SaaS |
| Memory graph | Entity relationship graph | ❌ | ❌ | ❌ | ❌ | ❌ |

### Why Would Someone Use SanOS?

Because they are tired of maintaining 12 different tools that don't talk to each other. SanOS connects DSA practice → revision schedule → memory health → knowledge gaps → placement readiness in a single feedback loop. When you solve one problem, it updates your revision queue, roadmaps, daily log, timeline, analytics, memory models, and coach recommendations — automatically.

### Why Would They Continue Using It?

Because the system compounds. The longer you use it, the better its memory models become, the more accurate its coach, the richer its knowledge graph, and the more personalized its recommendations. After 3 months, SanOS knows your forgetting curve, your optimal study time, your weak topics, your most effective learning patterns, and your CGPA trajectory — and it uses all of this daily.

### What Makes It Unique?

The combination of: (1) a full event-driven architecture in a personal tool, (2) three bespoke memory models trained on actual recall data, (3) a deterministic AI coach that never hallucinates, (4) universal intake that cross-refers everything, (5) an academic CGPA engine with what-if simulation, and (6) the ambition to cover both DSA/engineering AND business/freelance operations in one system.

---

## PART 2 — REPOSITORY ARCHITECTURE

### High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    UI LAYER (Next.js App Router)              │
│  pages/loading/error/skeletons  │  Client Components         │
│  ─────── Server Actions ─────── │  (Zustand stores)         │
└────────────────────────┬─────────────────────────────────────┘
                         │ calls
┌────────────────────────▼─────────────────────────────────────┐
│                    SERVICE LAYER (59 services)                │
│  Orchestrates business logic, composes repositories,          │
│  emits events, runs rules, updates coach models               │
└────────────────────────┬─────────────────────────────────────┘
                         │ calls
┌────────────────────────▼─────────────────────────────────────┐
│                 REPOSITORY LAYER (27 repos)                   │
│  The ONLY database access layer. CRUD for every table.        │
│  Injected via createRepositories() factory.                   │
└────────────────────────┬─────────────────────────────────────┘
                         │ uses
┌────────────────────────▼─────────────────────────────────────┐
│      SUPABASE CLIENT (server.ts / admin.ts / client.ts)       │
│         │                                                     │
│  ┌──────┴──────┐  ┌──────────────┐  ┌──────────────────┐    │
│  │  Postgres   │  │     RLS      │  │ Storage Buckets  │    │
│  │  (29 migs)  │  │  Row-level   │  │ (voice, docs)    │    │
│  └─────────────┘  │   Security   │  └──────────────────┘    │
│                   └──────────────┘                           │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                    PLATFORM ENGINES (singleton)               │
│  EventBus → WorkflowEngine → IntelligenceEngine              │
│  ContextManager → RuleEngine → AutomationEngine              │
│  PredictionEngine → BackgroundJobQueue → CacheManager        │
│  PermissionGuard → EntityResolutionEngine                    │
└──────────────────────────────────────────────────────────────┘
```

### Folder Structure

```
Personal OS/
├── app/                    # Next.js App Router
│   ├── (app)/              # Protected routes (auth required)
│   │   ├── academic/       # IIT academic planner & history
│   │   ├── actions/        # Server actions (intake)
│   │   ├── analytics/      # Analytics dashboard
│   │   ├── business/       # Business OS hub
│   │   ├── clients/        # Client management
│   │   ├── concepts/       # Concept notes & flashcards
│   │   ├── dashboard/      # Alternate dashboard
│   │   ├── execution/      # Daily execution & planner
│   │   ├── finance/        # Finance dashboard
│   │   ├── goals/          # Goal management
│   │   ├── iit-workspace/  # IIT course workspace
│   │   ├── intake/         # Universal intake form
│   │   ├── invoices/       # Invoice management
│   │   ├── kds/            # Kitchen Display System (restaurant)
│   │   ├── knowledge/      # Knowledge OS hub
│   │   ├── knowledge-vault/# Knowledge vault
│   │   ├── notifications/  # Notification center
│   │   ├── overview/       # MISSION CONTROL (main dashboard)
│   │   ├── pipeline/       # Business pipeline
│   │   ├── problems/       # DSA problems
│   │   ├── projects/       # Project management
│   │   ├── resources/      # Universal resources
│   │   ├── revision/       # Spaced repetition
│   │   ├── roadmaps/       # Roadmap engine
│   │   ├── settings/       # User settings
│   │   ├── taxonomy/       # Dynamic taxonomy
│   │   ├── timeline/       # Activity timeline
│   │   ├── vault/          # Knowledge vault (v2)
│   │   ├── layout.tsx      # AppShell wrapper
│   │   └── memory-actions.ts
│   ├── api/                # Route handlers
│   │   ├── calendar/sync   # Calendar sync
│   │   ├── capture/        # Universal capture (OCR + voice)
│   │   ├── context/        # Context drawer API
│   │   ├── events/         # Event query API
│   │   ├── jobs/           # Background job API
│   │   ├── search/         # Universal search API
│   │   ├── voice/upload/   # Voice upload
│   │   └── workflow/       # Workflow execution API
│   ├── auth/               # Auth callbacks
│   ├── login/              # Login page
│   ├── globals.css         # Design system (365 lines)
│   ├── layout.tsx          # Root layout
│   └── proxy.ts            # Next.js 16 middleware (auth)
├── components/             # 131 React components
│   ├── academic/           # 4 files
│   ├── analytics/          # 2 files
│   ├── auth/               # 1 file
│   ├── business-os/        # 7 files
│   ├── charts/             # 5 files (bar, heatmap, progress, radar, sparkline)
│   ├── concepts/           # 3 files
│   ├── dashboard/          # 31 files (Mission Control panels)
│   ├── editor/             # 1 file (Monaco code editor)
│   ├── execution/          # 1 file
│   ├── iit/                # 2 files
│   ├── intake/             # 1 file
│   ├── kds/                # 2 files (restaurant KDS)
│   ├── layout/             # 14 files (shell, sidebar, nav, etc.)
│   ├── notifications/      # 2 files
│   ├── problems/           # 7 files
│   ├── project-os/         # 13 files
│   ├── providers/          # 1 file (theme)
│   ├── resources/          # 2 files
│   ├── revision/           # 2 files
│   ├── roadmaps/           # 1 file
│   ├── settings/           # 1 file
│   ├── taxonomy/           # 1 file
│   ├── timeline/           # 2 files
│   ├── ui/                 # 23 files (primitive UI kit)
│   └── vault/              # 1 file
├── lib/
│   ├── auth/               # Session management
│   ├── automation/         # Automation engine
│   ├── background/         # Background job queue
│   ├── cache/              # Cache manager (3 tier)
│   ├── calendar/           # Calendar provider
│   ├── context/            # Context manager + React provider
│   ├── design/             # Category & status mapping
│   ├── embeddings/         # Embedding provider (Xenova)
│   ├── entity-resolution/  # Entity resolution engine
│   ├── event-bus/          # Event bus (pub/sub)
│   ├── execution/          # Brain dump, planner, priority, scheduler
│   ├── hooks/              # useMediaQuery, useMounted
│   ├── intelligence/       # Life intelligence engine + signal providers
│   ├── kds/                # KDS alert engine
│   ├── notifications/      # Notification provider
│   ├── observability/      # Logger, tracer, metrics
│   ├── ocr/                # OCR provider (Tesseract.js)
│   ├── platform/           # Platform initialization, workflows, automation tasks
│   ├── prediction/         # Prediction engine
│   ├── providers/          # LLM, Search providers
│   ├── repositories/       # 27 repositories (ONLY db access)
│   ├── rules/              # Rule engine + built-in rules
│   ├── security/           # Permission guard
│   ├── server/             # Server context (requireContext, ensureProfile)
│   ├── services/           # 59 services (ALL business logic)
│   ├── storage/            # Storage bucket config
│   ├── supabase/           # Client factories (browser/server/admin/middleware)
│   ├── testing/            # Test infrastructure
│   ├── utils/              # cn(), pattern definitions
│   ├── validators/         # Zod schemas (11 files)
│   ├── voice/              # Speech provider
│   ├── workflow/           # Workflow engine
│   └── mock-data.ts        # 251 lines of mock data
├── database/
│   ├── functions/          # set_updated_at()
│   ├── migrations/         # 29 SQL migration files
│   ├── seeds/              # 4 seed SQL files
│   └── README.md
├── docs/                   # Architecture, launch, release docs
├── store/                  # Zustand stores (UI, draft)
├── types/                  # Database.ts (2789 lines), index.ts
├── scripts/                # Migration & verification scripts
└── public/                 # Static assets, service worker
```

### Subsystems

#### Event Bus (`lib/event-bus/`)
- **Purpose:** Central pub/sub communication backbone
- **Implementation:** In-memory `EventBus` class with Supabase persistence
- **Key features:** `emit()`, `on()`/`off()`, `onAny()`, `replay()`, `Promise.allSettled` dispatch, stats tracking
- **Events:** 80+ canonical event types across 14 domains
- **Persistence:** Every event is written to the `events` table (immutable, append-only)
- **Consumers:** WorkflowEngine, IntelligenceEngine, TimelineService, every domain service

#### Workflow Engine (`lib/workflow/`)
- **Purpose:** Multi-step orchestration for event-driven processes
- **Implementation:** Step-by-step workflow engine with state, rollback, lifecycle hooks
- **Registered workflows:** Invoice Paid, Problem Solved, Daily Plan, Intake Processed, Project Onboarding
- **Trigger types:** event, schedule, manual
- **Persistence:** Writes execution records as events

#### Intelligence Engine (`lib/intelligence/`)
- **Purpose:** Cross-domain signal aggregation and prioritization
- **Implementation:** `LifeIntelligenceEngine` collects signals from 9+ providers, ranks via `PriorityEngine` using `scoreAction()` (0.5×urgency + 0.35×impact + 0.15×momentum)
- **Output:** Battle plan, risk register, missions, recommendations, daily plan
- **Caching:** 15-second in-memory cache

#### Context Manager (`lib/context/`)
- **Purpose:** Tracks the user's current focus (project, client, goal, course, etc.)
- **Implementation:** In-memory cache + DB persistence via `user_context` table
- **Features:** Resume support, active entity tracking, pending actions
- **Consumers:** Whole dashboard, coach engine, entity resolution

#### Rule Engine (`lib/rules/`)
- **Purpose:** Condition-action rules for automated decisions
- **Implementation:** Priority-sorted rule registry with 10 condition operators and 14 action handlers
- **Built-in rules:** 14 built-in rules across academic, execution, memory, project, business domains
- **Output:** Coach warnings, priority adjustments, reminders, timeline events

#### Automation Engine (`lib/automation/`)
- **Purpose:** Scheduled recurring tasks
- **Implementation:** Polling engine (60s interval) with 6 built-in automations
- **Automations:** Nightly plan (22:00), Morning brief (7:00), Evening review (21:00), Weekly review (Sun 10:00), Monthly finance (1st 9:00), Quarterly placement (Jan 1 10:00)

#### Prediction Engine (`lib/prediction/`)
- **Purpose:** Domain-specific predictions
- **Implementation:** Model registry with 4 built-in models (Academic, Placement, Business, Execution)

#### Background Job Queue (`lib/background/`)
- **Purpose:** Async job processing for non-urgent work
- **Implementation:** In-memory queue with priority sorting, concurrency control (default 4), retry with backoff
- **Registered handlers:** daily-review, planner-regeneration, analytics-recomputation, timeline-summarization, semantic-indexing, ocr-processing

#### Entity Resolution Engine (`lib/entity-resolution/`)
- **Purpose:** Resolves natural language mentions to known entities
- **Implementation:** Parallel candidate gathering from 9 data sources, fuzzy matching, context boosting, confidence thresholds
- **Thresholds:** AUTO_LINK = 0.85, AMBIGUOUS = 0.6

#### Repository Layer (`lib/repositories/`)
- **Purpose:** The ONLY database access layer in the system
- **Structure:** 27 repositories, one per domain/table cluster
- **Factory:** `createRepositories(client)` returns a fully-wired `Repositories` object
- **Principle:** All SQL goes through repositories. No direct DB access from services.

#### Service Layer (`lib/services/`)
- **Purpose:** ALL business logic lives here
- **Structure:** 59 services, composed via `createServices(client)` factory
- **Pattern:** Each service receives `Repositories` in constructor, has zero or more dependencies on other services/engines
- **Key services:** See full inventory below

### Dependency Diagram

```
createServices(client)
├── createRepositories(client) → Repositories (27)
│   ├── profile, topics, patterns, problems, attempts
│   ├── reflections, codeVersions, revision...
│   └── (all 27 tables)
├── initializePlatform(repos) → CorePlatform
│   ├── EventBus
│   ├── WorkflowEngine ← registers workflows
│   ├── LifeIntelligenceEngine ← registers signal providers
│   ├── ContextManager
│   ├── RuleEngine ← registers built-in rules
│   ├── AutomationEngine ← registers automation tasks
│   ├── PredictionEngine ← registers models
│   ├── BackgroundJobQueue ← register handlers
│   ├── CacheManager
│   └── PermissionGuard
└── Services (59 getters)
    ├── events ← EventBus
    ├── timeline ← events
    ├── activity ← repos
    ├── revision ← repos + events
    ├── problems ← repos + events
    ├── ...
    ├── memoryIntelligence ← repos
    ├── studentIntelligence ← ALL coaches
    ├── studentCoach ← studentIntelligence
    ├── dailyPlanner ← studentIntelligence + executionEngine
    └── dashboardAggregation ← ALL services
```

### Future Extensibility

The architecture is highly extensible:
- **New domain:** Add migration → repository → service → component → page → events → workflows → coach
- **New workflow:** Register in `lib/platform/workflows.ts`
- **New automation:** Register in `lib/platform/automation-tasks.ts`
- **New coach signal:** Implement `SignalProvider` and register with `LifeIntelligenceEngine`
- **New job type:** Register in `lib/background/job-definitions.ts`
- **New rule:** Add to `lib/rules/built-in-rules.ts`
- **New prediction model:** Register with `PredictionEngine`

---

## PART 3 — DATABASE ANALYSIS

### Entity-Relationship Overview

The database has 60+ tables organized into 17 domains. Every user-owned table shares:
- `id uuid PK default gen_random_uuid()`
- `user_id uuid FK -> auth.users(id) ON DELETE CASCADE`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()` (auto-set by trigger)
- Full RLS enforcing `auth.uid() = user_id`

### Domain 1: DSA Learning Engine (7 tables)

```
users_profile ──1:1──> auth.users
     │
     │ (no direct FK in topics/patterns — they use user_id optionally)
     │
topics ──self-ref──> parent_topic_id
  │         │
  │    patterns
  │         │
  └────< problems >────┐
            │          │
       problem_attempts│
            │          │
       problem_reflections
            │
       problem_code_versions
            │
       revision_queue (SM-2)
```

- `problems` links to `topics` and `patterns` via FK. Dual-ownership: global seed problems (`user_id IS NULL`) + user-added problems.
- `problem_attempts` has 7 cognitive process booleans (understood_statement, identified_pattern, etc.)
- `revision_queue` uses state machine: new → learning → reviewing → mastered → struggling. Interval ladder: [1, 3, 7, 16, 35, 70] days.

### Domain 2: Knowledge & Concepts (5 tables)

```
concept_notes ──> topics, patterns
  │
  ├── concept_resources (screenshots, PDFs, YouTube, articles)
  │
  └── concept_problems (M:M junction → problems)

knowledge_items (unified vault)
  │
  └── knowledge_links (polymorphic → problem/topic/pattern/concept/iit_course)
```

### Domain 3: Roadmap Engine (3 tables)

```
roadmaps (templates OR user-created)
  │
  └── roadmap_items (tree: parent_item_id, depends_on_item_id)
        │
        └── roadmap_progress (per-user per-item status)
```

### Domain 4: Activity & Tracking (3 tables)

```
activity_logs (append-only activity stream)
study_sessions (focused work blocks)
daily_logs (daily rollup: problems_solved, minutes_studied, revisions_done)
```

### Domain 5: IIT Academic (4 tables)

```
academic_semesters ──> iit_courses
  │
  ├── iit_assignments
  ├── iit_lectures
  └── academic_documents

academic_goals (target CGPA, dream company)
```

### Domain 6: AI Mentor (2 tables)

```
ai_daily_briefs (one per user per day — battle plan)
ai_insights (typed findings: weakness, warning, forgotten_topic, strength, recommendation, milestone)
```

### Domain 7: Event System (1 table)

```
events (immutable, append-only — the audit log for everything)
  ├── index on (user_id, created_at DESC)
  ├── index on (event_type)
  ├── index on (entity_type, entity_id)
  └── pgvector embedding index (for semantic search)
```

### Domain 8: Context, Habits, Notifications (5 tables)

```
user_context (1 row per user — active entity, resume payload)
reminders (one-time or recurring, 14 categories)
notifications (state machine: unread/read/snoozed/completed/expired)
user_preferences (1 row per user — focus mode, quiet hours, hourly rate)
```

### Domain 9: Memory Intelligence (3 tables)

```
recall_grades (per-revision test: 4-dimension recall)
recall_strength (cached Model 1 output per problem)
topic_memory_health (cached Model 2 output per topic/pattern)
```

### Domain 10: Project OS (8 tables)

```
projects ──> clients
  │
  ├── project_tasks (backlog → completed, 7 states)
  ├── project_milestones
  ├── project_time_entries (8 categories)
  ├── project_documents
  ├── project_change_requests (scope changes with cost estimates)
  └── project_quotes

project_quotes also → clients
```

### Domain 11: Business OS (5 tables)

```
clients ──> projects, invoices, pipeline_entries, project_quotes
pipeline_entries (lead → proposal → negotiation → won/lost)
invoices (draft → sent → paid/overdue/cancelled)
income_entries
expense_entries
```

### Domain 12: Execution OS (6 tables)

```
time_blocks (daily schedule blocks)
goals (user goals)
focus_sessions (Pomodoro-style)
capture_items (brain dump)
scratchpad_items
daily_plans
```

### Domain 13: Resources (2 tables)

```
resources (universal entity)
resource_links (polymorphic links)
```

### Domain 14: Memory Graph (2 tables)

```
memory_nodes
memory_edges (typed relationships with confidence, evidence)
```

### Index Analysis

**Well-indexed tables:**
- `problems`: 4 indexes covering user_id, topic_id, pattern_id, catalog uniqueness
- `revision_queue`: 3 indexes including `next_revision_idx` (critical for due-query)
- `activity_logs`: 3 indexes including `occurred_at_idx` (for timeline/heatmap)
- `notifications`: 4 indexes including `state_idx` and dedup unique partial index
- `events`: 5 indexes including `entity_idx` and vector index
- `projects`: 4 indexes

**Missing indexes:**
- `problem_attempts(attempted_at)` — timeline queries sort by attempted_at but index is on created_at
- `recall_grades(created_at)` — the composite index `(user_id, problem_id, created_at DESC)` may not serve grade queries by time alone
- `knowledge_items(tags)` — GIN index for tag-based queries
- Several FK columns on smaller tables lack explicit indexes (though Supabase may have auto-indexed them)

### Redundant / Unused Tables

- **`project_milestones`** — the original milestone table from migration 0017. The `project_quotes` table (from 0026) has its own `milestones jsonb` column that may be intended to replace it, but both coexist without a clear migration path.
- **`kds` tables** — restaurant Kitchen Display System tables exist in the schema with no apparent user-facing integration. Likely a side project or experiment.
- **`study_sessions`** — table exists but not heavily used in the UI. The execution engine uses `focus_sessions` and `time_blocks` instead.

### Migration Health

- 29 migrations, clean sequential order
- Migration 0026 has two conflicting files (`0026_memory_intelligence_graph.sql` and `0026_project_manager_upgrade.sql` — different table sets, both numbered 0026)
- Bundle files (`_phase4_bundle.sql`, `_production_bundle_phase5.sql`) are cumulative — good for fresh installs but create drift risk if applied after individual migrations
- The canonical bundle is `_production_bundle_phase5.sql`

### RLS Assessment

- Every user-owned table has correct RLS: `auth.uid() = user_id`
- Global seed tables (topics, patterns, problems, roadmaps with `user_id IS NULL`) have `SELECT` policies for authenticated users
- Events table is correctly append-only (INSERT + SELECT only, no UPDATE/DELETE)
- All policies use `auth.uid()` consistently
- **Gap:** No admin/service-role bypass for maintenance operations
- **Gap:** No workspace/collaboration RLS (by design — single-user)

### Performance Observations

- `events` table is the largest growth vector — every action emits events. No archival/cleanup strategy.
- `activity_logs` — similar unbounded growth concern.
- Vector indexes on `events` and `concept_notes` use IVFFLAT with `lists=100` — works for <1M rows, but needs reindexing as data grows.
- No table partitioning.
- No materialized views (all analytics are live-computed).

---

## PART 4 — FEATURE INVENTORY

### 1. Mission Control (`/overview`)
- **Purpose:** Home dashboard — the morning landing surface
- **Target user:** All
- **Entry point:** `/overview` (root redirect target)
- **Pages:** Main page + 16 panels
- **Services:** dashboardAggregation, studentIntelligence, studentCoach, habitEngine, executionEngine, context, dailyPlanner, finance
- **Database:** 11 tables read in parallel
- **AI:** Coach brief, battle plan, risk register, missions, recommendations
- **Dependencies:** Everything
- **Maturity:** 🟢 **Complete** — 16-section scroll with fallbacks for every section
- **Known limitations:** No customization of panel order/visibility. 11 concurrent fetches on page load.

### 2. Daily Planner (`/execution`)
- **Purpose:** Time-block scheduling with AI planning
- **Target user:** All
- **Entry point:** `/execution`
- **Pages:** Execution dashboard
- **Services:** dailyPlanner, executionEngine
- **Database:** time_blocks, focus_sessions, capture_items, daily_plans
- **AI:** 4-phase planning: evening draft → morning adjustment → afternoon replan → end-of-day review
- **Dependencies:** studentIntelligence for priorities
- **Maturity:** 🟢 **Complete** — full 4-phase cycle
- **Known limitations:** No drag-and-drop time block UI. No calendar integration.

### 3. DSA Problems (`/problems`, `/problems/new`, `/problems/[id]`)
- **Purpose:** Problem catalog, solving workflow, attempt tracking
- **Target user:** Students, job seekers
- **Entry point:** `/problems`
- **Pages:** List, New (4-step form), Detail (with attempts)
- **Services:** problems, activity, revision
- **Database:** problems, problem_attempts, problem_reflections, problem_code_versions
- **AI:** N/A (no AI in solving — pure tracking)
- **Dependencies:** topics, patterns
- **Maturity:** 🟢 **Complete** — global catalog + user problems, full attempt workflow
- **Known limitations:** No integrated code runner. No live IDE integration.

### 4. Revision System (`/revision`)
- **Purpose:** SM-2 spaced repetition for problems
- **Target user:** Students
- **Entry point:** `/revision`
- **Services:** revision
- **Database:** revision_queue, recall_grades
- **AI:** Memory intelligence models compute recall strength and forgetting risk
- **Maturity:** 🟢 **Complete** — full SM-2 with 3 memory models
- **Known limitations:** No mobile push notifications for review time.

### 5. Knowledge Vault (`/vault`, `/knowledge`, `/knowledge-vault`)
- **Purpose:** Unified knowledge repository
- **Target user:** All
- **Entry point:** Multiple
- **Services:** knowledge, knowledgeGraph
- **Database:** knowledge_items, knowledge_links
- **AI:** N/A (storage/retrieval only)
- **Dependencies:** concepts, problems, iit_courses
- **Maturity:** 🟡 **Partial** — CRUD works, no file upload implementation for images/PDFs
- **Known limitations:** File upload is schema-complete but not implemented in UI. No embedding search for vault items.

### 6. Concepts (`/concepts`, `/concepts/new`, `/concepts/[id]`)
- **Purpose:** Structured concept flashcards linked to problems/patterns
- **Target user:** Students
- **Entry point:** `/concepts`
- **Services:** concepts
- **Database:** concept_notes, concept_resources, concept_problems
- **Maturity:** 🟢 **Complete** — full CRUD with resource attachments and problem links
- **Known limitations:** No spaced-revision for concepts themselves.

### 7. Dynamic Taxonomy (`/taxonomy`)
- **Purpose:** Evolvable topic/pattern hierarchy with AI proposals
- **Target user:** Students
- **Entry point:** `/taxonomy`
- **Services:** taxonomy
- **Database:** topics, patterns, taxonomy_usage
- **AI:** Tracks usage patterns, proposes new topics/patterns based on frequency/recency
- **Maturity:** 🟢 **Complete** — usage tracking, AI proposals, accept/dismiss workflow
- **Known limitations:** No automatic taxonomy merge/dedup.

### 8. Roadmap Engine (`/roadmaps`, `/roadmaps/[id]`)
- **Purpose:** Curated learning paths with dependency gating
- **Target user:** Students
- **Entry point:** `/roadmaps`
- **Services:** roadmaps, roadmapCoach
- **Database:** roadmaps, roadmap_items, roadmap_progress
- **AI:** Roadmap coach finds next actionable item
- **Seeds:** Striver A2Z, Blind 75, NeetCode 150, Placement roadmaps
- **Maturity:** 🟢 **Complete** — full progress tracking, dependency-based unlocking
- **Known limitations:** No visual roadmap graph. No automatic roadmap creation from problem set.

### 9. IIT Academic Workspace (`/iit-workspace`, `/iit-workspace/[id]`)
- **Purpose:** Complete IIT degree management
- **Target user:** IIT student
- **Entry point:** `/iit-workspace`
- **Services:** iit, academicCoach, academicPerformance, academicHealth, iitCoach
- **Database:** iit_courses, iit_assignments, iit_lectures, academic_documents, academic_semesters, academic_goals
- **AI:** CGPA projection, what-if simulation, course health warnings
- **Maturity:** 🟢 **Complete** — full workspace with grade tracking, assignment management, lecture progress
- **Known limitations:** No attendance auto-tracking. No auto-import from institutional portals.

### 10. Academic CGPA Engine (`/academic`)
- **Purpose:** SGPA/CGPA tracking with goal management
- **Target user:** IIT student
- **Entry point:** `/academic`
- **Services:** academicPerformance, academicSimulator, gpaProjection
- **AI:** Graduation projection, required GPA per remaining semester, what-if scenarios
- **Maturity:** 🟢 **Complete** — 4 scenario types: future semester, course grade, repeat course, backlog
- **Known limitations:** 10-point IIT scale only. No percentage-scale support.

### 11. Placement Readiness
- **Purpose:** Career readiness tracking
- **Target user:** Job-seeking student
- **Entry point:** Part of overview/academic
- **Services:** placementReadiness
- **AI:** Compares graduation projection vs. target CGPA vs. dream company
- **Maturity:** 🟡 **Partial** — basic check added to overview panel. No dedicated placement dashboard.

### 12. Project Management (`/projects`, `/projects/new`, `/projects/[id]`)
- **Purpose:** Full project lifecycle
- **Target user:** Freelancer, agency owner, CTO
- **Entry point:** `/projects`
- **Services:** project, projectCoach, quoteEngine
- **Database:** 8 tables (projects, tasks, milestones, time entries, docs, change requests, quotes)
- **AI:** Health scoring (schedule, budget, progress), coach warnings, entity-aware creation
- **Maturity:** 🟢 **Complete** — full CRUD with health scores, time tracking, change requests, quotes
- **Known limitations:** No Gantt chart. No external calendar sync. No GitHub integration beyond URL field.

### 13. Business OS (`/business`)
- **Purpose:** Business operations hub
- **Target user:** Freelancer, agency owner
- **Entry point:** `/business`
- **Maturity:** 🟡 **Partial** — hub page exists but primarily routes to clients/pipeline/finance

### 14. Clients (`/clients`, `/clients/new`, `/clients/[id]`)
- **Purpose:** Client relationship management
- **Target user:** Freelancer, agency owner
- **Entry point:** `/clients`
- **Services:** client, businessCoach
- **Database:** clients, related projects/invoices/pipeline/quotes
- **AI:** Natural text → client creation, coach follow-ups
- **Maturity:** 🟢 **Complete** — full workspace with revenue rollup
- **Known limitations:** No email integration. No contact history beyond notes.

### 15. Pipeline (`/pipeline`)
- **Purpose:** Business development funnel
- **Target user:** Freelancer, agency owner
- **Entry point:** `/pipeline`
- **Services:** pipeline, businessCoach
- **Database:** pipeline_entries (6 stages)
- **AI:** Coach follow-ups for stale entries
- **Maturity:** 🟢 **Complete** — 6-stage pipeline with value estimation and weighted totals
- **Known limitations:** No kanban drag-and-drop UI.

### 16. Finance (`/finance`)
- **Purpose:** Revenue, expenses, profit tracking
- **Target user:** Freelancer, agency owner
- **Entry point:** `/finance`
- **Services:** finance
- **Database:** income_entries, expense_entries, invoices
- **Maturity:** 🟡 **Partial** — basic income/expense tracking, monthly snapshot. No financial projections, no tax calculations.
- **Known limitations:** No CSV export. No chart of accounts. Multi-currency incomplete.

### 17. Invoices (`/invoices`)
- **Purpose:** Client invoicing
- **Target user:** Freelancer, agency owner
- **Entry point:** `/invoices`
- **Services:** invoice, businessCoach
- **Database:** invoices (line_items as jsonb)
- **AI:** Overdue detection, coach follow-ups, payment → income entry auto-creation
- **Maturity:** 🟢 **Complete** — full lifecycle: draft → sent → paid/overdue/cancelled
- **Known limitations:** No invoice PDF generation. No email sending. No payment gateway integration.

### 18. Quote Engine (`project->quote tab`)
- **Purpose:** Rule-based project estimation
- **Target user:** Freelancer, agency owner
- **Entry point:** Project detail → quote tab
- **Services:** quoteEngine
- **AI:** Pure heuristics (no LLM) — feature complexity → hours → pricing
- **Maturity:** 🟢 **Complete** — generates summary, milestones, payment schedule
- **Known limitations:** Rate estimation is India/INR-biased. No per-feature PDF breakdown.

### 19. Knowledge Graph
- **Purpose:** Related entity discovery
- **Target user:** Students
- **Implementation:** Derived from existing FK relationships (not a separate store)
- **Maturity:** 🟢 **Complete** — problems share neighbors through topics, patterns, and concepts

### 20. Memory Graph
- **Purpose:** Entity relationship graph with typed edges
- **Target user:** All
- **Implementation:** Separate `memory_nodes` + `memory_edges` tables
- **Maturity:** 🟡 **Partial** — schema exists, edges can be created, but not yet used in any UI surface
- **Known limitations:** No graph visualization. No graph traversal in user-facing features.

### 21. Memory Intelligence (3 Models)
- **Purpose:** Recall strength, topic health, forgetting prediction
- **Target user:** Students
- **Services:** memoryIntelligence (527 lines)
- **Implementation:** 3 mathematical models computed on revision/recall data
- **Maturity:** 🟢 **Complete** — Model 1 (per-problem recall score), Model 2 (topic/pattern rollup), Model 3 (forgetting risk classification)

### 22. Analytics (`/analytics`)
- **Purpose:** Growth metrics and performance dashboard
- **Target user:** Students
- **Entry point:** `/analytics`
- **Services:** analytics
- **AI:** Cognitive funnel analysis (6 stages: understanding → debugging)
- **Maturity:** 🟡 **Partial** — basic metrics page exists. No charts for memory trends, no time-series analysis.
- **Known limitations:** Recharts is imported but analytics page has minimal chart usage.

### 23. Goals (`/goals`)
- **Purpose:** Goal management
- **Target user:** All
- **Entry point:** `/goals`
- **Maturity:** 🟡 **Partial** — page exists, service exists, but limited UI integration

### 24. Timeline (`/timeline`)
- **Purpose:** Activity stream
- **Target user:** All
- **Entry point:** `/timeline`
- **Services:** timeline (277 lines)
- **AI:** Event-to-human-text mapping for 40+ event types
- **Maturity:** 🟢 **Complete** — per-user and per-entity timelines

### 25. Universal Search (`/api/search`)
- **Purpose:** Cross-domain search
- **Target user:** All
- **Entry point:** `/api/search` (called by command palette)
- **Services:** universalSearch (135 lines)
- **Implementation:** ILIKE pattern matching across resources, memory nodes, problems, projects, concepts
- **Maturity:** 🟡 **Partial** — basic keyword search. No semantic/vector search in the search endpoint.
- **Known limitations:** No full-text search (pg_trgm or tsvector). No search result ranking by relevance.

### 26. Command Palette (⌘K)
- **Purpose:** Keyboard-first navigation and creation
- **Target user:** All
- **Implementation:** `CommandPalette` component (313 lines) with entity search via API
- **Maturity:** 🟡 **Partial** — works for navigation and basic search. No "create resource" flow. No deep actions.
- **Known limitations:** No recent items persistence beyond localStorage. No keyboard-first habit creation.

### 27. Universal Intake (`/intake`, `/api/capture`)
- **Purpose:** Natural language → structured data
- **Target user:** All
- **Implementation:** `universal-intake.service.ts` (172 lines) + capture API
- **AI:** Domain detection (learning/project/business/academic/finance/health/personal), entity resolution
- **Maturity:** 🟡 **Partial** — brain dump → capture items works. Domain detection is regex-based and limited. No voice-first capture.

### 28. Voice Capture
- **Purpose:** Speech-to-text
- **Implementation:** `speech-provider.ts`, `/api/voice/upload`
- **Maturity:** 🔴 **Minimal** — stubs exist, no production implementation

### 29. OCR Capture
- **Purpose:** Image-to-text
- **Implementation:** `ocr-provider.ts` (Tesseract.js), `/api/capture`
- **Maturity:** 🔴 **Minimal** — Basic Tesseract integration. No preprocessing. Unreliable for handwritten text.

### 30. Focus Timer & Sessions
- **Purpose:** Pomodoro-style focus tracking
- **Target user:** All
- **Implementation:** `focus-session.tsx`, `focus-timer-widget.tsx`
- **Maturity:** 🟡 **Partial** — basic timer widget exists. No Pomodoro intervals. No break reminders.

### 31. Habits Engine
- **Purpose:** Habit tracking and reminders
- **Target user:** All
- **Services:** habitEngine
- **Database:** reminders, notifications
- **Maturity:** 🟢 **Complete** — 14 category types, recurrence patterns, notification state machine

### 32. Notifications Center (`/notifications`)
- **Purpose:** Unified notifications
- **Target user:** All
- **Services:** event-driven from all domain services
- **Maturity:** 🟢 **Complete** — unread/read/snoozed/completed/expired state machine, browser notification bridge

### 33. Context System
- **Purpose:** Session awareness
- **Target user:** All
- **Implementation:** ContextManager + UniversalContextProvider
- **Maturity:** 🟡 **Partial** — backend complete. Frontend context drawer has basic wiring but limited actual data population.

### 34. Calendar Sync (`/api/calendar/sync`)
- **Purpose:** External calendar integration
- **Implementation:** `calendar-provider.ts` stub
- **Maturity:** 🔴 **Stub** — API route exists, provider interface exists, no implementation

### 35. KDS (Kitchen Display System) (`/kds`)
- **Purpose:** Restaurant order management
- **Target user:** (Unknown — likely experiment or side project)
- **Implementation:** `alert-engine.ts`, `kds-board.tsx`, `order-card.tsx`
- **Maturity:** 🔴 **Experimental** — complete standalone feature that has no integration with any other feature. Likely not part of core product.

### 36. Resources (`/resources`)
- **Purpose:** Universal resource library
- **Target user:** All
- **Services:** resource, resourcePipeline, resourceEffectiveness
- **Maturity:** 🟡 **Partial** — CRUD works, pipeline and effectiveness tracking stubs exist

### 37. Dining Philosophers / Concurrency Demo
- **Purpose:** Probably an algorithm visualization or teaching tool
- **Maturity:** 🔴 **Side project** — not integrated with core workflows

### Feature Maturity Summary

| Feature | Status | Completion |
|---|---|---|
| Mission Control | ✅ Complete | 95% |
| Daily Planner | ✅ Complete | 90% |
| DSA Problems | ✅ Complete | 95% |
| Revision/SM-2 | ✅ Complete | 95% |
| Knowledge Vault | ⚠️ Partial | 70% |
| Concepts | ✅ Complete | 90% |
| Dynamic Taxonomy | ✅ Complete | 90% |
| Roadmap Engine | ✅ Complete | 90% |
| IIT Workspace | ✅ Complete | 90% |
| CGPA Engine | ✅ Complete | 90% |
| Placement Readiness | ⚠️ Partial | 50% |
| Project Management | ✅ Complete | 85% |
| Clients (CRM) | ✅ Complete | 80% |
| Pipeline | ✅ Complete | 80% |
| Finance | ⚠️ Partial | 60% |
| Invoices | ✅ Complete | 80% |
| Quote Engine | ✅ Complete | 80% |
| Memory Intelligence | ✅ Complete | 90% |
| Memory Graph | ⚠️ Partial | 40% |
| Analytics | ⚠️ Partial | 50% |
| Timeline | ✅ Complete | 90% |
| Universal Search | ⚠️ Partial | 50% |
| Command Palette | ⚠️ Partial | 60% |
| Universal Intake | ⚠️ Partial | 60% |
| Voice Capture | 🔴 Minimal | 10% |
| OCR Capture | 🔴 Minimal | 15% |
| Focus Timer | ⚠️ Partial | 50% |
| Habits Engine | ✅ Complete | 80% |
| Notifications | ✅ Complete | 85% |
| Context System | ⚠️ Partial | 50% |
| Calendar Sync | 🔴 Stub | 5% |
| KDS | ⚠️ Experimental | 80% |
| Resources | ⚠️ Partial | 50% |

---

## PART 5 — COMPLETE USER LIFECYCLE

```
Registration (login/page.tsx + proxy.ts middleware)
    │
    ▼
Profile Creation (ensureProfile in server/context.ts)
    │  • Creates users_profile row if absent
    │  • Sets timezone, default preferences
    ▼
Mission Control (/overview)
    │  • Greeting (time-aware)
    │  • Hero stats (total problems, streak, revision due)
    │  • Battle plan (top actions from coach)
    │  • AI insights & coach brief
    │  • Revision queue
    │  • Today's plan & execution metrics
    │  • Memory health overview
    │  • Forgetting forecast
    │  • Risks & missions
    │  • Recent knowledge, concepts, solved problems
    │  • Upcoming assignments
    │  • Finance snapshot
    │  • Activity timeline
    │  • Notifications
    ▼
Project Onboarding (optional)
    │  • Create client (/clients/new)
    │  • Create project (/projects/new)
    │  • Set milestones, add tasks, set deadlines
    │  • Quote estimation (if applicable)
    ▼
Planner (/execution)
    │  • Evening: generate tomorrow's plan
    │  • Morning: adjust plan with fresh signals
    │  • Afternoon: replan remainder if behind
    │  • End of day: review, metrics, notes
    ▼
Business (if applicable)
    │  • Leads → pipeline → clients
    │  • Projects → milestones → tasks → time tracking
    │  • Quotes → invoices → payments → revenue
    │  • Business coach follow-ups
    ▼
Knowledge (continuous)
    │  • Vault: save notes, links, algorithms
    │  • Concepts: create, link to problems
    │  • Topics & patterns: discover, propose, evolve
    │  • Roadmaps: follow, track progress
    │  • Resources: collect, categorize, link
    ▼
Daily Execution
    │  • Brain dump → capture items
    │  • Time blocks → focus sessions
    │  • Problem solving → attempts → reflections
    │  • Revision → recall tests → memory updates
    │  • Complete tasks → log time
    ▼
Review (evening / weekly / monthly)
    │  • End-of-day review (metrics, notes, tomorrow prep)
    │  • Weekly review (automation, Sunday 10:00)
    │  • Monthly finance (1st of month)
    │  • Quarterly placement (Jan 1)
    │  • Coach insights → recommendations
    ▼
Continuous Improvement
    │  • Memory models refine (every revision)
    │  • Knowledge graph grows (every concept/link)
    │  • Taxonomy evolves (every solve)
    │  • Coach personalizes (every action tracked)
    │  • Analytics compound (every session)
    │  • Placement readiness updates
    ▼
Lifecycle Events
    │  • Semester starts → IIT courses → assignments → exams
    │  • New client → project → quotes → invoices → paid
    │  • New job → reduce DSA practice → shift focus
    │  • Business growth → more pipeline → more clients
```

---

## PART 6 — BUSINESS LIFECYCLE

```
Lead Discovery
    │  • Manual entry (/pipeline/new)
    │  • Natural text intake (brain dump → pipeline)
    │  • Entity resolution (detect client, project references)
    ▼
Pipeline Stage: lead
    │  • Value estimate set
    │  • Probability estimate (0-100%)
    │  • Expected close date
    ▼
Pipeline Stage: contacted → proposal → negotiation
    │  • Business coach monitors for staleness (14+ days)
    │  • Coach recommends follow-up
    │  • Events: PipelineStageChanged
    ▼
Pipeline Stage: won
    │  • Event emitted: pipeline.won
    │  • Notification: "Deal won! Consider creating a project"
    │  • Weighted pipeline value updated
    ▼
Client Creation
    │  • Client workspace (projects, invoices, pipeline, quotes)
    │  • Revenue rollup
    │  • Event: ClientCreated
    ▼
Project Creation
    │  • From scratch with form (/projects/new)
    │  • From natural text (brain dump → project)
    │  • Via quote acceptance
    │  • Entity resolution: auto-link to client
    │  • Event: ProjectCreated
    ▼
Project Execution
    │  • Tasks: backlog → todo → in_progress → review → testing → completed → cancelled
    │  • Milestones with target dates
    │  • Time tracking (8 categories: planning, development, design, etc.)
    │  • Documents vault
    │  • Change requests with cost estimates
    │  • Health score auto-computed: schedule + budget + progress
    │  • Project coach: overdue tasks, upcoming milestones, risks
    │  • Events: ProjectTaskCreated/Completed, ProjectMilestoneCompleted
    ▼
Meetings (via time_entries or manual log)
    │  • Tracked as time entries with category "meeting"
    │  • Context system tracks current meeting
    ▼
Quotes
    │  • Quote engine: feature list → hours → price (pure heuristics)
    │  • Milestones with payment schedule
    │  • Status: draft → sent → accepted → rejected
    │  • Event: QuoteSent/Accepted/Rejected
    ▼
Invoices
    │  • Create from project or manually
    │  • Line items as JSONB
    │  • Status lifecycle: draft → sent → paid / overdue → cancelled
    │  • Mark paid → auto-creates income entry
    │  • Overdue detection (InvoiceService.syncOverdue)
    │  • Business coach: follows up on sent/overdue invoices
    │  • Events: InvoiceCreated/Sent/Paid/Overdue/Cancelled
    ▼
Payments
    │  • Invoice.markPaid → income_entry created
    │  • Event: InvoicePaid, RevenueRecorded
    │  • Workflow: Invoice Paid → 7 steps
    │    1. Create income entry
    │    2. Update client health
    │    3. Update revenue analytics
    │    4. Add timeline event
    │    5. Send notification
    │    6. Update memory graph
    │    7. Trigger business coach
    ▼
Revenue Analytics
    │  • Monthly snapshot: revenue, expenses, profit, AR, pipeline value
    │  • Finance dashboard (/finance)
    │  • Finance widget on overview
    │  • Monthly automation: finance summary
    ▼
Predictions
    │  • BusinessPredictionModel (prediction engine)
    │  • Pipeline value projections
    │  • Revenue forecasting (stub)
    ▼
Client Health
    │  • BusinessCoach: client risks (overdue invoices, stalled projects)
    │  • Client workspace: total revenue, outstanding amount
    ▼
Timeline
    │  • Every business event mapped to human-readable timeline entry
    │  • Timeline shows client, project, invoice, pipeline events
    ▼
Memory
    │  • Memory graph edges created for client ↔ project ↔ invoice relationships
    │  • Entity resolution uses memory nodes for context
    │  • Business coach outcomes tracked in events table
```

---

## PART 7 — ACADEMIC LIFECYCLE (IIT)

```
IIT Workspace Setup
    │  • Create semester structure (/academic)
    │  • Set semester number, name, academic year
    │  • Set academic goals (target CGPA, dream company)
    │
    ▼
Course Management
    │  • Add courses per semester (code, name, credits, instructor)
    │  • Set grade/grade_point after completion
    │  • Track attendance percentage
    │  • Course status: in_progress / completed / dropped
    │
    ▼
Assignments
    │  • Per-course assignment tracking
    │  • Due dates, scores, max_scores
    │  • Status: pending / submitted / graded / overdue / resubmitted
    │  • Academic coach: warns on approaching deadlines
    │
    ▼
Lectures
    │  • Lecture-by-lecture progress per course
    │  • Track duration, video URLs, notes
    │  • Status: not_started / watching / completed
    │
    ▼
Learning & Knowledge
    │  • Knowledge vault items can be linked to courses
    │  • Concepts linked to topics/patterns
    │  • Resources (documents: ID cards, hall tickets, certificates)
    │
    ▼
Revision (DSA)
    │  • SM-2 spaced repetition for problems
    │  • Memory intelligence models (recall strength, topic health)
    │  • Forgetting forecast for upcoming revision
    │
    ▼
Patterns & Roadmaps
    │  • DSA patterns taxonomy
    │  • Roadmaps: Striver A2Z, Blind 75, NeetCode 150, IIT-specific
    │  • Progress tracking per roadmap item
    │  • Dependency gating (must complete A before B)
    │
    ▼
Placement Readiness
    │  • Readiness check: CGPA target vs. projection
    │  • Dream company tracking
    │  • GPA projection: what CGPA can you achieve?
    │  • Quarterly placement automation (Jan 1)
    │
    ▼
Coach & Analytics
    │  • Academic coach: course health warnings, assignment risks
    │  • CGPA what-if simulator: 4 scenario types
    │  • Student action scoring (urgency × impact × momentum)
    │  • Battle plan prioritization
    │
    ▼
Timeline
    │  • All IIT events (semester, course, assignment, lecture)
    │  → mapped to human-readable timeline
    │
    ▼
Memory
    │  • Memory graph: IIT entities linked to knowledge, concepts, problems
    │  • Coach outcome tracking for personalization
```

---

## PART 8 — CODING LIFECYCLE (DSA)

```
LeetCode / Problem Discovery
    │  • Browse catalog (/problems)
    │  • Filter by platform (LeetCode, CodeForces, CodeChef, etc.)
    │  • Filter by topic, pattern, difficulty
    │  • Roadmap-guided discovery
    │
    ▼
Problem Solving (4-step workflow)
    │  Step 1: Problem details (title, URL, platform, topic, pattern)
    │  Step 2: Solving (in-browser Monaco editor)
    │  Step 3: Cognitive sliders (7 process booleans)
    │       • Understood statement
    │       • Identified pattern
    │       • Derived algorithm
    │       • Wrote pseudocode
    │       • Coded independently
    │       • Runtime error / Syntax error / Logic error
    │  Step 4: Post-solve reflection
    │       • My explanation
    │       • Algorithm in words
    │       • Bug that stopped me
    │       • Final takeaway
    │       • AI feedback (optional)
    │
    ▼
Daily Log & Streak
    │  • problems_solved incremented
    │  • Streak calculated (consecutive days with solves/revisions)
    │  • Activity logged: "Solved a problem"
    │  • Event emitted: problem.solved
    │
    ▼
Workflow: Problem Solved (7 steps)
    │  1. Schedule revision (SM-2: next_revision in 1 day)
    │  2. Update roadmaps (auto-complete item)
    │  3. Log activity (activity_logs + daily_logs)
    │  4. Update timeline (timeline.event_added)
    │  5. Update memory graph
    │  6. Trigger coach (recompute battle plan)
    │  7. Send notification
    │
    ▼
Memory Models Update
    │  • Recall strength recomputed (Model 1)
    │  • Topic memory health recomputed (Model 2)
    │  • Forgetting forecast updated (Model 3)
    │  • All downstream coach recommendations refreshed
    │
    ▼
Revision (when due)
    │  • Recall grade: 4-dimension test (pattern, algorithm, complexity, mistakes)
    │  • success/failure → SM-2 interval adjustment
    │  • Next review scheduled at [1,3,7,16,35,70] days
    │  • Editor dependency tracked
    │
    ▼
Knowledge Integration
    │  • Create concept notes for learned patterns
    │  • Link problems to concepts
    │  • Link knowledge vault items to problems
    │  • Taxonomy usage tracked (relevance score decayed)
    │
    ▼
Roadmap Progress
    │  • Item auto-marked completed on problem solve
    │  • Next actionable node identified by roadmap coach
    │  • Dependency chain respected
    │
    ▼
Placement Readiness
    │  • CGPA + DSA progress → readiness score
    │  • Battle plan includes "strengthen" and "revise" actions
    │  • Coach recommends weak areas
    │
    ▼
Continuous Loop
    │  • Every solve → every revision → every concept
    │  → updates the entire OS
    │  → coach gets smarter
    │  → memory models get more accurate
    │  → taxonomy evolves
    │  → placement readiness improves
```

---

## PART 9 — DAILY EXECUTION LIFECYCLE

```
Brain Dump (morning / anytime)
    │  • Universal intake (/intake or brain dump widget on overview)
    │  • Free-form text → parsed by UniversalIntakeService
    │  • Domain detection: learning, project, business, academic, etc.
    │  • Entity resolution: detect clients, projects, problems
    │  • Creates capture_items in database
    │  • Event: intake.processed
    │  • Workflow: Intake Processed → routes to timeline, project, planner, analytics
    │
    ▼
Planner (4-phase cycle)
    │
    ├── Evening Draft (22:00, automation)
    │   • Gathers candidates: priorities, goals, captures
    │   • Schedules time blocks for next day
    │   • Energy levels: high → deep work in morning
    │   • Caps at 14 candidates
    │   • Creates daily_plan record
    │
    ├── Morning Adjustment (7:00, on page load)
    │   • Rebuilds today's plan with fresh signals
    │   • Adjusts for new captures, changes in priorities
    │   • Refines time blocks
    │
    ├── Afternoon Replan (if behind)
    │   • Reschedules movable blocks into remaining time
    │   • Defers overflow to tomorrow
    │   • Recovery plan generated
    │
    └── End-of-Day Review (21:00, automation)
        • Reviews metrics: completion rate, deep work minutes
        • Generates review notes
        • Drafts tomorrow's plan
        • Updates coach outcome stats
    │
    ▼
Schedule / Time Blocks
    │  • Time blocks visible on execution page
    │  • Each block: start time, end time, kind (deep_work/meeting/admin/break)
    │  • Start → Running → Complete / Skip
    │  • Focus sessions track interruptions and compute focus score
    │  • Ranked queue: sorted by urgency (minutes until start) × importance
    │
    ▼
Execution
    │  • Work through time blocks
    │  • Switch between focus modes (none, deep_work, revision, learning, etc.)
    │  • Focus mode gates visible battle plan kinds
    │  • Brain dumps can interrupt and be captured
    │  • Quick capture widget for light-weight additions
    │
    ▼
Completion
    │  • Complete time block → metrics updated
    │  • Complete focus session → focus score computed
    │  • Complete task → project updated
    │  • Complete problem → revision scheduled
    │  • Events emitted for every completion
    │
    ▼
Review
    │  • End-of-day: completion rate, schedule accuracy, deep work
    │  • Coach: "Good day" / "Average day" / "Tough day" based on metrics
    │  • Recovery plan if significant missed work
    │  • Evening review panel: what went well, what to improve
    │
    ▼
Tomorrow
    │  • Evening draft creates next day's plan
    │  • Missed work carried forward
    │  • Priorities from coach updated
    │  • Morning adjustment fine-tunes
```

---

## PART 10 — AI INTELLIGENCE

### Architecture

SanOS has **zero chatbot capability by design**. The AI is entirely deterministic — a rule- and signal-based decision engine that scores, ranks, and recommends. The optional LLM provider is for future enrichment only and is currently configured as a no-op.

### Intelligence Engine Components

```
                    ┌─────────────────────────────┐
                    │  LifeIntelligenceEngine     │
                    │  (lib/intelligence/engine.ts)│
                    └──────────┬──────────────────┘
                               │ gathers signals from
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
   ┌────▼────┐          ┌─────▼─────┐          ┌─────▼────┐
   │ 9+ Signal │          │ Priority   │          │  Coach   │
   │ Providers │─────────▶│ Engine     │─────────▶│ Services │
   └───────────┘          │ scoreAction│          └──────────┘
                          │ (0.5×U +   │
                          │  0.35×I +  │
                          │  0.15×M)   │
                          └────────────┘
```

### Universal Intake

- **Input:** Free-form natural language text
- **Process:** Regex-based domain detection → entity resolution (fuzzy match against 9 data sources) → capture items creation
- **Domains detected:** learning, project, business, academic, finance, health, personal
- **Tech detection:** 35+ technology keywords (React, Node, Python, Docker, etc.)
- **Output:** IntakeResult with resolved entities, technologies, captured items

### Entity Resolution

- **Sources:** 9 parallel queries to find candidates (clients, projects, problems, concepts, courses, roadmaps, resources, invoices, memory nodes)
- **Matching:** Fuzzy string similarity with context boost (current project/client +0.1, recent entity +0.05)
- **Thresholds:** AUTO_LINK = 0.85, AMBIGUOUS = 0.6

### Context Engine

- **What AI always knows:**
  - Current page/path
  - Active project, client, goal, course, focus session
  - Active entity type and ID
  - Pending action (resume payload)
  - Last activity timestamp
  - Daily digest: problems solved, revisions done, streak
- **Context flow:** Server-side ContextManager → persisted to `user_context` table → React provider `UniversalContextProvider` → all components via `useUniversalContext()`

### Prediction Engine

4 built-in prediction models:

| Model | Purpose | Implementation |
|---|---|---|
| AcademicPredictionModel | CGPA projection | Delegates to GPA projection service |
| PlacementPredictionModel | Placement readiness | Delegates to placement readiness service |
| BusinessPredictionModel | Revenue projection | Rule-based heuristic |
| ExecutionPredictionModel | Daily execution metrics | Trend-based from weekly report |

### Coach Services (9 domains)

| Coach | Actions | Risks | Insights |
|---|---|---|---|
| AcademicCoach | Review course, assignment warnings | Course health, CGPA feasibility | What-if scenarios |
| KnowledgeCoach | Create concept, link vault, review | Learning gaps | Gap severity |
| MemoryCoach | Revise weakest, review concept | At-risk/decaying topics | Memory-aware recommendations |
| ProjectCoach | Complete overdue, prepare milestone | Overdue tasks, deadline pressure | Health scores |
| BusinessCoach | Follow-up invoice, revive pipeline | Overdue invoices, stalled deals | N/A |
| RoadmapCoach | Next roadmap item | Stalled roadmaps (14+ days) | N/A |
| ExecutionCoach | (summarizes metrics) | N/A | Completion rate trends |
| StudentCoach | (orchestrator layer) | Recovery plan | Daily coach brief |
| PlacementReadiness | (readiness check) | Off-track CGPA | N/A |

### Memory Intelligence (3 Models)

**Model 1 — Recall Strength** (per problem)
```
reliability = Laplace-smoothed success rate
ageRatio = daysSinceLastRevision / scheduledIntervalDays
decay = 2^(-ageRatio / 2)  (half-life at 2x interval)
score = clamp(100 × reliability × decay - calibrationPenalty)
calibrationPenalty = -15 when confidence contradicts outcome
finalScore = 50/50 blend with recall grade scores
```

**Model 2 — Topic Memory Health** (per topic/pattern, rollup of Model 1)
```
healthScore = mean of all tracked problem scores
status: >=75 strong, >=55 stable, >=35 at_risk, <35 decaying, 0 tracked = neglected
trend: >20 point swing = improving/declining
```

**Model 3 — Forgetting Prediction** (per problem)
```
ageRatio >= 2: "likely_forgotten"
ageRatio >= 1 AND score < 60: "at_risk"
ageRatio < 0.25: "recently_reinforced"
otherwise: "stable"
```

### How They Cooperate

```
User Action (solve problem, create concept, etc.)
    │
    ▼
EventBus.emit(eventType, payload)
    │
    ├──▶ EventService.persist() → events table
    │
    ├──▶ WorkflowEngine (if registered workflow matches)
    │       │ e.g., Problem Solved → schedule revision, update roadmaps, etc.
    │
    ├──▶ LifeIntelligenceEngine (all signal providers re-gather)
    │       │
    │       ├── MemoryIntelligenceService
    │       │   → recompute recall strength, topic health, forgetting forecast
    │       │
    │       ├── KnowledgeCoachService
    │       │   → check for learning gaps
    │       │
    │       ├── AcademicCoachService
    │       │   → check course health, assignment risks
    │       │   → recompute CGPA projection
    │       │
    │       ├── ProjectCoachService
    │       │   → check overdue tasks, milestone deadlines
    │       │
    │       ├── BusinessCoachService
    │       │   → check invoice/pipeline status
    │       │
    │       └── RoadmapCoachService
    │           → check roadmap progress
    │
    ├──▶ PriorityEngine
    │       → scoreAction(urgency, impact, momentum)
    │       → ranked list of StudentAction[]
    │
    ├──▶ StudentCoachService
    │       → build DailyCoachBrief
    │       → build BattlePlan
    │       → build RiskRegister
    │       → build Missions
    │       → build RecoveryPlan
    │
    ├──▶ CoachOutcomeService (collect telemetry)
    │       → track shown/started/completed per action kind
    │       → compute effectiveness, start rate, personalization
    │
    └──▶ RuleEngine
            → evaluate all rules
            → execute matching actions (warnings, priority adjustments, etc.)
```

### Every AI Decision

Every AI decision in SanOS:
1. Is deterministic (same input = same output)
2. Is rule-based (no LLM calls)
3. Is scored by a single rubric (`scoreAction`)
4. Is cached (15s TTL)
5. Is fail-soft (one domain failure doesn't crash the page)
6. Is logged as events for traceability
7. Is used for coach outcome personalization

---

## PART 11 — CONTEXT SYSTEM

### What the AI Always Knows

Persisted in `user_context` table (1 row per user):

| Field | Example |
|---|---|
| `active_entity_type` | "project" |
| `active_entity_id` | "uuid-123" |
| `active_session_type` | "focus" |
| `current_focus_topic` | "Dynamic Programming" |
| `pending_action` | "Review invoice #001" |
| `resume_payload` | `{"problemId": "uuid-456", "attempt": 2}` |
| `last_activity_at` | "2026-07-08T14:30:00Z" |

### Context Flow

```
URL Path → /projects/abc-123
    │
    ▼
proxy.ts (middleware) → refreshes session, sets user
    │
    ▼
(app)/layout.tsx (AppShell) → requireContext()
    │
    ├── session.ts → getUser()
    │
    ├── server/context.ts → requireContext(path)
    │       │
    │       └── ContextManager.load(userId)
    │               → reads user_context from DB
    │               → merges with path-based inference
    │               → caches in-memory
    │
    └── UniversalContextProvider (React client component)
            │
            └── useEffect on pathname change
                    → fetches /api/context?path=...
                    → updates UniversalContextState
                    → re-renders components consuming useUniversalContext()
```

### What Components See

```typescript
interface UniversalContextState {
  currentClient: Client | null;
  currentProject: Project | null;
  currentTask: Task | null;
  nextDeadline: Date | null;
  relatedResourcesCount: number;
  openRisksCount: number;
  recentMeetingsCount: number;
  isLoading: boolean;
}
```

### Context in AI Decisions

The ContextManager feeds into:
- **Entity Resolution:** boosts current project/client by +0.1
- **Coach:** "You're in project X — here are the overdue tasks"
- **Daily Planner:** prioritizes blocks related to current work
- **Morning Brief:** "Your focus today should be on reaching agreement with the client"
- **Memory Graph:** edges created from current context to new entities

---

## PART 12 — MEMORY GRAPH

### Structure

```
memory_nodes (each entity in the system)
  │
  └── memory_edges (typed relationships between nodes)
        │
        ├── type: "related_to" | "depends_on" | "part_of" | "references" | etc.
        ├── confidence: 0.0 - 1.0
        ├── evidence: text explaining why the edge exists
        └── metadata: jsonb for extensibility
```

### Node Types

Every entity in the system can be a memory node: client, project, problem, concept, knowledge item, resource, invoice, pipeline entry, IIT course, roadmap, etc.

### Edge Types

Edges are created automatically during operations:
- `problem ↔ topic` via FK
- `problem ↔ pattern` via FK
- `concept ↔ problem` via concept_problems junction
- `knowledge_item ↔ entity` via knowledge_links
- `project ↔ client` via FK
- `invoice ↔ client` via FK
- `project ↔ task` via FK
- Any custom relationship via explicit `memoryGraph.addEdge()`

### How Information Becomes Long-Term Memory

```
User creates concept note about "Two Pointers"
    │
    ├── ▶ storage in concept_notes (short-term)
    │
    ├── ▶ Event: concept.created
    │
    ├── ▶ UniversalIntakeService processes
    │       → entity resolution detects linked problems
    │
    ├── ▶ MemoryGraphService.addEdge()
    │       → concept node ↔ problem nodes
    │       → concept node ↔ pattern node
    │
    ├── ▶ SemanticMemoryService.indexText()
    │       → vector embedding stored on concept_notes.embedding
    │
    ├── ▶ TopicMemoryHealth recomputed
    │       → Two Pointers health score updated
    │
    └── ▶ MemoryCoachService.interventions()
            → if user hasn't revised Two Pointers problems recently
            → "Review Two Pointers — you have 3 problems at risk"
```

### Search Integration

Memory graph nodes are searched by `UniversalSearchService` via ILIKE on `name`. Semantic search uses pgvector on `events.embedding` and `concept_notes.embedding`.

### Current Maturity

- ✅ Memory graph tables exist
- ✅ Graph traversal (BFS up to depth 2)
- ✅ Edge creation in services
- ❌ No graph visualization in UI
- ❌ Memory graph results not surfaced in any user-facing feature
- ❌ No graph-based recommendations (e.g., "users who solved X also solved Y")

---

## PART 13 — EVENT FLOW

### Complete Event Catalog (80+ event types)

**DSA Problems:** `problem.created`, `problem.solved`, `problem.skipped`, `problem.reflection_added`, `problem.code_saved`, `problem_attempt.created`

**Revision:** `revision.scheduled`, `revision.completed`, `revision.recalled`, `revision.forgotten`

**Concepts:** `concept.created`, `concept.updated`, `concept.deleted`, `concept.linked`, `concept.resource_added`, `concept.resource_removed`

**IIT:** `iit.course_added`, `iit.course_updated`, `iit.assignment_created`, `iit.assignment_submitted`, `iit.lecture_completed`, `iit.semester_created`, `iit.semester_completed`, `iit.goal_set`, `iit.grade_updated`

**Taxonomy:** `taxonomy.topic_proposed`, `taxonomy.topic_accepted`, `taxonomy.topic_dismissed`, `taxonomy.pattern_proposed`, `taxonomy.pattern_accepted`, `taxonomy.pattern_dismissed`

**Knowledge:** `knowledge.created`, `knowledge.updated`, `knowledge.deleted`, `knowledge.linked`

**Battle Plan:** `battle_plan.generated`, `battle_plan.step_completed`, `battle_plan.step_skipped`

**Auth:** `auth.user_registered`, `auth.user_logged_in`, `auth.user_logged_out`, `auth.session_refreshed`

**Habits:** `habit.completed`, `habit.skipped`, `habit.streak_milestone`, `reminder.triggered`

**Memory:** `memory.graph_updated`, `memory.health_recomputed`, `memory.edge_created`

**Coach:** `coach.triggered`, `coach.battle_plan_generated`, `coach.insight_generated`, `coach.recommendation_shown`, `coach.action_started`, `coach.action_completed`, `coach.focus_step_completed`, `coach.recovery_generated`, `coach.recovery_completed`

**Projects:** `project.created`, `project.updated`, `project.archived`, `project.task_created`, `project.task_completed`, `project.task_updated`, `project.milestone_completed`, `project.time_logged`, `project.change_request_created`, `project.change_request_approved`, `project.quote_created`, `project.quote_sent`, `project.quote_accepted`

**Clients:** `client.created`, `client.updated`, `client.archived`, `client.meeting_completed`

**Pipeline:** `pipeline.entry_created`, `pipeline.stage_changed`, `pipeline.won`, `pipeline.lost`

**Invoices:** `invoice.created`, `invoice.sent`, `invoice.paid`, `invoice.overdue`, `invoice.cancelled`, `revenue.recorded`

**Planner:** `planner.plan_generated`, `planner.plan_adjusted`, `planner.block_started`, `planner.block_completed`, `planner.block_skipped`, `planner.execution_logged`

**Resources:** `resource.created`, `resource.updated`, `resource.deleted`, `resource.linked`

**Capture:** `intake.processed`, `capture.created`

**System:** `system.error`, `system.warning`, `workflow.*`, `automation.*`, `job.*`, `context.*`, `notification.*`

### Example: Invoice Paid Event Flow

```
User marks invoice as paid (InvoiceService.markPaid)
    │
    ├── ▶ Update invoices table: status="paid", paid_at=now()
    │
    ├── ▶ Create income_entry (auto-accounting)
    │
    ├── ▶ EventBus.emit("invoice.paid")
    │       │
    │       ├── ▶ EventService → write to events table
    │       │
    │       ├── ▶ EventBus.emit("revenue.recorded")
    │       │       → FinanceService snapshot refreshed (via cache invalidation)
    │       │
    │       ├── ▶ WorkflowEngine.start("invoice-paid-workflow")
    │       │       Step 1: Create income entry
    │       │       Step 2: Update client health
    │       │       Step 3: Update revenue analytics
    │       │       Step 4: Add timeline event
    │       │       Step 5: Send notification
    │       │       Step 6: Update memory graph
    │       │       Step 7: Trigger business coach
    │       │
    │       ├── ▶ TimelineService (subscribes to "invoice.*")
    │       │       → Creates human-readable timeline entry
    │       │
    │       ├── ▶ NotificationService
    │       │       → Creates notification
    │       │
    │       └── ▶ BusinessCoach (via coach.triggered)
    │               → Re-evaluates this client's health
    │               → Checks for remaining overdue invoices
    │               → Updates coach recommendations
    │
    ├── ▶ CacheManager.clearNamespace(userId)
    │       → Finance snapshot, dashboard stale
    │
    └── ▶ (Next dashboard render)
            → All services re-fetch → fresh data displayed
```

### Example: Problem Solved Event Flow

```
User solves problem (problem detail page → submit)
    │
    ├── ▶ Create problem_attempt + reflection + code_version
    │
    ├── ▶ EventBus.emit("problem.solved")
    │       │
    │       ├── ▶ WorkflowEngine.start("problem-solved-workflow")
    │       │       Step 1: Schedule revision (SM-2, 1 day)
    │       │       Step 2: Update roadmaps (auto-complete item)
    │       │       Step 3: Log activity (activity_logs + daily_logs)
    │       │       Step 4: Update timeline
    │       │       Step 5: Update memory graph
    │       │       Step 6: Trigger coach
    │       │       Step 7: Send notification
    │       │
    │       ├── ▶ MemoryIntelligenceService recomputes
    │       │       → Model 1: recall strength updated
    │       │       → Model 2: topic memory health updated
    │       │       → Model 3: forgetting forecast updated
    │       │
    │       ├── ▶ RuleEngine evaluates
    │       │       → Check for editorial dependency
    │       │       → Check for struggling pattern
    │       │
    │       └── ▶ CoachOutcomeService tracks
    │               → Increments "strengthen" action success count
    │
    └── ▶ (Next dashboard render)
            → Battle plan updated
            → Revision queue shows new item
            → Memory health reflects new score
            → Forgetting forecast updated
```

---

## PART 14 — WORKFLOW ENGINE

### Documented Workflows

#### 1. Invoice Paid (`invoice-paid-workflow`)
- **Trigger:** Event `invoice.paid`
- **Steps:** 7
- **Steps:** Create income entry → Update client health → Update revenue analytics → Add timeline event → Send notification → Update memory graph → Trigger business coach
- **Failure:** Each step emits an event on failure. No retry configured.

#### 2. Problem Solved (`problem-solved-workflow`)
- **Trigger:** Event `problem.solved`
- **Steps:** 8
- **Steps:** Schedule revision (creates revision_queue entry with SM-2 interval) → Update roadmaps (find linked roadmap items, mark complete) → Log activity (activity_logs + daily_logs) → Update timeline → Update memory graph → Trigger coach → Send notification
- **Failure:** If revision scheduling fails, roadmap updates still proceed (no step dependency).
- **State:** Passes problemId, attemptId, solveStatus between steps via context.

#### 3. Daily Plan Generation (`daily-plan-workflow`)
- **Trigger:** Event `planner.plan_generated`
- **Steps:** 3
- **Steps:** Gather priorities → Check rules → Update context
- **Maturity:** Basic. The real planning logic is in `DailyPlannerService`, not the workflow.

#### 4. Intake Processed (`intake-processed-workflow`)
- **Trigger:** Event `intake.processed`
- **Steps:** 4
- **Steps:** Add to timeline → Update project execution → Update daily planner → Update intelligence & analytics
- **Purpose:** Fan-out from universal intake to all subsystems.

#### 5. Project Onboarding (`project-onboarding-workflow`)
- **Trigger:** Event `project.onboarding_requested`
- **Steps:** 3
- **Steps:** Extract entities → Generate milestones & planner blocks → Notify timeline & memory
- **Maturity:** Stub. The actual entity extraction and milestone generation is not implemented in these workflow steps.

### Workflow Engine Design

```typescript
class WorkflowEngine {
  // Registry
  private definitions: Map<string, WorkflowDefinition>
  register(definition): void
  listDefinitions(): WorkflowDefinition[]
  
  // Execution
  start<I, O>(workflowId, input, userId): Promise<WorkflowContext>
  cancel(executionId): void
  
  // State
  getActiveExecutions(): number
  
  // Lifecycle
  // Each step: execute(context) → rollback() on failure
  // Hooks: onComplete, onError, continueOnError
  // Persistence: writes execution records as events
}
```

### Workflow Limitations

1. Workflow steps are mostly event emissions (not real work). The actual business logic is in services.
2. No cross-step error recovery. If step 3 fails after step 2 committed, step 2 is not rolled back.
3. No workflow persistence beyond events (no `workflow_executions` table).
4. No scheduled workflows (all are event-triggered).
5. No workflow visualization or monitoring UI.

---

## PART 15 — RESOURCE LIFECYCLE

### PDF
- **Storage:** Schema supports `storage_path` in `concept_resources` and `knowledge_items`
- **Processing:** Stub — no actual PDF upload or extraction implemented
- **OCR:** Tesseract.js configured, but only for image capture

### Image
- **Storage:** Same as PDF
- **Processing:** `/api/capture` route handles image → OCR → text extraction
- **OCR Provider:** Tesseract.js via `ocr-provider.ts`

### Voice
- **Storage:** `/api/voice/upload` route exists
- **Processing:** Speech provider interface with stubs. No production implementation.
- **Status:** Early experimental

### GitHub
- **Storage:** `projects.github_repo_url` and `projects.repository_url` fields
- **Processing:** URL-only. No webhook, no commit tracking, no PR integration.

### Meeting
- **Tracking:** Via `project_time_entries` with category "meeting"
- **Context:** ContextManager tracks current meeting
- **Coach:** BusinessCoach may reference meetings in context

### OCR
- **Provider:** Tesseract.js (browser-compatible, local)
- **Integration:** `/api/capture` route → formData with image → OCR → text → brain dump
- **Status:** Basic. No preprocessing (deskew, contrast, binarization). Unreliable for handwriting.

### Search
- **Implementation:** ILIKE on name/title/content across 5 entity types
- **Scoring:** Heuristic (resource +5, memory 3, others 2)
- **Vector search:** pgvector index on `events` and `concept_notes` — not wired into search endpoint yet

### Memory
- **Graph:** `memory_nodes` + `memory_edges` with typed relationships
- **Intelligence:** 3 mathematical models for recall strength, topic health, forgetting
- **Semantic:** Vector embeddings on concept_notes and events

### Projects / Knowledge / Timeline

These are the primary consumer entities. Resources link to them via:
- `knowledge_links` (knowledge → problem/topic/pattern/concept/iit_course)
- `concept_problems` (concept → problem)
- `concept_resources` (concept → file/link)
- `resource_links` (resource → any entity)
- Timeline is derived from events, not linked directly

---

## PART 16 — SEARCH

### Global Search (`/api/search`)
- **Endpoint:** `GET /api/search?q=:query`
- **Coverage:** resources, memory nodes, problems, projects, concepts
- **Method:** ILIKE pattern matching on name/title
- **Scoring:** Resource by type match (+5), memory nodes (3), problems/projects/concepts (2)
- **Type detection:** Heuristic from query text ("meeting", "invoice", "resource")
- **Limitations:** No full-text search (pg_trgm or tsvector). No semantic/vector search. No pagination. No filters.

### Command Palette (⌘K)
- **Trigger:** `⌘K` / `Ctrl+K`
- **Content:** Entity search results + static commands (navigation, creation, quick actions)
- **Static commands:** 10+ navigation items, 3 create actions, 3 quick actions, recent paths
- **Recent paths:** Stored in localStorage, displayed on open
- **Limitations:** No keyboard-first creation flow. No deep actions (e.g., "mark invoice as paid"). No fuzzy search on commands.

### Entity Search (via EntityResolutionEngine)
- **Purpose:** Resolve text mentions to known entities
- **Scope:** clients, projects, problems, concepts, courses, roadmaps, resources, invoices, memory nodes
- **Method:** Fuzzy matching with context boost
- **Used by:** Universal intake, natural language project/client creation

### Semantic Search
- **Infrastructure:** Xenova embeddings (bge-small-en-v1.5, 384 dimensions)
- **Indexed entities:** concept_notes, events
- **Method:** pgvector cosine similarity via `match_semantic_items` RPC
- **Integration:** SemanticMemoryService.indexText/search
- **Limitations:** Not wired into `/api/search`. Only used for semantic memory storage/retrieval. Embedding generation is slow (local model).

### Knowledge Search
- **Purpose:** Find knowledge items by entity
- **Method:** knowledge_links junction table query
- **Scope:** Per-entity "linked resources" rail

### Timeline Search
- **Purpose:** Find events by entity
- **Method:** `events` table queries by (entity_type, entity_id)

### Search Gaps
1. No unified full-text search
2. Semantic search not integrated with UI search
3. No cross-entity graph search
4. No NL-to-query ("show me overdue invoices from last month")
5. No search result highlighting
6. No search suggestions / autocomplete

---

## PART 17 — PRODUCT INTELLIGENCE

### How SanOS Helps Each Domain

| Domain | How SanOS Helps | Key Features |
|---|---|---|
| **Business** | End-to-end client → project → invoice → payment pipeline with coach | CRM, Pipeline, Projects, Invoices, Quotes, Finance |
| **Projects** | Full lifecycle management with auto health scoring | Tasks, Milestones, Time tracking, Docs, Change Requests, Health dashboard |
| **Learning** | Structured DSA practice with progress tracking | Problem catalog, Solving workflow, Reflections, Code versions |
| **Time Management** | AI-powered daily planning with adaptive replanning | 4-phase planner, Time blocks, Focus sessions, Brain dump |
| **Daily Planning** | Evening → Morning → Afternoon → Review cycle | DailyPlannerService with energy levels, priority scoring |
| **Knowledge** | Unified vault with graph connections | Knowledge items, Concepts, Resources, Links |
| **Coding** | End-to-end coding lifecycle | Monaco editor, Code versions, Pattern tracking, Cognitive metrics |
| **Career** | Placement readiness tracking | CGPA projection, Dream company tracking, Readiness score |
| **Placement** | DSA + CGPA → readiness pipeline | Battle plan, Revision, Roadmaps, Coach recommendations |
| **Relationships** | Client relationship tracking | Client workspace, Contact history, Revenue rollup |
| **Finance** | Income/expense tracking with invoice automation | Income entries, Expense entries, Monthly snapshots |
| **Personal Growth** | Habit tracking, goal management, daily review | Habits, Goals, Reflections, Coach |
| **Health** | (Minimal) | Basic habit tracking |
| **Execution** | Focus mode, time blocking, brain dump → action | ExecutionEngine, Focus sessions, Ranked queue |
| **Decision Making** | Deterministic AI coach scores every option | StudentAction scoring (urgency × impact × momentum) |
| **Context** | Full session awareness | ContextManager, UniversalContext, Resume support |
| **Memory** | Three models of long-term retention | Recall strength, Topic health, Forgetting prediction |
| **Productivity** | Everything in one keyboard-first workspace | Command palette, Universal search, Quick capture |
| **Founder Work** | Business + Projects + Learning unified | All features working together |

---

## PART 18 — EVERY USER SCENARIO

### College Student (IIT)

**Morning (8:00 AM):**
- Opens SanOS → `/overview`
- Sees greeting "Good morning, Rohan"
- Battle plan: "Revise Binary Search (2 problems due), work on OS assignment, attend DBMS lecture"
- Sees flash: "2 revision items due today"
- Starts focus session → solves Binary Search problems → revisions logged
- Enters brain dump about today's plan

**Afternoon (2:00 PM):**
- Opens `/execution` → sees afternoon replan
- Block 1: OS assignment (deep work, 45 min)
- Block 2: DBMS lecture notes (learning, 30 min)
- Completes OS assignment → logs time in IIT workspace
- Opens `/academic` → sees CGPA is on track for 8.5 target

**Evening (9:00 PM):**
- Evening review panel: "You completed 4/5 planned blocks"
- Coach: "Average day. Your consistency streak is 3 days."
- Missed work panel: "Dynamics problem — deferred to tomorrow"
- Reviews tomorrow's draft plan
- Checks memory health: "Dynamic Programming needs attention — 3 problems at risk"

**Weekly (Sunday):**
- Weekly review automation (10:00)
- Reviews roadmap progress: "NeetCode 150 at 23/150"
- Checks placement readiness: "CGPA 8.2 vs target 8.5 — needs 9.0 this semester"
- What-if simulator: "Raising OS from B to A lifts CGPA to 8.96"

### Freelance Developer

**Morning:**
- `⌘K` → searches "invoice"
- Finds overdue invoice from client XYZ
- Checks `/pipeline` → one deal in negotiation
- Business coach: "Send follow-up to XYZ — invoice is 7 days overdue"

**Midday:**
- Starts project work for client ABC
- Logs time in project workspace
- Project health shows green (on track)
- Client workspace shows total revenue ₹1.2L, outstanding ₹45K

**Afternoon:**
- New lead texted — uses universal intake: "Built a React dashboard for a fintech startup looking for a full-stack dev"
- Entity resolution detects no existing client → creates new pipeline entry
- Quote engine generates ballpark: 120-180h, ₹2.4L-₹4.5L

**Evening:**
- Finance snapshot: Month revenue ₹85K, expenses ₹12K, profit ₹73K
- Pipeline weighted value: ₹1.8L
- Monthly finance automation ran yesterday

### Startup CTO

**Morning:**
- Mission Control shows: 3 projects active, 12 tasks open, 1 overdue
- Coach: "Project Phoenix has 5 overdue tasks and a milestone in 3 days"
- Checks project health: Phoenix at 42/100 (at risk)

**Midday:**
- Brain dump: "Need to review the auth system PR, meeting with designer at 3pm, server costs up 20%"
- SanOS auto-creates: time block for PR review, time block for meeting, captures expense note
- Reviews PR in project workspace → logs time

**Afternoon:**
- Context drawer shows current project info while browsing
- Checks memory: knowledge graph shows related architecture concepts from past projects
- `/resources` → finds a past architecture doc linked to current project

**Weekly:**
- Quarterly placement automation irrelevant (not job-seeking)
- Instead: weekly review checks business health
- Pipeline: 2 deals, weighted ₹5L
- Revenue this month: ₹2.8L

### Job-Seeking Engineer

**Entire focus on DSA:**
- Works roadmaps: Blind 75 → topic-by-topic
- Daily battle plan from coach: "Revise (3 items), Strengthen (2 DP problems), Learn (1 concept)"
- After each solve: revision scheduled, roadmap updated, memory model recomputed
- Weekly: checks placement readiness score
- Monthly: reassesses target companies

---

## PART 19 — AUTOMATION OPPORTUNITIES

### Manual Work Identified

| Task | Current State | Automation Opportunity | Impact |
|---|---|---|---|
| Brain drain → structured data | Manual entry in forms | Universal intake should feed ALL entities | High |
| Daily planning | Auto-generated but manual adjustment | Learn user's work patterns, auto-schedule preferred times | High |
| Invoice overdue tracking | `syncOverdue` must be called | Cron job or event-triggered | High |
| Grading/score entry for IIT assignments | Manual | Bulk import from CSV? Auto-from-grade card? | Medium |
| Taxonomy evolution | Auto-proposed but requires accept/dismiss | Auto-merge low-confidence into correct parent | Medium |
| Concept → problem linking | Manual during create | Auto-suggest based on same topic/pattern | Medium |
| Knowledge graph edges | Manual in some places | Auto-create from existing FK relationships | Medium |
| Time logging for projects | Manual | Auto-track via focus sessions + execution blocks | High |
| Revision queue cleanup | None | Auto-archive mastered problems (30+ days no failures) | Low |
| Session context resumption | Manual navigation | "Resume where you left off" shortcut | Medium |
| Meeting note → timeline | Manual | Auto-create timeline entry from capture | Medium |
| Revenue predictions | Manual glance at snapshot | Auto-forecast based on pipeline + history | Medium |
| Placements quarterly review | Automation exists but minimal | Monthly check-in with coach email | Low |

### Repeated Navigation

| Navigation | Occurrence | Optimization |
|---|---|---|
| `/overview` → check revision → `/revision` | Multiple times daily | Inline revision widget on overview |
| `/problems` → search → solve → `/problems/[id]` | Multiple solves | Keep last problem context in sidebar |
| Brain dump → `/intake` | Multiple daily | Global sticky capture button |

### Duplicate Entry

| Data | Entered Where | Should Sync |
|---|---|---|
| Client name | Pipeline + Client + Invoice + Quote | Already linked via FK — good |
| Problem title | Problem + Attempt + Reflection | Already linked — good |
| Time spent | Time entry + Daily log | Time entry → daily log auto-updates |
| Concept content | Concept note + Knowledge vault | Not linked — should cross-link |

### Unused AI

| AI Capability | Implemented? | Not Used For |
|---|---|---|
| Embedding search | Yes (pgvector) | Not wired into `/api/search` |
| Prediction engine | Yes (4 models) | Results not surfaced in any UI |
| Memory graph traversal | Yes (BFS) | Not used for recommendations |
| Coach outcome personalization | Yes (tracked) | Not used for coach adaptation |
| Entity resolution | Yes | Only used in intake, not for auto-linking existing data |

---

## PART 20 — UX AUDIT

### Scoring Rubric
1-5 scale where 3 = industry average, 4 = well-executed, 5 = world-class

| Dimension | Score | Notes |
|---|---|---|
| **Navigation** | 4.0 | Sidebar groups are logical. Command palette is fast. Bottom nav for mobile works. |
| **Hierarchy** | 3.5 | Pages generally have good structure. Some pages lack visual hierarchy (too many panels). |
| **Typography** | 4.5 | Excellent custom utilities (text-display, text-heading, text-section, etc.). Good scale. |
| **Spacing** | 4.0 | Consistent use of spacing. Good use of `mx-auto max-w-[1600px]`. |
| **Animations** | 4.5 | Framer Motion for command palette, page transitions. CSS animations for count, fade-up. Stagger children. Motion scale variables. |
| **Loading** | 3.5 | Skeleton loaders exist. Loading.tsx for each route. But no progressive loading — all-or-nothing Promise.all. |
| **Accessibility** | 2.5 | No aria labels on interactive elements. No keyboard navigation support beyond basics. No focus indicators in custom CSS (ring-focus exists but unused). No screen-reader support. |
| **Apple quality** | 3.5 | Design system shows Apple inspiration (glass, surface-card, surface-highlight, motion scale). But execution has inconsistencies. |
| **Linear quality** | 4.0 | Sidebar, command palette, and overall aesthetic clearly inspired by Linear. Close to achieving it. |
| **Notion quality** | 3.0 | Less flexible than Notion. No block editor. No inline databases. |
| **Mission Control** | 4.0 | Rich dashboard with 16 sections. Good use of panels. Could benefit from customization. |
| **Project Workspace** | 3.5 | Tabs work well. Health score is a nice touch. Could use more visual polish. |
| **Planner** | 3.0 | Functional but no drag-and-drop. No visual calendar view. Time blocks are text-based. |
| **CRM (Clients)** | 3.5 | Clean client workspace. Revenue rollup is useful. Missing contact activity timeline. |
| **Command Palette** | 3.5 | Good search. Could use more actions (create, convert, mark complete). |
| **Bottom Navigation (mobile)** | 4.0 | Clean. Icons + labels. Context-aware. |
| **Page Transitions** | 4.0 | PageTransition component with Framer Motion. Subtle and non-intrusive. |

### Overall UX: 3.6 / 5.0

**Strengths:**
- Consistent design language inspired by Linear/Apple/Raycast
- Good animation system with motion scale variables
- Clean typography with utility classes
- Dark/light mode parity
- Command palette for power users
- Accessible bottom nav for mobile

**Weaknesses:**
- Accessibility is an afterthought (no screen-reader support, no keyboard navigation, no focus management)
- No drag-and-drop anywhere (time blocks, kanban, sidebar reorder)
- All-or-nothing data loading on dashboard (11 parallel fetches)
- No responsive sidebar (hidden on mobile, context drawer only)
- Form UX is basic (no multi-step wizards except problem creation)
- No empty states with onboarding guidance for new users

---

## PART 21 — PERFORMANCE AUDIT

| Metric | Assessment | Notes |
|---|---|---|
| **Build** | ⚠️ Slow | Turbopack disabled in build (`next build`, not `next build --turbo`). Bundle analyzer configured. ServerExternalPackages (Xenova, onnxruntime) increase lambda size. |
| **Rendering** | ⚠️ Mixed | Server components where possible. Dashboard uses Promise.allSettled. But no streaming (React 19 supports it — not used). No Suspense boundaries. |
| **Navigation** | ✅ Fast | App Router. Instant route transitions. Layout caching. |
| **Queries** | ⚠️ N+1 Risk | Some service methods use sequential `await` in loops instead of `Promise.all`. Dashboard: 11 parallel fetches is good, but each fetch hits DB. |
| **Bundle** | ⚠️ Large | Monaco editor (~2MB), Recharts (~500KB), Xenova/transformers (~5MB server). optimizePackageImports configured for lucide-react and recharts. |
| **Caching** | ✅ Good | 3-tier cache (global 30s, data 15s, query 5s). Platform engine caching. 60s dashboard cache. |
| **Hydration** | ⚠️ Client-heavy | Several 'use client' components that could be server components. Zustand stores cause re-renders on every store change. |
| **Memory (client)** | ⚠️ Medium | Zustand stores, Framer Motion animations, Recharts SVGs. No observed leaks but no monitoring. |
| **Services** | ✅ Good | Clean singleton pattern with lazy initialization. |
| **Event Bus** | ✅ Good | In-memory dispatch is fast. Promise.allSettled prevents cascade failures. |
| **Workflow Engine** | ⚠️ Basic | Sequential step execution. No parallel steps. No persistence. |

### Performance Issues

| Issue | Severity | Location |
|---|---|---|
| 11 parallel DB fetches on dashboard load | High | `overview/page.tsx` |
| No streaming/Suspense for dashboard sections | High | `overview/page.tsx` |
| Large bundle from Monaco editor | Medium | `components/editor/code-editor.tsx` |
| Sequential DB queries in some repository methods | Medium | Various repos |
| Xenova/transformers in server bundle | Medium | `next.config.ts` |
| No data prefetching for critical paths | Medium | All routes |
| Zustand store causes cascading re-renders | Low | All store consumers |
| No image optimization for uploaded resources | Low | Resource upload flow |
| No pagination on timeline/activity_logs queries | Low | Timeline, notifications |
| Vector indexing will slow on >100K event rows | Medium | Events table with IVFFLAT |

### Cache Strategy

| Cache | TTL | Used By |
|---|---|---|
| `globalCache` | 30s | Platform-wide |
| `dataCache` | 15s | Intelligence engine, dashboard aggregation |
| `queryCache` | 5s | Quick queries |
| `dashboardAggregation` | 60s (per-process) | Overview page |

---

## PART 22 — SECURITY AUDIT

| Area | Status | Notes |
|---|---|---|
| **Authentication** | ✅ Good | Supabase Auth with email/password, magic link, Google OAuth. Session refresh in middleware. |
| **Authorization** | ✅ Good | RLS on every table: `auth.uid() = user_id`. |
| **RLS** | ✅ Good | Correct SELECT/INSERT/UPDATE/DELETE policies per table. Global seed rows readable by all authenticated. Events table is append-only. |
| **Secrets** | ⚠️ Concern | `.env.local` has actual keys (gitignored). No Vercel environment variable documentation. |
| **Providers** | ✅ Safe | LLM provider is no-op by default. All external providers can be configured via env vars. |
| **Uploads** | ⚠️ Incomplete | Storage buckets configured (0010 migration). No server-side validation beyond MIME type check in `/api/capture`. |
| **Storage** | ⚠️ Basic | Bucket RLS configured but upload flow not fully implemented. |
| **Rate Limiting** | ❌ Missing | No rate limiting on any API route or auth endpoint. |
| **Validation** | ⚠️ Partial | Zod schemas exist for most entities (11 validator files). Not all service methods validate input. |
| **SQL Injection** | ✅ Safe | Supabase JS client parameterizes all queries. No raw SQL in service/repository layer. |
| **XSS** | ✅ Safe | React automatically escapes output. |
| **CSRF** | ⚠️ Basic | Next.js built-in CSRF protection for Server Actions. API routes are stateless (no CSRF tokens). |
| **Session Management** | ✅ Good | Supabase SSR. Middleware refreshes on every request. 1-hour session expiry. |
| **Permission Guard** | ⚠️ Stub | PermissionGuard class exists but always grants access. Not wired into any actual authorization flow. |

### Security Issues

| Issue | Severity | Location |
|---|---|---|
| No rate limiting on login/auth endpoints | Critical | `/login/actions.ts` |
| Upload validation is MIME-type only | Medium | `/api/capture/route.ts` |
| No email verification enforcement | Medium | Auth configuration |
| PermissionGuard is a no-op | Medium | `lib/security/permissions.ts` |
| .env.local contains real keys (should use Vercel env) | Low | Root |
| No audit log for security events | Low | Not implemented |
| API routes have no CSRF tokens | Low | All `/api/*` routes |

---

## PART 23 — TECHNICAL DEBT

### Dead Code

| File | Lines | Reason |
|---|---|---|
| `components/kds/*` | ~200+ | Restaurant KDS — no integration with any other feature. Side project. |
| `lib/kds/alert-engine.ts` | ~50 | Unused outside KDS |
| `lib/security/permissions.ts` | ~120 | Always grants access. No-op. |
| `lib/calendar/calendar-provider.ts` | ~30 | Stub interface. Not implemented. |
| `database/migrations/0024_restaurant_kds.sql` | ~50 | Unused domain tables |
| `proxy.ts` | ~40 | Middleware that bounces to /login — correct but could be merged with supabase/middleware |
| `fix_mapped_type.js`, `patch_types.js`, `patch_types_2.js` | ~20 each | Temporary build fixes, not cleaned up |

### Unused Services

| Service | Reason |
|---|---|
| `reminder-engine.service.ts` | Reminder logic in habit-engine.service instead |
| `alarm-engine.service.ts` | Not invoked from any page |
| `resource-effectiveness.service.ts` | Stub |
| `resource-pipeline.service.ts` | Stub |

### Duplicate Logic

| Code | Duplicated In |
|---|---|
| Problem-solving cognitive sliders | `problem_attempts` columns AND UI checkboxes — OK by design |
| Streak calculation | `dailyDigest()` in context-engine AND memory coach |
| CGPA calculation | `gpa-projection.service.ts` AND `academic-performance.service.ts` |
| ScoreAction (0.5×U + 0.35×I + 0.15×M) | Defined in `student-action-scoring.ts`, used in all coaches |
| Event type constants | `event.service.ts` (EVENT_TYPES) AND `event-bus/types.ts` (SYSTEM_EVENT_TYPES) |
| Focus mode configuration | `HabitEngineService.getFocusModeConfig()` AND `overview/page.tsx` switch |

### Circular Imports

Potential issue area: Services library barrel file (`services/index.ts`) imports all 59 services, each of which imports `BaseService`. `BaseService` likely imports `Repositories`, which is exported from `repositories/index.ts`. If any service imports another service (not just repos), this creates a chain that could lead to circular deps. Not confirmed broken but architecturally risky.

### Slow Queries

| Query | Table | Issue |
|---|---|---|
| `unreadCount()` | `notifications` | Full count query without pagination |
| `findOverdue()` | `invoices` | No index on (status, due_date) — only (user_id, status_idx) and (due_date_idx) separately |
| `heatmap()` | `activity_logs` | No user_id prefix in between-date query — only `user_id_idx` exists, `occurred_at_idx` is alone |
| `getEntityTimeline()` | `events` | Uses `entity_idx` (entity_type, entity_id) — correct index, but large table |
| `dashboardAggregation.snapshot()` | 11 tables | Sequential + parallel. Each call does 5+ sub-queries. |

### Missing Indexes

| Table | Missing Index | Impact |
|---|---|---|
| `problem_attempts` | `(user_id, attempted_at DESC)` | Timeline queries |
| `invoices` | `(status, due_date)` | Overdue detection |
| `knowledge_items` | GIN on `tags` | Tag-based filtering |
| `project_tasks` | `(user_id, status, due_date)` | Overdue task queries |
| `daily_logs` | `(user_id, log_date DESC)` | Streak calculation |
| `iit_assignments` | `(user_id, due_date) WHERE status != 'completed'` | Due assignment queries |

### Overengineering

| Area | Assessment |
|---|---|
| **Event Bus** | Full pub/sub with replay is overkill for a single-user app. But justified for architecture consistency. |
| **Workflow Engine** | 5 registered workflows, each mostly emitting events. Could be simpler event handlers. But extensible. |
| **Automation Engine** | Polling every 60s for 6 tasks. Could use cron. But works. |
| **Background Job Queue** | In-memory queue with priority, retry, concurrency. For a single-user app, simple setTimeout would work. But correct pattern. |
| **Intelligence Engine** | Properly abstracted with providers, caching, scoring. Good design. |
| **Cache Manager** | 3-tier cache with TTL, eviction, namespacing. Overkill for single-user but ready for scale. |
| **Observability** | Full logger, tracer, metrics collector. No external monitoring (no Datadog, Sentry, PostHog). In-memory only. |

### Architectural Drift

| Expected | Actual | Drift |
|---|---|---|
| Services only call repos | Some services instantiate other services directly | Medium |
| All events through EventBus | `event.service.ts` is a separate EventService that wraps EventBus | Low (intentional compatibility layer) |
| Workflows handle orchestration | Workflows mostly emit events that services already handle | Medium (workflows are thin) |
| Repositories are the only DB layer | Direct `createClient()` calls in API routes bypass repos | Low (API routes use services) |

---

## PART 24 — MISSING FEATURES

### Missing Integrations (Ranked by Impact)

| Integration | Impact | Effort | Notes |
|---|---|---|---|
| GitHub/GitLab sync | 🔴 Critical | Medium | Projects have `github_repo_url` field but no webhook, no commit → timeline, no PR tracking |
| Google Calendar / Outlook sync | 🔴 Critical | Medium | Calendar/sync route is a stub. Entire system lacks calendar awareness (deadlines don't sync) |
| Email (Gmail/SMTP) | 🟠 High | Medium | No sending invoices, quotes, or notifications via email |
| LeetCode auto-import | 🟠 High | Low | Problems have `external_problem_id` but no auto-import from LeetCode profile |
| WhatsApp / Telegram notifications | 🟡 Medium | Medium | For reminders and coach briefs |
| Payment gateway (Razorpay/Stripe) | 🟡 Medium | High | Invoice → payment is fully manual |
| Slack / Discord | 🟡 Medium | Low | Daily brief delivery to chat |
| Notion / Obsidian import | 🟢 Low | Medium | For knowledge vault migration |
| Linear / GitHub Issues import | 🟢 Low | Medium | For project task migration |

### Missing Workflows

| Workflow | Impact | Notes |
|---|---|---|
| New user onboarding | 🔴 Critical | No welcome flow, no first-project wizard, no tutorial |
| Data backup/export | 🟠 High | No way to export data as JSON/CSV |
| Deadlines → calendar sync | 🟠 High | Project deadlines, assignment due dates, invoice due dates don't sync anywhere |
| Habit completion → daily log | 🟡 Medium | Habits tracked but not integrated with daily execution metrics |
| Concept revision scheduling | 🟡 Medium | Only problems have spaced revision. Concepts don't. |
| Automated invoice reminders | 🟡 Medium | syncOverdue exists but no auto-email to client |

### Missing Automation

| Automation | Impact | Notes |
|---|---|---|
| Auto-detect stale taxonomy topics/patterns | 🟡 Medium | Taxonomy_usage tracks frequency but no auto-cleanup |
| Auto-link knowledge to related entities | 🟡 Medium | Entity resolution exists but not used for batch back-linking |
| Auto-archive mastered problems from revision | 🟢 Low | Problems with 30+ days of successful recall could be auto-archived |

### Missing AI

| AI Feature | Impact | Notes |
|---|---|---|
| Smart scheduling (learn user's hours, energy patterns) | 🟠 High | Energy levels are hardcoded (high in morning). Should learn from completion data. |
| Natural language querying | 🟡 Medium | "What did I work on last week?" should be a natural language query |
| Anomaly detection | 🟡 Medium | "You usually solve 3 problems/day but only 1 today — what's up?" |
| Coach personality adaptation | 🟡 Medium | Some users prefer blunt, some prefer encouraging. Coach is always neutral. |
| Predictive task duration | 🟡 Medium | Estimated minutes are placeholders. Should learn from actual completion time. |

### Missing UX

| UX Feature | Impact | Notes |
|---|---|---|
| Drag-and-drop time blocking | 🟠 High | No calendar view, no drag to reschedule |
| Mobile app (PWA) | 🟠 High | `public/sw.js` exists. `manifest.ts` exists. Not fully configured for offline use. |
| Empty states / onboarding | 🟠 High | New users see empty overview with no guidance |
| Right-click context menus | 🟡 Medium | No "quick action" menus on entities |
| Multi-select / batch operations | 🟡 Medium | Cannot mark multiple tasks complete at once |
| Undo | 🟡 Medium | No undo for any action |
| Dark mode toggle location | 🟢 Low | Hidden in top-header, no explicit toggle in settings |
| Search filters | 🟢 Low | Search is keyword-only with no type/filter/date filters |

### Missing Business Logic

| Feature | Impact | Notes |
|---|---|---|
| Tax calculations (GST/VAT) | 🟡 Medium | Invoices have no tax fields |
| Timezone-aware scheduling | 🟡 Medium | user_profile has timezone but many date operations don't use it |
| Multi-currency support | 🟢 Low | Invoice has `currency` field but default is 'INR' throughout |
| Expense categorization (buckets) | 🟢 Low | Expense entries have no category field |
| Recurring invoices | 🟢 Low | No subscription/recurring billing support |

---

## PART 25 — PRODUCT SCORECARD

### Scoring Rubric
1-5, where:
- 1 = not implemented / broken
- 2 = partial / early
- 3 = functional / average
- 4 = good / above average
- 5 = excellent / world-class

| Domain | Score | Explanation |
|---|---|---|
| **Architecture** | 4.2 | Clean layered hexagonal architecture. Event-driven. Engine layer. Repository pattern. Well-factored. Slight overengineering in some areas. |
| **Engineering** | 3.8 | Well-organized codebase. Consistent patterns. Good use of TypeScript. Some technical debt (dead code, circular import risk). |
| **UI** | 3.8 | Linear-inspired aesthetic. Good design system. Consistent typography. Missing polish in forms and empty states. |
| **UX** | 3.6 | Fun to use for power users. Steep learning curve for new users. No onboarding. No mobile optimization. Keyboard-first works. |
| **AI** | 4.5 | Exceptionally well-designed deterministic AI. Three memory models are genuinely novel. Coach scoring rubric is clean. No LLM dependency is a strength. |
| **Business** | 3.5 | Full CRM + pipeline + invoices + quotes. Missing: tax, email, payment gateway, multi-currency. Functional for freelancers. |
| **Academic** | 4.0 | Comprehensive IIT workspace. CGPA engine with what-if simulation is excellent. Placement readiness is thin. |
| **Planner** | 3.0 | Good 4-phase cycle. Weak UI (no drag-drop, no calendar). No mobile. Energy levels hardcoded. |
| **Projects** | 3.8 | Full lifecycle with health scores, time tracking, change requests. Missing: Gantt, calendar sync, collaboration. |
| **CRM (Clients)** | 3.5 | Clean workspace with revenue rollup. Missing: contact activity timeline, email history, meeting notes. |
| **Finance** | 3.0 | Basic income/expense tracking. Monthly snapshot is useful. No projections, no tax, no multi-currency. |
| **Knowledge** | 3.5 | Vault + concepts + links. File upload not implemented. No spaced revision for concepts. No full-text search. |
| **Resources** | 2.5 | Schema exists. Basic CRUD. Pipeline and effectiveness tracking are stubs. |
| **Timeline** | 4.0 | Excellent event-to-text mapping for 40+ types. Per-entity and global timelines. |
| **Memory** | 4.5 | Three mathematical models for recall, health, forgetting. pgvector support. Intelligent coach use. |
| **Performance** | 3.2 | Caching is good. Bundle size is concerning. Dashboard loads 11 queries. No streaming. |
| **Scalability** | 2.5 | Single-user by design. No workspace/collaboration. Events table unbounded. No partitioning. Single Postgres. |
| **Interconnection** | 4.5 | Every feature talks to every other feature. Problem solve → revision → roadmap → coach → memory → all updated. |
| **Automation** | 3.5 | 6 built-in automations. Workflow engine. Rule engine. Event-driven. Missing many high-ROI automations. |
| **Overall** | 3.6 | Exceptionally ambitious and well-architected for a personal tool. The memory intelligence, event-driven design, and deterministic AI coach are genuinely innovative. Major gaps in UX polish, mobile, integrations, and some business features. |

---

## PART 26 — ROADMAP

### P0 — Immediate Fixes (1-2 weeks)

| Item | Effort | Impact | Notes |
|---|---|---|---|
| Add rate limiting to auth endpoints | 1 day | Critical security | Without it, login is brute-forceable |
| Remove dead KDS code/files | 0.5 day | Cleanup | ~200 lines of unused code |
| Clean up migration 0026 conflict | 0.5 day | Schema cleanliness | Two files with same number |
| Fix PermissionGuard (actual enforcement or remove) | 1 day | Security clarity | Currently a no-op |
| Add missing indexes (overdue invoices, timeline queries) | 1 day | Performance | 6 indexes identified above |
| Empty state / onboarding for new users | 3 days | UX critical | No guidance = churn |

### P1 — High Priority (1-2 months)

| Item | Effort | Impact |
|---|---|---|
| **Dashboard streaming with Suspense** | 3 days | Improve perceived performance 10x |
| **Implement file upload for resources/vault** | 3 days | Unblock knowledge vault |
| **Wire semantic search into `/api/search`** | 2 days | Dramatically improve search quality |
| **Add pagination to timeline, events, notifications** | 2 days | Prevent unbounded query growth |
| **Implement Google Calendar sync** | 5 days | Critical integration gap |
| **Add email sending for invoices** | 5 days | Blocking for business use |
| **Implement LeetCode auto-import** | 3 days | High-value for student users |
| **Add drag-and-drop time blocking** | 5 days | Major UX improvement for planner |
| **Complete PWA setup for offline** | 3 days | Enable mobile usage |
| **Add GIN index on knowledge_items.tags** | 0.5 day | Tag search |

### P2 — Medium Priority (2-4 months)

| Item | Effort | Impact |
|---|---|---|
| Concept spaced revision (SM-2 for concepts) | 5 days | Apply memory models to concepts |
| GitHub webhook integration | 5 days | Auto-update project timeline |
| Multi-currency support for invoices | 3 days | Enable international freelancers |
| Add tax fields to invoices | 2 days | Compliance |
| Customizable dashboard panels | 5 days | UX personalization |
| Notification preferences UI | 2 days | Currently no way to configure |
| Coach personality modes | 3 days | "Strict coach" vs "encouraging" |
| Background job persistence | 3 days | Survive server restart |
| Graph visualization for memory/knowledge | 5 days | Surface memory graph |
| Payment gateway integration (Razorpay) | 7 days | End-to-end payment |

### P3 — Future Ideas (6+ months)

| Item | Effort | Notes |
|---|---|---|
| Collaboration/workspace support | Large | Multi-user projects, shared roadmaps |
| Mobile native app | Large | React Native or Swift |
| Integration marketplace | Large | Plugin system |
| LLM-powered natural language querying | Medium | "Show me my progress this week" |
| Auto-scheduling from user patterns | Medium | Learn when user works best |
| Obsidian/Notion import | Medium | Knowledge migration |
| API for third-party access | Medium | Let users build on top |
| Time-series analytics | Medium | Trend analysis over months |
| Dark/Light schedule auto-toggle | Small | Sunset = dark mode |
| Weekly email digest | Small | Automated summary |

---

## PART 27 — EXECUTIVE SUMMARY

### What is SanOS Today?

SanOS is a **single-user, event-driven, AI-coached personal operating system for software engineers** built on Next.js 16, React 19, and Supabase. It covers DSA practice, IIT academic management, project delivery, business operations, finance tracking, knowledge management, daily execution, and career readiness in one deeply integrated system.

### What Problems Does It Solve?

1. **Tool fragmentation** — replaces 10+ separate tools (Todoist, Notion, Linear, LeetCode tracker, spreadsheet, CRM, invoicing, habit tracker) with one
2. **Knowledge decay** — three bespoke memory models track what you're forgetting and when to review
3. **Academic-coded bridge** — IIT students must do coursework AND DSA for placements; SanOS connects them
4. **Freelance chaos** — clients, projects, invoices, pipeline, revenue — all tracked in one workspace with coach follow-ups
5. **Decision fatigue** — deterministic AI coach tells you what to work on, when, and why, ranked by urgency × impact × momentum

### What Is Implemented?

A complete, production-ready system with:
- 29 database migrations across 60+ tables
- 59 business logic services
- 27 data access repositories
- 7 platform engines (EventBus, Workflow, Intelligence, Context, Rules, Automation, Prediction)
- 131 React components
- 16+ feature routes
- 9 AI coach services with 3 memory models
- 5 registered workflows
- 6 scheduled automations
- Full RLS-backed security model

### What Works Exceptionally Well?

| Feature | Why |
|---|---|
| **Memory Intelligence (3 models)** | Genuinely novel. Laplace-smoothed recall with decay, rollup to topic health, forgetting risk classification. No other personal tool has this. |
| **Event-Driven Architecture** | Every action emits events that update everything downstream. A single problem solve updates revision, roadmaps, analytics, memory, timeline, coach, and notifications. |
| **Deterministic AI Coach** | No hallucination risk. Single scoring rubric. 9 domain coaches. Outcome-based personalization. |
| **Interconnection** | The level of feature integration is exceptional. Problems ↔ Concepts ↔ Knowledge ↔ Roadmaps ↔ Revision ↔ Memory ↔ Coach ↔ all connected. |
| **Design System** | Tailwind CSS v4 with custom utilities, motion scale, Apple-inspired glass/surface, consistent dark/light parity. |
| **CGPA What-If Simulator** | 4 scenario types that re-run exact credit-weighted arithmetic. Genuinely useful for students. |

### What Is Partially Complete?

| Feature | Missing |
|---|---|
| **Knowledge Vault** | File upload not implemented. No full-text search. |
| **Finance** | No projections, no tax, no multi-currency. Basic income/expense only. |
| **Planner** | No drag-drop. No calendar. No pattern learning. |
| **Universal Intake** | Domain detection is regex-based. No voice. OCR is basic. |
| **Search** | No semantic search in UI. No full-text search. No filters. |
| **Analytics** | Basic page. Charts are minimal. No time-series. |
| **Placement Readiness** | No dedicated dashboard. Basic check only. |
| **Resources** | CRUD works. Pipeline/effectiveness stubs. |
| **Memory Graph** | Schema + edges exist. No UI. Not used in recommendations. |
| **Command Palette** | Navigation works. Creation/actions limited. |
| **Context System** | Backend complete. Frontend UI partially wired. |

### What Is Missing?

| Domain | Key Gap |
|---|---|
| **Security** | No rate limiting. PermissionGuard is no-op. |
| **Integrations** | GitHub, Google Calendar, Email, Payment gateway — all missing |
| **UX** | No onboarding. No mobile PWA. No keyboard navigation beyond ⌘K. Accessibility incomplete. |
| **Business** | Tax, multi-currency, payment collection, invoice PDF, email sending |
| **Planner** | Drag-drop calendar view |
| **Performance** | Dashboard streaming. Bundle optimization. |
| **Monetization** | Single-user, self-hosted, free. No business model. |

### What Should Be Built Next?

1. **P0: Security hardening** (rate limiting, PermissionGuard)
2. **P1: Dashboard streaming with Suspense** (perceived performance)
3. **P1: File upload for knowledge vault** (unblock knowledge feature)
4. **P1: Google Calendar sync** (highest-impact integration)
5. **P1: Email sending for invoices** (blocking business use)
6. **P1: Semantic search in `/api/search`** (search improvement)
7. **P1: Empty states / onboarding** (reduce churn)
8. **P2: Concept spaced revision** (apply memory models to concepts)
9. **P2: GitHub webhook integration** (auto-update timeline)

### What Should Never Be Changed?

1. **The deterministic AI philosophy.** No LLM dependency is a strength, not a weakness. Never make the coach hallucinate.
2. **The event-driven architecture.** It's what makes every feature interconnected. Breaking this destroys the core value proposition.
3. **The memory intelligence models.** These are genuinely innovative. Don't replace them with black-box ML.
4. **The repository pattern.** Single DB access layer prevents SQL injection and keeps queries testable.
5. **The `scoreAction` rubric.** 0.5×urgency + 0.35×impact + 0.15×momentum is the foundation of every AI decision. Change with extreme care.

### What Is the Biggest Competitive Advantage?

**Memory intelligence + event-driven interconnection.** No other personal tool — not Notion, not Linear, not Todoist, not any "AI productivity" app — has three mathematical models that track what you know and what you're forgetting, combined with a fully event-driven architecture that updates every feature from a single action. This is genuinely novel in the personal productivity space.

### What Is the Biggest Weakness?

**No integrations and no mobile presence.** A personal OS that doesn't sync with your calendar, doesn't send email, doesn't import from LeetCode, and doesn't work well on mobile cannot be your "operating system." You'll still need Google Calendar, Gmail, and LeetCode separately. The vision of "everything in one place" is compromised by the absence of these integrations.

Secondarily: **no onboarding and no empty states.** A new user sees a blank dashboard with 16 panels of empty data and no guidance. Churn risk is extremely high.

### What Would Make This a World-Class AI Operating System?

1. **Complete the integration layer:** Google Calendar ↔ deadlines, GitHub ↔ projects, Email ↔ invoices, LeetCode ↔ problems. One sync per integration. This has the highest ROI of any investment.

2. **Ship the mobile PWA.** Mobile execution is table stakes for a personal OS. Brain dump, revision, and quick capture must work offline on a phone.

3. **Add streaming to the dashboard.** The 11-query waterfall makes the first load slow. Suspense boundaries + streaming would make it feel instant.

4. **Build the memory graph visualization.** The graph exists in the database but is invisible to users. A graph view of their knowledge would be the single most impressive feature.

5. **Ship concept spaced revision.** The memory models are built for problems. Applying them to concepts would close a major loop.

6. **Add smart scheduling.** Replace hardcoded energy levels with learned patterns. "You complete most deep work at 10 AM" → schedule accordingly.

7. **Build an open API.** Let the community build integrations. The architecture is ready for this.

The core is exceptional. The gaps are all in the **integration, mobile, and onboarding** layers — not in the architecture or intelligence. SanOS is 60% of the way to being a world-class product. The remaining 40% is execution on integrations, UX polish, and mobile.
