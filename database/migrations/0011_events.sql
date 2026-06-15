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
