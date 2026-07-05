-- =============================================================================
-- Migration 0025 — Universal Resources & Memory Graph (Phase 7)
-- =============================================================================
-- Unifies all file attachments, images, and voice notes into a single
-- `resources` table. Links them to any domain entity via `resource_links`.
-- Introduces `memory_edges` to represent any relationship between two nodes.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- resources
-- -----------------------------------------------------------------------------
create table if not exists public.resources (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  title          text not null,
  description    text,
  resource_type  text not null, -- 'image', 'pdf', 'audio', 'video', 'document', 'voice_note', etc
  mime_type      text,
  size_bytes     bigint,
  checksum       text,
  storage_path   text,
  thumbnail_path text,
  preview_path   text,
  metadata       jsonb not null default '{}'::jsonb,
  embedding      vector(384), -- for semantic search using BGE-small
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists resources_user_id_idx on public.resources (user_id);
create index if not exists resources_resource_type_idx on public.resources (resource_type);
create index if not exists resources_embedding_idx on public.resources using hnsw (embedding vector_cosine_ops);

alter table public.resources enable row level security;
drop policy if exists "Users manage their resources" on public.resources;
create policy "Users manage their resources" on public.resources
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- resource_links
-- -----------------------------------------------------------------------------
create table if not exists public.resource_links (
  id                uuid primary key default gen_random_uuid(),
  resource_id       uuid not null references public.resources (id) on delete cascade,
  entity_type       text not null, -- 'project', 'client', 'meeting', 'problem', etc
  entity_id         uuid not null,
  relationship_type text not null default 'attached_to',
  created_at        timestamptz not null default now()
);

create index if not exists resource_links_resource_id_idx on public.resource_links (resource_id);
create index if not exists resource_links_entity_idx on public.resource_links (entity_type, entity_id);

alter table public.resource_links enable row level security;
-- Security definer functions or simple existence checks usually govern links, but since
-- resources are protected, we can enforce RLS via the parent resource.
drop policy if exists "Users manage resource links" on public.resource_links;
create policy "Users manage resource links" on public.resource_links
  for all using (
    exists (
      select 1 from public.resources r 
      where r.id = resource_id and r.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.resources r 
      where r.id = resource_id and r.user_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- memory_edges
-- -----------------------------------------------------------------------------
-- Represents directed relationships (A -> B) across the system.
create table if not exists public.memory_edges (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  source_type       text not null,
  source_id         uuid not null,
  target_type       text not null,
  target_id         uuid not null,
  relationship_type text not null, -- 'belongs_to', 'generated_by', 'paid_by', etc
  metadata          jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now()
);

create index if not exists memory_edges_user_id_idx on public.memory_edges (user_id);
create index if not exists memory_edges_source_idx on public.memory_edges (source_type, source_id);
create index if not exists memory_edges_target_idx on public.memory_edges (target_type, target_id);

alter table public.memory_edges enable row level security;
drop policy if exists "Users manage memory edges" on public.memory_edges;
create policy "Users manage memory edges" on public.memory_edges
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
