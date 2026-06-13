-- =============================================================================
-- Migration 0005 — Roadmap Engine schema
-- =============================================================================
-- Tables:
--   roadmaps, roadmap_items, roadmap_progress
--
-- A roadmap is either a global template (user_id NULL — e.g. Striver A2Z,
-- Blind 75, NeetCode 150, IIT) readable by all authenticated users, or a
-- user-authored custom roadmap. roadmap_items form a tree (parent_item_id)
-- and may reference a problem so that solving a problem once can update every
-- linked roadmap. roadmap_progress records per-user completion of an item.
-- RLS is defined in 0009.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Enum types
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'roadmap_kind') then
    create type public.roadmap_kind as enum (
      'striver_a2z',
      'blind_75',
      'neetcode_150',
      'iit',
      'custom'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'roadmap_item_status') then
    create type public.roadmap_item_status as enum (
      'not_started',
      'in_progress',
      'completed',
      'skipped'
    );
  end if;
end
$$;

-- -----------------------------------------------------------------------------
-- roadmaps (global template when user_id is NULL, else user-authored)
-- -----------------------------------------------------------------------------
create table if not exists public.roadmaps (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users (id) on delete cascade,
  kind         public.roadmap_kind not null default 'custom',
  title        text not null,
  slug         text,
  description  text,
  source_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists roadmaps_user_id_idx on public.roadmaps (user_id);

-- One global-template row per slug. User-authored rows are exempt.
create unique index if not exists roadmaps_template_slug_uniq
  on public.roadmaps (slug)
  where user_id is null and slug is not null;

-- -----------------------------------------------------------------------------
-- roadmap_items (tree of sections/problems within a roadmap)
-- -----------------------------------------------------------------------------
create table if not exists public.roadmap_items (
  id              uuid primary key default gen_random_uuid(),
  roadmap_id      uuid not null references public.roadmaps (id) on delete cascade,
  parent_item_id  uuid references public.roadmap_items (id) on delete cascade,
  title           text not null,
  problem_id      uuid references public.problems (id) on delete set null,
  topic_id        uuid references public.topics (id) on delete set null,
  is_section      boolean not null default false,
  order_index     integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists roadmap_items_roadmap_id_idx
  on public.roadmap_items (roadmap_id);
create index if not exists roadmap_items_parent_item_id_idx
  on public.roadmap_items (parent_item_id);
create index if not exists roadmap_items_problem_id_idx
  on public.roadmap_items (problem_id);

-- -----------------------------------------------------------------------------
-- roadmap_progress (per-user completion of a roadmap item)
-- -----------------------------------------------------------------------------
create table if not exists public.roadmap_progress (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  roadmap_id    uuid not null references public.roadmaps (id) on delete cascade,
  item_id       uuid not null references public.roadmap_items (id) on delete cascade,
  status        public.roadmap_item_status not null default 'not_started',
  completed_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (user_id, item_id)
);

create index if not exists roadmap_progress_user_id_idx
  on public.roadmap_progress (user_id);
create index if not exists roadmap_progress_roadmap_id_idx
  on public.roadmap_progress (roadmap_id);

-- -----------------------------------------------------------------------------
-- updated_at triggers
-- -----------------------------------------------------------------------------
do $$
declare
  tbl text;
  tables text[] := array[
    'roadmaps', 'roadmap_items', 'roadmap_progress'
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
