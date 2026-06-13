-- =============================================================================
-- Migration 0004 — Knowledge & Concept Vault schema
-- =============================================================================
-- Tables:
--   concept_notes, concept_resources, concept_problems
--
-- Concept cards are user-owned. Each concept may carry many resources
-- (screenshots, PDFs, YouTube links) and may be linked to global patterns,
-- topics, and the user's problems. Conventions follow 0001/0002:
--   * uuid primary keys (gen_random_uuid())
--   * user_id FK to auth.users on every owned table
--   * created_at / updated_at on every table (updated_at via trigger)
-- RLS is defined in 0009.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Enum types
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'concept_status') then
    create type public.concept_status as enum (
      'learning',
      'understood',
      'weak',
      'forgotten',
      'mastered'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'resource_type') then
    create type public.resource_type as enum (
      'screenshot',
      'image',
      'pdf',
      'youtube',
      'article',
      'link'
    );
  end if;
end
$$;

-- -----------------------------------------------------------------------------
-- concept_notes
-- -----------------------------------------------------------------------------
create table if not exists public.concept_notes (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users (id) on delete cascade,
  title                text not null,
  category             text,
  status               public.concept_status not null default 'learning',
  confidence           smallint check (confidence between 1 and 5),
  personal_explanation text,
  recognition_clues    text[] not null default '{}',
  when_to_use          text,
  common_mistakes      text[] not null default '{}',
  topic_id             uuid references public.topics (id) on delete set null,
  pattern_id           uuid references public.patterns (id) on delete set null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists concept_notes_user_id_idx
  on public.concept_notes (user_id);
create index if not exists concept_notes_topic_id_idx
  on public.concept_notes (topic_id);
create index if not exists concept_notes_pattern_id_idx
  on public.concept_notes (pattern_id);

-- -----------------------------------------------------------------------------
-- concept_resources (images, PDFs, YouTube links attached to a concept)
-- -----------------------------------------------------------------------------
create table if not exists public.concept_resources (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  concept_id    uuid not null references public.concept_notes (id) on delete cascade,
  type          public.resource_type not null,
  title         text,
  url           text,
  storage_path  text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists concept_resources_user_id_idx
  on public.concept_resources (user_id);
create index if not exists concept_resources_concept_id_idx
  on public.concept_resources (concept_id);

-- -----------------------------------------------------------------------------
-- concept_problems (many-to-many: concepts <-> problems, per user)
-- -----------------------------------------------------------------------------
create table if not exists public.concept_problems (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  concept_id  uuid not null references public.concept_notes (id) on delete cascade,
  problem_id  uuid not null references public.problems (id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (concept_id, problem_id)
);

create index if not exists concept_problems_user_id_idx
  on public.concept_problems (user_id);
create index if not exists concept_problems_concept_id_idx
  on public.concept_problems (concept_id);
create index if not exists concept_problems_problem_id_idx
  on public.concept_problems (problem_id);

-- -----------------------------------------------------------------------------
-- updated_at triggers
-- -----------------------------------------------------------------------------
do $$
declare
  tbl text;
  tables text[] := array[
    'concept_notes', 'concept_resources', 'concept_problems'
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
