-- =============================================================================
-- Migration 0013 — Knowledge Vault schema (Phase 5B.1)
-- =============================================================================
-- Tables:
--   knowledge_items  — a stored learning resource (note, link, algorithm, …)
--   knowledge_links  — many-to-many: a knowledge item <-> a domain entity
--
-- Phase 5B.1 ships text/link items only; the `storage_path` column is present so
-- a later phase can attach uploaded files (images/PDFs) without an ALTER. Types
-- are plain text with a CHECK constraint (mirroring `events.event_type`) so new
-- content kinds can be added without an enum migration.
--
-- RLS: classic per-user ownership (auth.uid() = user_id) on both tables.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- knowledge_items
-- -----------------------------------------------------------------------------
create table if not exists public.knowledge_items (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  type          text not null default 'note'
                  check (type in (
                    'note', 'youtube', 'image', 'pdf', 'algorithm',
                    'resource', 'cheatsheet', 'observation', 'lecture'
                  )),
  title         text not null,
  content       text,
  url           text,
  storage_path  text,
  tags          text[] not null default '{}',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists knowledge_items_user_id_idx
  on public.knowledge_items (user_id);
create index if not exists knowledge_items_type_idx
  on public.knowledge_items (type);
create index if not exists knowledge_items_created_at_idx
  on public.knowledge_items (created_at desc);

-- -----------------------------------------------------------------------------
-- knowledge_links (knowledge item <-> problem / topic / pattern / concept / iit)
-- -----------------------------------------------------------------------------
create table if not exists public.knowledge_links (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  knowledge_id  uuid not null references public.knowledge_items (id) on delete cascade,
  entity_type   text not null
                  check (entity_type in (
                    'problem', 'topic', 'pattern', 'concept', 'iit_course'
                  )),
  entity_id     uuid not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (knowledge_id, entity_type, entity_id)
);

create index if not exists knowledge_links_user_id_idx
  on public.knowledge_links (user_id);
create index if not exists knowledge_links_knowledge_id_idx
  on public.knowledge_links (knowledge_id);
create index if not exists knowledge_links_entity_idx
  on public.knowledge_links (entity_type, entity_id);

-- -----------------------------------------------------------------------------
-- updated_at triggers
-- -----------------------------------------------------------------------------
do $$
declare
  tbl text;
  tables text[] := array['knowledge_items', 'knowledge_links'];
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

-- -----------------------------------------------------------------------------
-- Row Level Security — per-user ownership on both tables
-- -----------------------------------------------------------------------------
alter table public.knowledge_items enable row level security;
alter table public.knowledge_links enable row level security;

do $$
declare
  tbl text;
  tables text[] := array['knowledge_items', 'knowledge_links'];
begin
  foreach tbl in array tables loop
    execute format('drop policy if exists "%1$s_select_own" on public.%1$I;', tbl);
    execute format(
      'create policy "%1$s_select_own" on public.%1$I
         for select to authenticated using (auth.uid() = user_id);', tbl);

    execute format('drop policy if exists "%1$s_insert_own" on public.%1$I;', tbl);
    execute format(
      'create policy "%1$s_insert_own" on public.%1$I
         for insert to authenticated with check (auth.uid() = user_id);', tbl);

    execute format('drop policy if exists "%1$s_update_own" on public.%1$I;', tbl);
    execute format(
      'create policy "%1$s_update_own" on public.%1$I
         for update to authenticated
         using (auth.uid() = user_id) with check (auth.uid() = user_id);', tbl);

    execute format('drop policy if exists "%1$s_delete_own" on public.%1$I;', tbl);
    execute format(
      'create policy "%1$s_delete_own" on public.%1$I
         for delete to authenticated using (auth.uid() = user_id);', tbl);
  end loop;
end
$$;
