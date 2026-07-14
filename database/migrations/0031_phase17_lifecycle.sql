-- Phase 17: durable lifecycle history for every user-owned entity.
-- Domain tables keep their own shape; this append-only seam stores the state
-- transition needed for history, undo, restore, and audit UI.
create table if not exists public.entity_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  operation text not null check (operation in ('create','update','archive','restore','delete','merge','undo')),
  before_state jsonb,
  after_state jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists entity_history_entity_idx
  on public.entity_history(user_id, entity_type, entity_id, created_at desc);
create index if not exists entity_history_user_idx
  on public.entity_history(user_id, created_at desc);

alter table public.entity_history enable row level security;
drop policy if exists "entity_history_select_own" on public.entity_history;
create policy "entity_history_select_own" on public.entity_history
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists "entity_history_insert_own" on public.entity_history;
create policy "entity_history_insert_own" on public.entity_history
  for insert to authenticated with check (auth.uid() = user_id);

create table if not exists public.entity_aliases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_type text not null,
  alias_entity_id uuid not null,
  canonical_entity_id uuid not null,
  created_at timestamptz not null default now(),
  unique(user_id, entity_type, alias_entity_id)
);

alter table public.entity_aliases enable row level security;
drop policy if exists "entity_aliases_select_own" on public.entity_aliases;
create policy "entity_aliases_select_own" on public.entity_aliases
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists "entity_aliases_insert_own" on public.entity_aliases;
create policy "entity_aliases_insert_own" on public.entity_aliases
  for insert to authenticated with check (auth.uid() = user_id);
