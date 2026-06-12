-- =============================================================================
-- Migration 0002 — Core DSA schema
-- =============================================================================
-- Tables:
--   users_profile, topics, patterns, problems, problem_attempts,
--   problem_reflections, problem_code_versions, revision_queue
--
-- Conventions (per project rules):
--   * uuid primary keys (gen_random_uuid())
--   * user_id where applicable (auth.users FK)
--   * created_at / updated_at on every table (updated_at via trigger)
--
-- Taxonomy tables (topics, patterns) are global reference data with no
-- user_id; `problems` is a shared catalog (user_id NULL) that users may also
-- extend with their own rows (user_id = auth.uid()). RLS is defined in 0003.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- users_profile
-- -----------------------------------------------------------------------------
create table if not exists public.users_profile (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null unique references auth.users (id) on delete cascade,
  username      text unique,
  display_name  text,
  avatar_url    text,
  bio           text,
  timezone      text not null default 'UTC',
  preferences   jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- topics (global reference taxonomy)
-- -----------------------------------------------------------------------------
create table if not exists public.topics (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  slug             text not null unique,
  description      text,
  icon             text,
  color            text,
  parent_topic_id  uuid references public.topics (id) on delete set null,
  order_index      integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists topics_parent_topic_id_idx
  on public.topics (parent_topic_id);

-- -----------------------------------------------------------------------------
-- patterns (global reference taxonomy)
-- -----------------------------------------------------------------------------
create table if not exists public.patterns (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  slug               text not null unique,
  recognition_clues  text[] not null default '{}',
  generic_algorithm  text,
  common_mistakes    text[] not null default '{}',
  variants           text[] not null default '{}',
  description        text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- problems (shared catalog + optional user-authored)
-- -----------------------------------------------------------------------------
create table if not exists public.problems (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid references auth.users (id) on delete cascade,
  platform             public.problem_platform not null default 'other',
  external_problem_id  text,
  title                text not null,
  url                  text,
  difficulty           public.difficulty_level,
  topic_id             uuid references public.topics (id) on delete set null,
  pattern_id           uuid references public.patterns (id) on delete set null,
  estimated_minutes    integer,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists problems_user_id_idx on public.problems (user_id);
create index if not exists problems_topic_id_idx on public.problems (topic_id);
create index if not exists problems_pattern_id_idx on public.problems (pattern_id);

-- One global-catalog row per (platform, external id). User-authored rows are
-- exempt so different users can track the same external problem privately.
create unique index if not exists problems_catalog_external_uniq
  on public.problems (platform, external_problem_id)
  where user_id is null and external_problem_id is not null;

-- -----------------------------------------------------------------------------
-- problem_attempts
-- -----------------------------------------------------------------------------
create table if not exists public.problem_attempts (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users (id) on delete cascade,
  problem_id           uuid not null references public.problems (id) on delete cascade,
  language             text,
  time_taken_seconds   integer,
  solve_status         public.solve_status,
  confidence           smallint check (confidence between 1 and 5),
  understood_statement boolean not null default false,
  identified_pattern   boolean not null default false,
  derived_algorithm    boolean not null default false,
  wrote_pseudocode     boolean not null default false,
  coded_independently  boolean not null default false,
  runtime_error        boolean not null default false,
  syntax_error         boolean not null default false,
  logic_error          boolean not null default false,
  attempted_at         timestamptz not null default now(),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists problem_attempts_user_id_idx
  on public.problem_attempts (user_id);
create index if not exists problem_attempts_problem_id_idx
  on public.problem_attempts (problem_id);

-- -----------------------------------------------------------------------------
-- problem_reflections
-- -----------------------------------------------------------------------------
create table if not exists public.problem_reflections (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users (id) on delete cascade,
  problem_id          uuid not null references public.problems (id) on delete cascade,
  attempt_id          uuid references public.problem_attempts (id) on delete set null,
  my_explanation      text,
  algorithm_in_words  text,
  bug_that_stopped_me text,
  final_takeaway      text,
  ai_feedback         text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists problem_reflections_user_id_idx
  on public.problem_reflections (user_id);
create index if not exists problem_reflections_problem_id_idx
  on public.problem_reflections (problem_id);

-- -----------------------------------------------------------------------------
-- problem_code_versions
-- -----------------------------------------------------------------------------
create table if not exists public.problem_code_versions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  problem_id  uuid not null references public.problems (id) on delete cascade,
  attempt_id  uuid references public.problem_attempts (id) on delete set null,
  language    text not null,
  code        text not null,
  is_final    boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists problem_code_versions_user_id_idx
  on public.problem_code_versions (user_id);
create index if not exists problem_code_versions_problem_id_idx
  on public.problem_code_versions (problem_id);

-- -----------------------------------------------------------------------------
-- revision_queue
-- -----------------------------------------------------------------------------
create table if not exists public.revision_queue (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users (id) on delete cascade,
  problem_id           uuid not null references public.problems (id) on delete cascade,
  current_state        public.revision_state not null default 'new',
  last_revision        timestamptz,
  next_revision        timestamptz,
  success_count        integer not null default 0,
  failure_count        integer not null default 0,
  editorial_dependency boolean not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (user_id, problem_id)
);

create index if not exists revision_queue_user_id_idx
  on public.revision_queue (user_id);
create index if not exists revision_queue_next_revision_idx
  on public.revision_queue (next_revision);

-- -----------------------------------------------------------------------------
-- updated_at triggers
-- -----------------------------------------------------------------------------
do $$
declare
  tbl text;
  tables text[] := array[
    'users_profile', 'topics', 'patterns', 'problems', 'problem_attempts',
    'problem_reflections', 'problem_code_versions', 'revision_queue'
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
