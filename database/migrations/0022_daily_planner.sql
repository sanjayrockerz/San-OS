-- =============================================================================
-- Migration 0022 — AI Daily Planner & Dynamic Replanning
-- =============================================================================
-- Adds a per-day plan header (draft → active → reviewed) and marks which time
-- blocks the planner owns, so replanning can rewrite auto-generated blocks while
-- leaving manually created / locked commitments (meetings) untouched.

-- Distinguish planner-owned blocks from manual ones, and pin fixed commitments.
alter table public.time_blocks
  add column if not exists auto_generated boolean not null default false;
alter table public.time_blocks
  add column if not exists locked boolean not null default false;
alter table public.time_blocks
  add column if not exists plan_source text;

create type public.daily_plan_status as enum ('draft', 'active', 'reviewed');

-- daily_plans — one row per user per date; carries the plan summary and, once
-- the day ends, the execution review folded into the same row.
create table public.daily_plans (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  plan_date         date not null,
  status            public.daily_plan_status not null default 'draft',
  -- Which planner phase last wrote this: evening_draft | morning_adjust |
  -- afternoon_replan | manual.
  source            text not null default 'evening_draft',
  focus_theme       text,
  planned_minutes   integer not null default 0,
  block_count       integer not null default 0,
  summary           text,

  -- Review fields (populated by generateEndOfDayReview).
  completion_rate   integer,
  completed_blocks  integer,
  total_blocks      integer,
  deep_work_minutes integer,
  wins              jsonb not null default '[]'::jsonb,
  misses            jsonb not null default '[]'::jsonb,
  tomorrow_focus    text,
  review_notes      text,
  reviewed_at       timestamptz,

  generated_at      timestamptz not null default now(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (user_id, plan_date)
);
create index daily_plans_user_id_date_idx on public.daily_plans (user_id, plan_date desc);
alter table public.daily_plans enable row level security;
create policy "Users manage their daily plans" on public.daily_plans
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
