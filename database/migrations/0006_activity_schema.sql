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
