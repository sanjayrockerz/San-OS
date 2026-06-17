-- =============================================================================
-- SanOS — Phase 5 canonical production bundle (migrations 0004–0013)
-- =============================================================================
-- Paste-and-run in Supabase Dashboard -> SQL Editor, in one shot.
--
-- Prerequisite: migrations 0001-0003 already applied (8 core tables + enums +
-- set_updated_at()). On project kcdenqufiajidivysuez they are.
--
-- This bundle is IDEMPOTENT: every statement uses `if not exists` / `create or
-- replace` / `drop policy if exists`, and enum/type creation is guarded by
-- `do $$ ... pg_type ... $$`. Re-running it on an already-migrated database is
-- a no-op and will not error.
--
-- Sections (each is the verbatim, idempotent migration file):
--   0004  knowledge & concept vault        (concept_notes/resources/problems)
--   0005  roadmaps                          (roadmaps/roadmap_items/progress)
--   0006  activity                          (activity_logs/study_sessions/daily_logs)
--   0007  iit workspace                     (courses/assignments/lectures/documents)
--   0008  ai                                (ai_daily_briefs/ai_insights)
--   0009  RLS for all phase-4 tables
--   0010  storage buckets + per-user-folder RLS
--   0011  events                            (append-only domain event stream)
--   0012  dynamic taxonomy                  (per-user topics/patterns + usage)
--   0013  knowledge vault                   (knowledge_items/knowledge_links)
--
-- After running, verify with:  node scripts/verify-db.mjs
-- =============================================================================


-- #############################################################################
-- >>> 0004_knowledge_schema.sql
-- #############################################################################

-- =============================================================================
-- Migration 0004 — Knowledge & Concept Vault schema
-- =============================================================================
-- Tables:
--   concept_notes, concept_resources, concept_problems
--
-- Concept cards are user-owned. Each concept may carry many resources
-- (screenshots, PDFs, YouTube links) and may be linked to global patterns,
-- topics, and the user's problems. Conventions follow 0001/0002:
--   * uuid primary keys (gen_random_uuid())
--   * user_id FK to auth.users on every owned table
--   * created_at / updated_at on every table (updated_at via trigger)
-- RLS is defined in 0009.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Enum types
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'concept_status') then
    create type public.concept_status as enum (
      'learning',
      'understood',
      'weak',
      'forgotten',
      'mastered'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'resource_type') then
    create type public.resource_type as enum (
      'screenshot',
      'image',
      'pdf',
      'youtube',
      'article',
      'link'
    );
  end if;
end
$$;

-- -----------------------------------------------------------------------------
-- concept_notes
-- -----------------------------------------------------------------------------
create table if not exists public.concept_notes (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users (id) on delete cascade,
  title                text not null,
  category             text,
  status               public.concept_status not null default 'learning',
  confidence           smallint check (confidence between 1 and 5),
  personal_explanation text,
  recognition_clues    text[] not null default '{}',
  when_to_use          text,
  common_mistakes      text[] not null default '{}',
  topic_id             uuid references public.topics (id) on delete set null,
  pattern_id           uuid references public.patterns (id) on delete set null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists concept_notes_user_id_idx
  on public.concept_notes (user_id);
create index if not exists concept_notes_topic_id_idx
  on public.concept_notes (topic_id);
create index if not exists concept_notes_pattern_id_idx
  on public.concept_notes (pattern_id);

-- -----------------------------------------------------------------------------
-- concept_resources (images, PDFs, YouTube links attached to a concept)
-- -----------------------------------------------------------------------------
create table if not exists public.concept_resources (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  concept_id    uuid not null references public.concept_notes (id) on delete cascade,
  type          public.resource_type not null,
  title         text,
  url           text,
  storage_path  text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists concept_resources_user_id_idx
  on public.concept_resources (user_id);
create index if not exists concept_resources_concept_id_idx
  on public.concept_resources (concept_id);

-- -----------------------------------------------------------------------------
-- concept_problems (many-to-many: concepts <-> problems, per user)
-- -----------------------------------------------------------------------------
create table if not exists public.concept_problems (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  concept_id  uuid not null references public.concept_notes (id) on delete cascade,
  problem_id  uuid not null references public.problems (id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (concept_id, problem_id)
);

create index if not exists concept_problems_user_id_idx
  on public.concept_problems (user_id);
create index if not exists concept_problems_concept_id_idx
  on public.concept_problems (concept_id);
create index if not exists concept_problems_problem_id_idx
  on public.concept_problems (problem_id);

-- -----------------------------------------------------------------------------
-- updated_at triggers
-- -----------------------------------------------------------------------------
do $$
declare
  tbl text;
  tables text[] := array[
    'concept_notes', 'concept_resources', 'concept_problems'
  ];
begin
  foreach tbl in array tables loop
    execute format('drop trigger if exists set_updated_at on public.%I;', tbl);
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function public.set_updated_at();',
      tbl
    );
  end loop;
end
$$;

-- #############################################################################
-- >>> 0005_roadmap_schema.sql
-- #############################################################################

-- =============================================================================
-- Migration 0005 — Roadmap Engine schema
-- =============================================================================
-- Tables:
--   roadmaps, roadmap_items, roadmap_progress
--
-- A roadmap is either a global template (user_id NULL — e.g. Striver A2Z,
-- Blind 75, NeetCode 150, IIT) readable by all authenticated users, or a
-- user-authored custom roadmap. roadmap_items form a tree (parent_item_id)
-- and may reference a problem so that solving a problem once can update every
-- linked roadmap. roadmap_progress records per-user completion of an item.
-- RLS is defined in 0009.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Enum types
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'roadmap_kind') then
    create type public.roadmap_kind as enum (
      'striver_a2z',
      'blind_75',
      'neetcode_150',
      'iit',
      'custom'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'roadmap_item_status') then
    create type public.roadmap_item_status as enum (
      'not_started',
      'in_progress',
      'completed',
      'skipped'
    );
  end if;
end
$$;

-- -----------------------------------------------------------------------------
-- roadmaps (global template when user_id is NULL, else user-authored)
-- -----------------------------------------------------------------------------
create table if not exists public.roadmaps (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users (id) on delete cascade,
  kind         public.roadmap_kind not null default 'custom',
  title        text not null,
  slug         text,
  description  text,
  source_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists roadmaps_user_id_idx on public.roadmaps (user_id);

-- One global-template row per slug. User-authored rows are exempt.
create unique index if not exists roadmaps_template_slug_uniq
  on public.roadmaps (slug)
  where user_id is null and slug is not null;

-- -----------------------------------------------------------------------------
-- roadmap_items (tree of sections/problems within a roadmap)
-- -----------------------------------------------------------------------------
create table if not exists public.roadmap_items (
  id              uuid primary key default gen_random_uuid(),
  roadmap_id      uuid not null references public.roadmaps (id) on delete cascade,
  parent_item_id  uuid references public.roadmap_items (id) on delete cascade,
  title           text not null,
  problem_id      uuid references public.problems (id) on delete set null,
  topic_id        uuid references public.topics (id) on delete set null,
  is_section      boolean not null default false,
  order_index     integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists roadmap_items_roadmap_id_idx
  on public.roadmap_items (roadmap_id);
create index if not exists roadmap_items_parent_item_id_idx
  on public.roadmap_items (parent_item_id);
create index if not exists roadmap_items_problem_id_idx
  on public.roadmap_items (problem_id);

-- -----------------------------------------------------------------------------
-- roadmap_progress (per-user completion of a roadmap item)
-- -----------------------------------------------------------------------------
create table if not exists public.roadmap_progress (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  roadmap_id    uuid not null references public.roadmaps (id) on delete cascade,
  item_id       uuid not null references public.roadmap_items (id) on delete cascade,
  status        public.roadmap_item_status not null default 'not_started',
  completed_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (user_id, item_id)
);

create index if not exists roadmap_progress_user_id_idx
  on public.roadmap_progress (user_id);
create index if not exists roadmap_progress_roadmap_id_idx
  on public.roadmap_progress (roadmap_id);

-- -----------------------------------------------------------------------------
-- updated_at triggers
-- -----------------------------------------------------------------------------
do $$
declare
  tbl text;
  tables text[] := array[
    'roadmaps', 'roadmap_items', 'roadmap_progress'
  ];
begin
  foreach tbl in array tables loop
    execute format('drop trigger if exists set_updated_at on public.%I;', tbl);
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function public.set_updated_at();',
      tbl
    );
  end loop;
end
$$;

-- #############################################################################
-- >>> 0006_activity_schema.sql
-- #############################################################################

-- =============================================================================
-- Migration 0006 — Activity, Study Sessions & Daily Logs schema
-- =============================================================================
-- Tables:
--   activity_logs, study_sessions, daily_logs
--
-- activity_logs is the append-only event stream powering the timeline and the
-- GitHub-style contribution heatmap. study_sessions track focused work blocks.
-- daily_logs roll up per-day counts (one row per user per day). All user-owned.
-- RLS is defined in 0009.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Enum types
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'activity_type') then
    create type public.activity_type as enum (
      'problem_solved',
      'problem_attempted',
      'concept_added',
      'concept_revised',
      'pattern_revised',
      'revision_completed',
      'lecture_watched',
      'assignment_completed',
      'document_uploaded',
      'study_session',
      'note_added'
    );
  end if;
end
$$;

-- -----------------------------------------------------------------------------
-- activity_logs (append-only event stream)
-- -----------------------------------------------------------------------------
create table if not exists public.activity_logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  type         public.activity_type not null,
  title        text,
  description  text,
  entity_type  text,
  entity_id    uuid,
  metadata     jsonb not null default '{}'::jsonb,
  occurred_at  timestamptz not null default now(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists activity_logs_user_id_idx
  on public.activity_logs (user_id);
create index if not exists activity_logs_occurred_at_idx
  on public.activity_logs (occurred_at);
create index if not exists activity_logs_type_idx
  on public.activity_logs (type);

-- -----------------------------------------------------------------------------
-- study_sessions (focused work blocks)
-- -----------------------------------------------------------------------------
create table if not exists public.study_sessions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  started_at        timestamptz not null default now(),
  ended_at          timestamptz,
  duration_seconds  integer,
  focus             text,
  topic_id          uuid references public.topics (id) on delete set null,
  problems_solved   integer not null default 0,
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists study_sessions_user_id_idx
  on public.study_sessions (user_id);
create index if not exists study_sessions_started_at_idx
  on public.study_sessions (started_at);

-- -----------------------------------------------------------------------------
-- daily_logs (one roll-up row per user per day)
-- -----------------------------------------------------------------------------
create table if not exists public.daily_logs (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  log_date         date not null,
  problems_solved  integer not null default 0,
  minutes_studied  integer not null default 0,
  revisions_done   integer not null default 0,
  mood             smallint check (mood between 1 and 5),
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (user_id, log_date)
);

create index if not exists daily_logs_user_id_idx
  on public.daily_logs (user_id);
create index if not exists daily_logs_log_date_idx
  on public.daily_logs (log_date);

-- -----------------------------------------------------------------------------
-- updated_at triggers
-- -----------------------------------------------------------------------------
do $$
declare
  tbl text;
  tables text[] := array[
    'activity_logs', 'study_sessions', 'daily_logs'
  ];
begin
  foreach tbl in array tables loop
    execute format('drop trigger if exists set_updated_at on public.%I;', tbl);
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function public.set_updated_at();',
      tbl
    );
  end loop;
end
$$;

-- #############################################################################
-- >>> 0007_iit_schema.sql
-- #############################################################################

-- =============================================================================
-- Migration 0007 — IIT Academic Intelligence schema
-- =============================================================================
-- Tables:
--   iit_courses, iit_assignments, iit_lectures, academic_documents
--
-- Course tracker with credits/marks, assignment tracker, lecture progress, and
-- an academic document vault (ID card, hall tickets, certificates, notes).
-- All user-owned. RLS is defined in 0009. Document files live in the
-- `iit-documents` storage bucket (created in 0010).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Enum types
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'course_status') then
    create type public.course_status as enum (
      'planned',
      'in_progress',
      'completed',
      'dropped'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'assignment_status') then
    create type public.assignment_status as enum (
      'pending',
      'in_progress',
      'submitted',
      'graded',
      'late',
      'missed'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'lecture_status') then
    create type public.lecture_status as enum (
      'not_started',
      'in_progress',
      'completed'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'document_type') then
    create type public.document_type as enum (
      'id_card',
      'hall_ticket',
      'certificate',
      'event_registration',
      'lecture_notes',
      'transcript',
      'other'
    );
  end if;
end
$$;

-- -----------------------------------------------------------------------------
-- iit_courses
-- -----------------------------------------------------------------------------
create table if not exists public.iit_courses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  code        text,
  name        text not null,
  credits     numeric(4, 1),
  semester    text,
  status      public.course_status not null default 'in_progress',
  instructor  text,
  grade       text,
  marks       numeric(6, 2),
  max_marks   numeric(6, 2),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists iit_courses_user_id_idx
  on public.iit_courses (user_id);

-- -----------------------------------------------------------------------------
-- iit_assignments
-- -----------------------------------------------------------------------------
create table if not exists public.iit_assignments (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  course_id     uuid references public.iit_courses (id) on delete cascade,
  title         text not null,
  description   text,
  due_date      timestamptz,
  status        public.assignment_status not null default 'pending',
  score         numeric(6, 2),
  max_score     numeric(6, 2),
  submitted_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists iit_assignments_user_id_idx
  on public.iit_assignments (user_id);
create index if not exists iit_assignments_course_id_idx
  on public.iit_assignments (course_id);
create index if not exists iit_assignments_due_date_idx
  on public.iit_assignments (due_date);

-- -----------------------------------------------------------------------------
-- iit_lectures
-- -----------------------------------------------------------------------------
create table if not exists public.iit_lectures (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  course_id         uuid references public.iit_courses (id) on delete cascade,
  title             text not null,
  lecture_number    integer,
  status            public.lecture_status not null default 'not_started',
  duration_minutes  integer,
  video_url         text,
  notes             text,
  watched_at        timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists iit_lectures_user_id_idx
  on public.iit_lectures (user_id);
create index if not exists iit_lectures_course_id_idx
  on public.iit_lectures (course_id);

-- -----------------------------------------------------------------------------
-- academic_documents (vault: ID card, hall tickets, certificates, notes)
-- -----------------------------------------------------------------------------
create table if not exists public.academic_documents (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  type             public.document_type not null default 'other',
  title            text not null,
  description      text,
  storage_bucket   text,
  storage_path     text,
  file_url         text,
  file_size_bytes  bigint,
  mime_type        text,
  course_id        uuid references public.iit_courses (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists academic_documents_user_id_idx
  on public.academic_documents (user_id);
create index if not exists academic_documents_type_idx
  on public.academic_documents (type);
create index if not exists academic_documents_course_id_idx
  on public.academic_documents (course_id);

-- -----------------------------------------------------------------------------
-- updated_at triggers
-- -----------------------------------------------------------------------------
do $$
declare
  tbl text;
  tables text[] := array[
    'iit_courses', 'iit_assignments', 'iit_lectures', 'academic_documents'
  ];
begin
  foreach tbl in array tables loop
    execute format('drop trigger if exists set_updated_at on public.%I;', tbl);
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function public.set_updated_at();',
      tbl
    );
  end loop;
end
$$;

-- #############################################################################
-- >>> 0008_ai_schema.sql
-- #############################################################################

-- =============================================================================
-- Migration 0008 — AI Mentor Engine schema
-- =============================================================================
-- Tables:
--   ai_daily_briefs, ai_insights
--
-- The AI engine is analytical, not a chatbot: it reads the user's learning
-- history and writes a Daily Battle Plan (ai_daily_briefs, one per day) and
-- structured findings about weaknesses / forgotten topics / recommendations
-- (ai_insights). Generation happens server-side; these tables only persist the
-- results so the UI can read real data. All user-owned. RLS is defined in 0009.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Enum types
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'ai_insight_type') then
    create type public.ai_insight_type as enum (
      'weakness',
      'forgotten_topic',
      'strength',
      'recommendation',
      'milestone',
      'warning'
    );
  end if;
end
$$;

-- -----------------------------------------------------------------------------
-- ai_daily_briefs (one Daily Battle Plan per user per day)
-- -----------------------------------------------------------------------------
create table if not exists public.ai_daily_briefs (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references auth.users (id) on delete cascade,
  brief_date               date not null,
  summary                  text,
  battle_plan              jsonb not null default '[]'::jsonb,
  focus_areas              text[] not null default '{}',
  recommended_problem_ids  uuid[] not null default '{}',
  model                    text,
  generated_at             timestamptz not null default now(),
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  unique (user_id, brief_date)
);

create index if not exists ai_daily_briefs_user_id_idx
  on public.ai_daily_briefs (user_id);
create index if not exists ai_daily_briefs_brief_date_idx
  on public.ai_daily_briefs (brief_date);

-- -----------------------------------------------------------------------------
-- ai_insights (structured findings the mentor surfaces)
-- -----------------------------------------------------------------------------
create table if not exists public.ai_insights (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  type          public.ai_insight_type not null,
  title         text not null,
  detail        text,
  severity      smallint check (severity between 1 and 5),
  entity_type   text,
  entity_id     uuid,
  is_dismissed  boolean not null default false,
  generated_at  timestamptz not null default now(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists ai_insights_user_id_idx
  on public.ai_insights (user_id);
create index if not exists ai_insights_type_idx
  on public.ai_insights (type);
create index if not exists ai_insights_is_dismissed_idx
  on public.ai_insights (is_dismissed);

-- -----------------------------------------------------------------------------
-- updated_at triggers
-- -----------------------------------------------------------------------------
do $$
declare
  tbl text;
  tables text[] := array[
    'ai_daily_briefs', 'ai_insights'
  ];
begin
  foreach tbl in array tables loop
    execute format('drop trigger if exists set_updated_at on public.%I;', tbl);
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function public.set_updated_at();',
      tbl
    );
  end loop;
end
$$;

-- #############################################################################
-- >>> 0009_rls_phase2.sql
-- #############################################################################

-- =============================================================================
-- Migration 0009 — Row Level Security for Phase 2 tables
-- =============================================================================
-- RLS is enabled on EVERY new table (0004–0008).
--
-- Policy model:
--   * User-owned tables: full CRUD where auth.uid() = user_id.
--   * roadmaps: global templates (user_id IS NULL, read-only to users) plus
--     user-authored rows the owner can fully manage — mirrors `problems`.
--   * roadmap_items: readable when their parent roadmap is readable; writable
--     only by the owner of that roadmap.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Enable RLS everywhere
-- -----------------------------------------------------------------------------
alter table public.concept_notes       enable row level security;
alter table public.concept_resources   enable row level security;
alter table public.concept_problems    enable row level security;
alter table public.roadmaps            enable row level security;
alter table public.roadmap_items       enable row level security;
alter table public.roadmap_progress    enable row level security;
alter table public.activity_logs       enable row level security;
alter table public.study_sessions      enable row level security;
alter table public.daily_logs          enable row level security;
alter table public.iit_courses         enable row level security;
alter table public.iit_assignments     enable row level security;
alter table public.iit_lectures        enable row level security;
alter table public.academic_documents  enable row level security;
alter table public.ai_daily_briefs     enable row level security;
alter table public.ai_insights         enable row level security;

-- -----------------------------------------------------------------------------
-- roadmaps (shared template + user-authored) — mirrors public.problems
-- -----------------------------------------------------------------------------
drop policy if exists "roadmaps_select_template_or_own" on public.roadmaps;
create policy "roadmaps_select_template_or_own" on public.roadmaps
  for select to authenticated
  using (user_id is null or auth.uid() = user_id);

drop policy if exists "roadmaps_insert_own" on public.roadmaps;
create policy "roadmaps_insert_own" on public.roadmaps
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "roadmaps_update_own" on public.roadmaps;
create policy "roadmaps_update_own" on public.roadmaps
  for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "roadmaps_delete_own" on public.roadmaps;
create policy "roadmaps_delete_own" on public.roadmaps
  for delete to authenticated using (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- roadmap_items — visibility/writability inherited from the parent roadmap
-- -----------------------------------------------------------------------------
drop policy if exists "roadmap_items_select_visible" on public.roadmap_items;
create policy "roadmap_items_select_visible" on public.roadmap_items
  for select to authenticated
  using (
    exists (
      select 1 from public.roadmaps r
      where r.id = roadmap_id
        and (r.user_id is null or r.user_id = auth.uid())
    )
  );

drop policy if exists "roadmap_items_insert_own" on public.roadmap_items;
create policy "roadmap_items_insert_own" on public.roadmap_items
  for insert to authenticated
  with check (
    exists (
      select 1 from public.roadmaps r
      where r.id = roadmap_id and r.user_id = auth.uid()
    )
  );

drop policy if exists "roadmap_items_update_own" on public.roadmap_items;
create policy "roadmap_items_update_own" on public.roadmap_items
  for update to authenticated
  using (
    exists (
      select 1 from public.roadmaps r
      where r.id = roadmap_id and r.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.roadmaps r
      where r.id = roadmap_id and r.user_id = auth.uid()
    )
  );

drop policy if exists "roadmap_items_delete_own" on public.roadmap_items;
create policy "roadmap_items_delete_own" on public.roadmap_items
  for delete to authenticated
  using (
    exists (
      select 1 from public.roadmaps r
      where r.id = roadmap_id and r.user_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- Per-user owned tables — identical auth.uid() = user_id CRUD policies
-- -----------------------------------------------------------------------------
do $$
declare
  tbl text;
  tables text[] := array[
    'concept_notes',
    'concept_resources',
    'concept_problems',
    'roadmap_progress',
    'activity_logs',
    'study_sessions',
    'daily_logs',
    'iit_courses',
    'iit_assignments',
    'iit_lectures',
    'academic_documents',
    'ai_daily_briefs',
    'ai_insights'
  ];
begin
  foreach tbl in array tables loop
    execute format('drop policy if exists "%1$s_select_own" on public.%1$I;', tbl);
    execute format(
      'create policy "%1$s_select_own" on public.%1$I
         for select to authenticated using (auth.uid() = user_id);', tbl);

    execute format('drop policy if exists "%1$s_insert_own" on public.%1$I;', tbl);
    execute format(
      'create policy "%1$s_insert_own" on public.%1$I
         for insert to authenticated with check (auth.uid() = user_id);', tbl);

    execute format('drop policy if exists "%1$s_update_own" on public.%1$I;', tbl);
    execute format(
      'create policy "%1$s_update_own" on public.%1$I
         for update to authenticated
         using (auth.uid() = user_id) with check (auth.uid() = user_id);', tbl);

    execute format('drop policy if exists "%1$s_delete_own" on public.%1$I;', tbl);
    execute format(
      'create policy "%1$s_delete_own" on public.%1$I
         for delete to authenticated using (auth.uid() = user_id);', tbl);
  end loop;
end
$$;

-- #############################################################################
-- >>> 0010_storage_buckets.sql
-- #############################################################################

-- =============================================================================
-- Migration 0010 — Storage buckets & object RLS
-- =============================================================================
-- Creates the five buckets declared in lib/storage/buckets.ts and applies
-- per-user-folder Row Level Security on storage.objects.
--
-- Convention: every object is stored under a top-level folder equal to the
-- owner's auth.uid(), e.g. `avatars/<uid>/photo.png`. RLS keys off the first
-- path segment so a user can only write/read their own folder. Public buckets
-- additionally allow anonymous read (served over the CDN).
--
-- Buckets (matches BUCKET_DEFINITIONS):
--   avatars              public   2MB   images
--   concept-images       public   5MB   images
--   problem-screenshots  private  5MB   images
--   iit-documents        private  25MB  documents
--   attachments          private  25MB  any
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Buckets (idempotent upsert so re-runs stay safe)
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 2097152,
   array['image/png','image/jpeg','image/webp','image/gif']),
  ('concept-images', 'concept-images', true, 5242880,
   array['image/png','image/jpeg','image/webp','image/gif']),
  ('problem-screenshots', 'problem-screenshots', false, 5242880,
   array['image/png','image/jpeg','image/webp','image/gif']),
  ('iit-documents', 'iit-documents', false, 26214400,
   array['application/pdf','application/msword',
         'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
         'text/plain','text/markdown']),
  ('attachments', 'attachments', false, 26214400, null)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- -----------------------------------------------------------------------------
-- Public-read for the public buckets (avatars, concept-images)
-- -----------------------------------------------------------------------------
drop policy if exists "public_buckets_read" on storage.objects;
create policy "public_buckets_read" on storage.objects
  for select to public
  using (bucket_id in ('avatars', 'concept-images'));

-- -----------------------------------------------------------------------------
-- Owner-folder CRUD across every SanOS bucket.
-- The first path segment must equal the caller's uid.
-- -----------------------------------------------------------------------------
drop policy if exists "owner_folder_select" on storage.objects;
create policy "owner_folder_select" on storage.objects
  for select to authenticated
  using (
    bucket_id in ('avatars','concept-images','problem-screenshots','iit-documents','attachments')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "owner_folder_insert" on storage.objects;
create policy "owner_folder_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('avatars','concept-images','problem-screenshots','iit-documents','attachments')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "owner_folder_update" on storage.objects;
create policy "owner_folder_update" on storage.objects
  for update to authenticated
  using (
    bucket_id in ('avatars','concept-images','problem-screenshots','iit-documents','attachments')
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id in ('avatars','concept-images','problem-screenshots','iit-documents','attachments')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "owner_folder_delete" on storage.objects;
create policy "owner_folder_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('avatars','concept-images','problem-screenshots','iit-documents','attachments')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- #############################################################################
-- >>> 0011_events.sql
-- #############################################################################

-- =============================================================================
-- Migration 0011 — Domain event log (event-driven architecture foundation)
-- =============================================================================
-- An append-only, immutable stream of domain events. Every state-changing user
-- action emits one or more rows here via EventService. TimelineService and the
-- analytics/AI engines read from this stream rather than re-querying every table.
--
-- Immutability is enforced by RLS: authenticated users may INSERT and SELECT
-- their own events but have NO update/delete policy, so rows can never be
-- mutated through the anon/auth key. The service role may still administer them.
-- =============================================================================

create table if not exists public.events (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  event_type   text not null,
  entity_type  text,
  entity_id    uuid,
  payload      jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

create index if not exists events_user_id_idx on public.events (user_id);
create index if not exists events_created_at_idx on public.events (created_at);
create index if not exists events_event_type_idx on public.events (event_type);
create index if not exists events_entity_idx on public.events (entity_type, entity_id);

-- -----------------------------------------------------------------------------
-- RLS — insert + select own only (no update/delete = immutable)
-- -----------------------------------------------------------------------------
alter table public.events enable row level security;

drop policy if exists "events_select_own" on public.events;
create policy "events_select_own" on public.events
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "events_insert_own" on public.events;
create policy "events_insert_own" on public.events
  for insert to authenticated with check (auth.uid() = user_id);

-- Intentionally NO update/delete policies: events are immutable.

-- #############################################################################
-- >>> 0012_dynamic_taxonomy.sql
-- #############################################################################

-- =============================================================================
-- Migration 0012 — Dynamic, per-user evolving taxonomy
-- =============================================================================
-- Until now `topics` and `patterns` were global, seed-only reference data with
-- no owner and writes reserved for the service role. A static list calcifies —
-- a learner's vocabulary should grow with their practice.
--
-- This migration makes the taxonomy evolve in three ways, all PER USER:
--   1. Usage-driven re-ranking — `taxonomy_usage` scores each topic/pattern for
--      a user from real attempt activity (with recency decay), so what they
--      practise rises and what they ignore fades.
--   2. AI proposes -> you approve — candidates land as status='proposed' in an
--      approval queue (source='ai_proposed').
--   3. AI auto-add — high-confidence candidates go live silently
--      (status='active', source='ai_auto').
--
-- Ownership model (mirrors `problems` / `roadmaps`):
--   * user_id IS NULL  -> global seed, readable by everyone, never proposed.
--   * user_id = a user -> that user's own topic/pattern (any source/status).
-- Seed rows keep their global, service-role-managed nature.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Enum types — provenance and lifecycle of a taxonomy row
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'taxonomy_source') then
    create type public.taxonomy_source as enum (
      'seed',         -- shipped global baseline
      'user',         -- the user added it by hand
      'ai_proposed',  -- AI suggested it, awaiting approval
      'ai_auto'       -- AI added it automatically (high confidence)
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'taxonomy_status') then
    create type public.taxonomy_status as enum (
      'active',     -- live and shown in the taxonomy
      'proposed',   -- pending the user's approval
      'dismissed'   -- the user rejected it (kept for audit / de-dup)
    );
  end if;
end
$$;

-- -----------------------------------------------------------------------------
-- Evolve topics & patterns with ownership + provenance columns
-- -----------------------------------------------------------------------------
alter table public.topics
  add column if not exists user_id       uuid references auth.users (id) on delete cascade,
  add column if not exists source        public.taxonomy_source not null default 'seed',
  add column if not exists status        public.taxonomy_status not null default 'active',
  add column if not exists ai_confidence smallint check (ai_confidence between 1 and 5),
  add column if not exists ai_rationale  text;

alter table public.patterns
  add column if not exists user_id       uuid references auth.users (id) on delete cascade,
  add column if not exists source        public.taxonomy_source not null default 'seed',
  add column if not exists status        public.taxonomy_status not null default 'active',
  add column if not exists ai_confidence smallint check (ai_confidence between 1 and 5),
  add column if not exists ai_rationale  text;

-- Slugs were globally unique. They must now be unique PER OWNER (and globally
-- among the seed rows), so a user can define their own "two-pointers" without
-- colliding with the seed or with another user. Drop the old global constraint
-- (named <table>_slug_key by Postgres' `unique` shorthand) and replace it with
-- two partial unique indexes.
alter table public.topics   drop constraint if exists topics_slug_key;
alter table public.patterns drop constraint if exists patterns_slug_key;

create unique index if not exists topics_global_slug_key
  on public.topics (slug) where user_id is null;
create unique index if not exists topics_user_slug_key
  on public.topics (user_id, slug) where user_id is not null;

create unique index if not exists patterns_global_slug_key
  on public.patterns (slug) where user_id is null;
create unique index if not exists patterns_user_slug_key
  on public.patterns (user_id, slug) where user_id is not null;

create index if not exists topics_user_id_idx   on public.topics (user_id);
create index if not exists patterns_user_id_idx  on public.patterns (user_id);
create index if not exists topics_status_idx     on public.topics (status);
create index if not exists patterns_status_idx   on public.patterns (status);

-- Existing rows are the seed baseline. The column defaults already set
-- source='seed'/status='active'; this is belt-and-braces for rows that somehow
-- predate the defaults.
update public.topics   set source = 'seed', status = 'active' where source is null or status is null;
update public.patterns set source = 'seed', status = 'active' where source is null or status is null;

-- -----------------------------------------------------------------------------
-- taxonomy_usage — per-user practice signal + computed relevance score
-- -----------------------------------------------------------------------------
-- One row per (user, topic|pattern). Works for BOTH global seed rows and the
-- user's own rows, because re-ranking is always personal. `relevance_score` is
-- derived (usage_count blended with recency) and re-computed by TaxonomyService.
create table if not exists public.taxonomy_usage (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  entity_type     text not null check (entity_type in ('topic', 'pattern')),
  entity_id       uuid not null,
  usage_count     integer not null default 0,
  last_used_at    timestamptz,
  relevance_score double precision not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (user_id, entity_type, entity_id)
);

create index if not exists taxonomy_usage_user_id_idx
  on public.taxonomy_usage (user_id);
create index if not exists taxonomy_usage_rank_idx
  on public.taxonomy_usage (user_id, entity_type, relevance_score desc);

-- -----------------------------------------------------------------------------
-- RLS — topics & patterns become "global seed OR your own"; usage is user-owned
-- -----------------------------------------------------------------------------
alter table public.taxonomy_usage enable row level security;

-- Replace the old read-only-global SELECT policies (from 0003) with
-- ownership-aware CRUD, mirroring public.problems.
do $$
declare
  tbl text;
  tables text[] := array['topics', 'patterns'];
begin
  foreach tbl in array tables loop
    -- Drop the previous global read policy.
    execute format('drop policy if exists "%1$s_select_authenticated" on public.%1$I;', tbl);

    execute format('drop policy if exists "%1$s_select_global_or_own" on public.%1$I;', tbl);
    execute format(
      'create policy "%1$s_select_global_or_own" on public.%1$I
         for select to authenticated
         using (user_id is null or auth.uid() = user_id);', tbl);

    execute format('drop policy if exists "%1$s_insert_own" on public.%1$I;', tbl);
    execute format(
      'create policy "%1$s_insert_own" on public.%1$I
         for insert to authenticated with check (auth.uid() = user_id);', tbl);

    execute format('drop policy if exists "%1$s_update_own" on public.%1$I;', tbl);
    execute format(
      'create policy "%1$s_update_own" on public.%1$I
         for update to authenticated
         using (auth.uid() = user_id) with check (auth.uid() = user_id);', tbl);

    execute format('drop policy if exists "%1$s_delete_own" on public.%1$I;', tbl);
    execute format(
      'create policy "%1$s_delete_own" on public.%1$I
         for delete to authenticated using (auth.uid() = user_id);', tbl);
  end loop;
end
$$;

drop policy if exists "taxonomy_usage_select_own" on public.taxonomy_usage;
create policy "taxonomy_usage_select_own" on public.taxonomy_usage
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "taxonomy_usage_insert_own" on public.taxonomy_usage;
create policy "taxonomy_usage_insert_own" on public.taxonomy_usage
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "taxonomy_usage_update_own" on public.taxonomy_usage;
create policy "taxonomy_usage_update_own" on public.taxonomy_usage
  for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "taxonomy_usage_delete_own" on public.taxonomy_usage;
create policy "taxonomy_usage_delete_own" on public.taxonomy_usage
  for delete to authenticated using (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- updated_at trigger for the new table (topics/patterns already have theirs)
-- -----------------------------------------------------------------------------
drop trigger if exists set_updated_at on public.taxonomy_usage;
create trigger set_updated_at before update on public.taxonomy_usage
  for each row execute function public.set_updated_at();


-- #############################################################################
-- >>> 0013_knowledge_vault.sql
-- #############################################################################

-- =============================================================================
-- Migration 0013 — Knowledge Vault schema (Phase 5B.1)
-- =============================================================================
-- Tables:
--   knowledge_items  — a stored learning resource (note, link, algorithm, …)
--   knowledge_links  — many-to-many: a knowledge item <-> a domain entity
--
-- Phase 5B.1 ships text/link items only; the `storage_path` column is present so
-- a later phase can attach uploaded files (images/PDFs) without an ALTER. Types
-- are plain text with a CHECK constraint (mirroring `events.event_type`) so new
-- content kinds can be added without an enum migration.
--
-- RLS: classic per-user ownership (auth.uid() = user_id) on both tables.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- knowledge_items
-- -----------------------------------------------------------------------------
create table if not exists public.knowledge_items (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  type          text not null default 'note'
                  check (type in (
                    'note', 'youtube', 'image', 'pdf', 'algorithm',
                    'resource', 'cheatsheet', 'observation', 'lecture'
                  )),
  title         text not null,
  content       text,
  url           text,
  storage_path  text,
  tags          text[] not null default '{}',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists knowledge_items_user_id_idx
  on public.knowledge_items (user_id);
create index if not exists knowledge_items_type_idx
  on public.knowledge_items (type);
create index if not exists knowledge_items_created_at_idx
  on public.knowledge_items (created_at desc);

-- -----------------------------------------------------------------------------
-- knowledge_links (knowledge item <-> problem / topic / pattern / concept / iit)
-- -----------------------------------------------------------------------------
create table if not exists public.knowledge_links (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  knowledge_id  uuid not null references public.knowledge_items (id) on delete cascade,
  entity_type   text not null
                  check (entity_type in (
                    'problem', 'topic', 'pattern', 'concept', 'iit_course'
                  )),
  entity_id     uuid not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (knowledge_id, entity_type, entity_id)
);

create index if not exists knowledge_links_user_id_idx
  on public.knowledge_links (user_id);
create index if not exists knowledge_links_knowledge_id_idx
  on public.knowledge_links (knowledge_id);
create index if not exists knowledge_links_entity_idx
  on public.knowledge_links (entity_type, entity_id);

-- -----------------------------------------------------------------------------
-- updated_at triggers
-- -----------------------------------------------------------------------------
do $$
declare
  tbl text;
  tables text[] := array['knowledge_items', 'knowledge_links'];
begin
  foreach tbl in array tables loop
    execute format('drop trigger if exists set_updated_at on public.%I;', tbl);
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function public.set_updated_at();',
      tbl
    );
  end loop;
end
$$;

-- -----------------------------------------------------------------------------
-- Row Level Security — per-user ownership on both tables
-- -----------------------------------------------------------------------------
alter table public.knowledge_items enable row level security;
alter table public.knowledge_links enable row level security;

do $$
declare
  tbl text;
  tables text[] := array['knowledge_items', 'knowledge_links'];
begin
  foreach tbl in array tables loop
    execute format('drop policy if exists "%1$s_select_own" on public.%1$I;', tbl);
    execute format(
      'create policy "%1$s_select_own" on public.%1$I
         for select to authenticated using (auth.uid() = user_id);', tbl);

    execute format('drop policy if exists "%1$s_insert_own" on public.%1$I;', tbl);
    execute format(
      'create policy "%1$s_insert_own" on public.%1$I
         for insert to authenticated with check (auth.uid() = user_id);', tbl);

    execute format('drop policy if exists "%1$s_update_own" on public.%1$I;', tbl);
    execute format(
      'create policy "%1$s_update_own" on public.%1$I
         for update to authenticated
         using (auth.uid() = user_id) with check (auth.uid() = user_id);', tbl);

    execute format('drop policy if exists "%1$s_delete_own" on public.%1$I;', tbl);
    execute format(
      'create policy "%1$s_delete_own" on public.%1$I
         for delete to authenticated using (auth.uid() = user_id);', tbl);
  end loop;
end
$$;
