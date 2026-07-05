-- =============================================================================
-- Migration 0021 — Execution OS
-- =============================================================================

create type public.time_block_status as enum (
  'planned', 'in_progress', 'completed', 'skipped', 'postponed'
);

create type public.goal_horizon as enum (
  'today', 'week', 'month', 'quarter', 'year', 'life'
);

create type public.goal_domain as enum (
  'learning', 'academic', 'project', 'business', 'health', 'personal', 'finance'
);

create type public.goal_status as enum (
  'active', 'completed', 'paused', 'abandoned'
);

create type public.capture_type as enum (
  'idea', 'task', 'note', 'link', 'code', 'meeting'
);

-- time_blocks
create table public.time_blocks (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  title               text not null,
  domain              text not null default 'personal',
  date                date not null,
  start_time          time not null,
  end_time            time not null,
  estimated_minutes   integer not null default 60,
  actual_minutes      integer,
  energy_required     text not null default 'medium',
  priority            integer not null default 50,
  status              public.time_block_status not null default 'planned',
  actual_start_at     timestamptz,
  actual_end_at       timestamptz,
  interruptions       integer not null default 0,
  focus_score         integer,
  notes               text,
  linked_entity_type  text,
  linked_entity_id    uuid,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index time_blocks_user_id_date_idx on public.time_blocks (user_id, date);
alter table public.time_blocks enable row level security;
create policy "Users manage their time blocks" on public.time_blocks
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- user_goals
create table public.user_goals (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  title          text not null,
  description    text,
  horizon        public.goal_horizon not null,
  domain         public.goal_domain not null default 'personal',
  status         public.goal_status not null default 'active',
  progress       integer not null default 0 check (progress >= 0 and progress <= 100),
  target_date    date,
  parent_goal_id uuid references public.user_goals(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index user_goals_user_id_horizon_idx on public.user_goals (user_id, horizon);
alter table public.user_goals enable row level security;
create policy "Users manage their goals" on public.user_goals
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- focus_sessions
create table public.focus_sessions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  title           text,
  domain          text not null default 'general',
  planned_minutes integer not null default 25,
  actual_minutes  integer,
  started_at      timestamptz not null default now(),
  ended_at        timestamptz,
  completed       boolean not null default false,
  interruptions   integer not null default 0,
  focus_score     integer,
  time_block_id   uuid references public.time_blocks(id) on delete set null,
  notes           text,
  created_at      timestamptz not null default now()
);
create index focus_sessions_user_id_started_at_idx on public.focus_sessions (user_id, started_at desc);
alter table public.focus_sessions enable row level security;
create policy "Users manage their focus sessions" on public.focus_sessions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- capture_items
create table public.capture_items (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null references auth.users(id) on delete cascade,
  content                 text not null,
  type                    public.capture_type not null default 'idea',
  status                  text not null default 'pending',
  suggested_destination   text,
  captured_at             timestamptz not null default now(),
  processed_at            timestamptz,
  created_at              timestamptz not null default now()
);
create index capture_items_user_id_status_idx on public.capture_items (user_id, status, captured_at desc);
alter table public.capture_items enable row level security;
create policy "Users manage their captures" on public.capture_items
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- scratchpad_items
create table public.scratchpad_items (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  content      text not null,
  pinned       boolean not null default false,
  expires_at   timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index scratchpad_items_user_id_idx on public.scratchpad_items (user_id, created_at desc);
alter table public.scratchpad_items enable row level security;
create policy "Users manage their scratchpad" on public.scratchpad_items
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
