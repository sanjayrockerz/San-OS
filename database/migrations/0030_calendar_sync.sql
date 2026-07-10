-- =============================================================================
-- Migration 0030 — Calendar Sync & Connections
-- =============================================================================

-- Stores OAuth tokens per user for external calendar providers
create table public.calendar_connections (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  provider        text not null default 'google',
  email           text,
  access_token    text,
  refresh_token   text,
  token_expires_at timestamptz,
  calendar_id     text default 'primary',
  sync_enabled    boolean not null default true,
  last_synced_at  timestamptz,
  settings        jsonb not null default '{}',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index calendar_connections_user_id_idx on public.calendar_connections (user_id);
alter table public.calendar_connections enable row level security;
create policy "Users manage own calendar connections" on public.calendar_connections
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Sync log: tracks what was synced when
create table public.calendar_sync_log (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  connection_id   uuid references public.calendar_connections(id) on delete cascade,
  sync_type       text not null default 'pull',
  status          text not null default 'completed',
  events_created  integer not null default 0,
  events_updated  integer not null default 0,
  errors          jsonb default '[]',
  started_at      timestamptz not null default now(),
  completed_at    timestamptz
);
alter table public.calendar_sync_log enable row level security;
create policy "Users view own sync logs" on public.calendar_sync_log
  for select using (user_id = auth.uid());
create policy "Users insert own sync logs" on public.calendar_sync_log
  for insert with check (user_id = auth.uid());
