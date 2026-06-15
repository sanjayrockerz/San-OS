-- =============================================================================
-- Migration 0012 — Dynamic, per-user evolving taxonomy
-- =============================================================================
-- Until now `topics` and `patterns` were global, seed-only reference data with
-- no owner and writes reserved for the service role. A static list calcifies —
-- a learner's vocabulary should grow with their practice.
--
-- This migration makes the taxonomy evolve in three ways, all PER USER:
--   1. Usage-driven re-ranking — `taxonomy_usage` scores each topic/pattern for
--      a user from real attempt activity (with recency decay), so what they
--      practise rises and what they ignore fades.
--   2. AI proposes -> you approve — candidates land as status='proposed' in an
--      approval queue (source='ai_proposed').
--   3. AI auto-add — high-confidence candidates go live silently
--      (status='active', source='ai_auto').
--
-- Ownership model (mirrors `problems` / `roadmaps`):
--   * user_id IS NULL  -> global seed, readable by everyone, never proposed.
--   * user_id = a user -> that user's own topic/pattern (any source/status).
-- Seed rows keep their global, service-role-managed nature.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Enum types — provenance and lifecycle of a taxonomy row
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'taxonomy_source') then
    create type public.taxonomy_source as enum (
      'seed',         -- shipped global baseline
      'user',         -- the user added it by hand
      'ai_proposed',  -- AI suggested it, awaiting approval
      'ai_auto'       -- AI added it automatically (high confidence)
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'taxonomy_status') then
    create type public.taxonomy_status as enum (
      'active',     -- live and shown in the taxonomy
      'proposed',   -- pending the user's approval
      'dismissed'   -- the user rejected it (kept for audit / de-dup)
    );
  end if;
end
$$;

-- -----------------------------------------------------------------------------
-- Evolve topics & patterns with ownership + provenance columns
-- -----------------------------------------------------------------------------
alter table public.topics
  add column if not exists user_id       uuid references auth.users (id) on delete cascade,
  add column if not exists source        public.taxonomy_source not null default 'seed',
  add column if not exists status        public.taxonomy_status not null default 'active',
  add column if not exists ai_confidence smallint check (ai_confidence between 1 and 5),
  add column if not exists ai_rationale  text;

alter table public.patterns
  add column if not exists user_id       uuid references auth.users (id) on delete cascade,
  add column if not exists source        public.taxonomy_source not null default 'seed',
  add column if not exists status        public.taxonomy_status not null default 'active',
  add column if not exists ai_confidence smallint check (ai_confidence between 1 and 5),
  add column if not exists ai_rationale  text;

-- Slugs were globally unique. They must now be unique PER OWNER (and globally
-- among the seed rows), so a user can define their own "two-pointers" without
-- colliding with the seed or with another user. Drop the old global constraint
-- (named <table>_slug_key by Postgres' `unique` shorthand) and replace it with
-- two partial unique indexes.
alter table public.topics   drop constraint if exists topics_slug_key;
alter table public.patterns drop constraint if exists patterns_slug_key;

create unique index if not exists topics_global_slug_key
  on public.topics (slug) where user_id is null;
create unique index if not exists topics_user_slug_key
  on public.topics (user_id, slug) where user_id is not null;

create unique index if not exists patterns_global_slug_key
  on public.patterns (slug) where user_id is null;
create unique index if not exists patterns_user_slug_key
  on public.patterns (user_id, slug) where user_id is not null;

create index if not exists topics_user_id_idx   on public.topics (user_id);
create index if not exists patterns_user_id_idx  on public.patterns (user_id);
create index if not exists topics_status_idx     on public.topics (status);
create index if not exists patterns_status_idx   on public.patterns (status);

-- Existing rows are the seed baseline. The column defaults already set
-- source='seed'/status='active'; this is belt-and-braces for rows that somehow
-- predate the defaults.
update public.topics   set source = 'seed', status = 'active' where source is null or status is null;
update public.patterns set source = 'seed', status = 'active' where source is null or status is null;

-- -----------------------------------------------------------------------------
-- taxonomy_usage — per-user practice signal + computed relevance score
-- -----------------------------------------------------------------------------
-- One row per (user, topic|pattern). Works for BOTH global seed rows and the
-- user's own rows, because re-ranking is always personal. `relevance_score` is
-- derived (usage_count blended with recency) and re-computed by TaxonomyService.
create table if not exists public.taxonomy_usage (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  entity_type     text not null check (entity_type in ('topic', 'pattern')),
  entity_id       uuid not null,
  usage_count     integer not null default 0,
  last_used_at    timestamptz,
  relevance_score double precision not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (user_id, entity_type, entity_id)
);

create index if not exists taxonomy_usage_user_id_idx
  on public.taxonomy_usage (user_id);
create index if not exists taxonomy_usage_rank_idx
  on public.taxonomy_usage (user_id, entity_type, relevance_score desc);

-- -----------------------------------------------------------------------------
-- RLS — topics & patterns become "global seed OR your own"; usage is user-owned
-- -----------------------------------------------------------------------------
alter table public.taxonomy_usage enable row level security;

-- Replace the old read-only-global SELECT policies (from 0003) with
-- ownership-aware CRUD, mirroring public.problems.
do $$
declare
  tbl text;
  tables text[] := array['topics', 'patterns'];
begin
  foreach tbl in array tables loop
    -- Drop the previous global read policy.
    execute format('drop policy if exists "%1$s_select_authenticated" on public.%1$I;', tbl);

    execute format('drop policy if exists "%1$s_select_global_or_own" on public.%1$I;', tbl);
    execute format(
      'create policy "%1$s_select_global_or_own" on public.%1$I
         for select to authenticated
         using (user_id is null or auth.uid() = user_id);', tbl);

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

drop policy if exists "taxonomy_usage_select_own" on public.taxonomy_usage;
create policy "taxonomy_usage_select_own" on public.taxonomy_usage
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "taxonomy_usage_insert_own" on public.taxonomy_usage;
create policy "taxonomy_usage_insert_own" on public.taxonomy_usage
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "taxonomy_usage_update_own" on public.taxonomy_usage;
create policy "taxonomy_usage_update_own" on public.taxonomy_usage
  for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "taxonomy_usage_delete_own" on public.taxonomy_usage;
create policy "taxonomy_usage_delete_own" on public.taxonomy_usage
  for delete to authenticated using (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- updated_at trigger for the new table (topics/patterns already have theirs)
-- -----------------------------------------------------------------------------
drop trigger if exists set_updated_at on public.taxonomy_usage;
create trigger set_updated_at before update on public.taxonomy_usage
  for each row execute function public.set_updated_at();
