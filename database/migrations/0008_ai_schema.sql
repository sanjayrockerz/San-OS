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
