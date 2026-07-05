-- =============================================================================
-- Migration 0026 — Phase 7A Memory Intelligence Graph Expansion
-- =============================================================================

-- 1. Create memory_nodes to act as first-class entities for extracted concepts
create table if not exists public.memory_nodes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  node_type text not null, -- 'person', 'technology', 'topic', 'location', 'date', 'money', etc.
  name text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists memory_nodes_user_id_idx on public.memory_nodes (user_id);
create index if not exists memory_nodes_type_name_idx on public.memory_nodes (node_type, name);

alter table public.memory_nodes enable row level security;
drop policy if exists "Users manage their memory nodes" on public.memory_nodes;
create policy "Users manage their memory nodes" on public.memory_nodes
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());


-- 2. Expand memory_edges with intelligence metadata
alter table public.memory_edges
  add column if not exists confidence real not null default 1.0,
  add column if not exists evidence text,
  add column if not exists created_by_pipeline boolean not null default false;

-- 3. Timeline chaining
alter table public.events
  add column if not exists parent_event_id uuid references public.events(id) on delete set null;
