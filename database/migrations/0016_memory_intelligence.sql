-- =============================================================================
-- Migration 0016 — Memory Intelligence Engine
-- =============================================================================
-- SanOS Recovery Phase 2. Adds the persistence the Memory Intelligence Engine
-- needs to stop recomputing recall/forgetting signals on every page load:
--
--   * recall_grades        — a structured recall test taken at revision time
--                             (pattern / algorithm / complexity / mistakes +
--                             confidence), richer than the existing binary
--                             revision_queue success/failure. Optional input to
--                             the scoring model — recall strength still works
--                             from revision_queue + problem_attempts alone when
--                             no grade exists yet.
--   * recall_strength      — cached Model 1 output: one row per (user,
--                             problem), the 0-100 recall score, its forgetting
--                             risk bucket (Model 3) and trend, recomputed by
--                             MemoryIntelligenceService.evolve().
--   * topic_memory_health  — cached Model 2 output: recall strength rolled up
--                             per (user, topic|pattern).
--
-- Nothing here replaces revision_queue/problem_attempts as the source of
-- truth — these are derived caches, rebuilt idempotently from them (same
-- posture as taxonomy_usage in 0012).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Enum types
-- -----------------------------------------------------------------------------
do $$
begin
  -- Model 2 — topic/pattern memory health bucket.
  if not exists (select 1 from pg_type where typname = 'memory_health_status') then
    create type public.memory_health_status as enum (
      'strong',
      'stable',
      'at_risk',
      'decaying',
      'neglected'
    );
  end if;

  -- Model 3 — forgetting prediction bucket.
  if not exists (select 1 from pg_type where typname = 'forgetting_risk') then
    create type public.forgetting_risk as enum (
      'recently_reinforced',
      'stable',
      'at_risk',
      'likely_forgotten'
    );
  end if;

  -- Shared trend direction, used by both cache tables.
  if not exists (select 1 from pg_type where typname = 'memory_trend') then
    create type public.memory_trend as enum (
      'improving',
      'stable',
      'declining'
    );
  end if;
end
$$;

-- -----------------------------------------------------------------------------
-- recall_grades — a graded recall test taken during a revision session
-- -----------------------------------------------------------------------------
create table if not exists public.recall_grades (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users (id) on delete cascade,
  problem_id          uuid not null references public.problems (id) on delete cascade,
  revision_id         uuid references public.revision_queue (id) on delete set null,
  recalled_pattern    boolean not null default false,
  recalled_algorithm  boolean not null default false,
  recalled_complexity boolean not null default false,
  recalled_mistakes   boolean not null default false,
  confidence          smallint check (confidence between 1 and 5),
  success             boolean not null,
  grade_score         smallint not null check (grade_score between 0 and 100),
  created_at          timestamptz not null default now()
);

create index if not exists recall_grades_user_id_idx on public.recall_grades (user_id);
create index if not exists recall_grades_problem_idx
  on public.recall_grades (user_id, problem_id, created_at desc);

-- -----------------------------------------------------------------------------
-- recall_strength — cached Model 1 + Model 3 output, one row per (user, problem)
-- -----------------------------------------------------------------------------
create table if not exists public.recall_strength (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  problem_id   uuid not null references public.problems (id) on delete cascade,
  score        smallint not null check (score between 0 and 100),
  risk         public.forgetting_risk not null default 'stable',
  trend        public.memory_trend not null default 'stable',
  computed_at  timestamptz not null default now(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (user_id, problem_id)
);

create index if not exists recall_strength_user_id_idx on public.recall_strength (user_id);
create index if not exists recall_strength_risk_idx on public.recall_strength (user_id, risk);

-- -----------------------------------------------------------------------------
-- topic_memory_health — cached Model 2 output, one row per (user, topic|pattern)
-- -----------------------------------------------------------------------------
create table if not exists public.topic_memory_health (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  entity_type       text not null check (entity_type in ('topic', 'pattern')),
  entity_id         uuid not null,
  health_score      smallint not null check (health_score between 0 and 100),
  status            public.memory_health_status not null default 'neglected',
  trend             public.memory_trend not null default 'stable',
  problems_tracked  integer not null default 0,
  problems_at_risk  integer not null default 0,
  computed_at       timestamptz not null default now(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (user_id, entity_type, entity_id)
);

create index if not exists topic_memory_health_user_id_idx on public.topic_memory_health (user_id);
create index if not exists topic_memory_health_status_idx
  on public.topic_memory_health (user_id, status);

-- -----------------------------------------------------------------------------
-- updated_at triggers
-- -----------------------------------------------------------------------------
do $$
declare
  tbl text;
  tables text[] := array['recall_strength', 'topic_memory_health'];
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
-- RLS — owner-only on all three tables
-- -----------------------------------------------------------------------------
alter table public.recall_grades enable row level security;
alter table public.recall_strength enable row level security;
alter table public.topic_memory_health enable row level security;

drop policy if exists "recall_grades_owner" on public.recall_grades;
create policy "recall_grades_owner" on public.recall_grades
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "recall_strength_owner" on public.recall_strength;
create policy "recall_strength_owner" on public.recall_strength
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "topic_memory_health_owner" on public.topic_memory_health;
create policy "topic_memory_health_owner" on public.topic_memory_health
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
