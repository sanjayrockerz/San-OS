-- =============================================================================
-- Migration 0017 — Project OS schema
-- =============================================================================
-- Tables:
--   projects, project_tasks, project_milestones,
--   project_time_entries, project_documents,
--   project_change_requests, project_quotes
--
-- The Project OS is a first-class operating layer inside SanOS. Every entity
-- here integrates with events, notifications, and StudentIntelligenceCore via
-- the existing ProjectCoachService (service-layer only, no DB changes needed).
-- RLS: all tables are user-scoped; policies mirror the pattern in 0009.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Enum types
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'project_status') then
    create type public.project_status as enum (
      'planning', 'active', 'on_hold', 'completed', 'cancelled', 'archived'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'project_type') then
    create type public.project_type as enum (
      'client', 'internal', 'open_source'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'project_priority') then
    create type public.project_priority as enum (
      'critical', 'high', 'medium', 'low'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'task_status') then
    create type public.task_status as enum (
      'backlog', 'ready', 'in_progress', 'review', 'testing', 'completed', 'cancelled'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'time_entry_category') then
    create type public.time_entry_category as enum (
      'design', 'frontend', 'backend', 'testing', 'meetings', 'research', 'deployment', 'other'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'change_request_status') then
    create type public.change_request_status as enum (
      'pending', 'estimated', 'approved', 'rejected', 'implemented'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'quote_status') then
    create type public.quote_status as enum (
      'draft', 'sent', 'accepted', 'rejected', 'expired'
    );
  end if;
end
$$;

-- -----------------------------------------------------------------------------
-- projects — the core project entity
-- -----------------------------------------------------------------------------
create table if not exists public.projects (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  title            text not null,
  description      text,
  type             public.project_type not null default 'internal',
  status           public.project_status not null default 'planning',
  priority         public.project_priority not null default 'medium',
  tags             text[] not null default '{}',
  client_name      text,
  client_email     text,
  repository_url   text,
  deployment_url   text,
  production_url   text,
  estimated_hours  numeric(8, 2),
  actual_hours     numeric(8, 2) not null default 0,
  budget           numeric(12, 2),
  revenue          numeric(12, 2),
  start_date       date,
  deadline         date,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists projects_user_id_idx on public.projects (user_id);
create index if not exists projects_status_idx on public.projects (status);
create index if not exists projects_deadline_idx on public.projects (deadline);

-- -----------------------------------------------------------------------------
-- project_tasks — full lifecycle task engine
-- -----------------------------------------------------------------------------
create table if not exists public.project_tasks (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users (id) on delete cascade,
  project_id         uuid not null references public.projects (id) on delete cascade,
  title              text not null,
  description        text,
  status             public.task_status not null default 'backlog',
  priority           public.project_priority not null default 'medium',
  estimated_minutes  integer,
  actual_minutes     integer not null default 0,
  due_date           date,
  completed_at       timestamptz,
  order_index        integer not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists project_tasks_user_id_idx on public.project_tasks (user_id);
create index if not exists project_tasks_project_id_idx on public.project_tasks (project_id);
create index if not exists project_tasks_status_idx on public.project_tasks (status);
create index if not exists project_tasks_due_date_idx on public.project_tasks (due_date);

-- -----------------------------------------------------------------------------
-- project_milestones
-- -----------------------------------------------------------------------------
create table if not exists public.project_milestones (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  project_id    uuid not null references public.projects (id) on delete cascade,
  title         text not null,
  description   text,
  target_date   date,
  completed_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists project_milestones_project_id_idx on public.project_milestones (project_id);

-- -----------------------------------------------------------------------------
-- project_time_entries — time tracking per task and category
-- -----------------------------------------------------------------------------
create table if not exists public.project_time_entries (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  project_id   uuid not null references public.projects (id) on delete cascade,
  task_id      uuid references public.project_tasks (id) on delete set null,
  category     public.time_entry_category not null default 'other',
  description  text,
  minutes      integer not null check (minutes > 0),
  logged_at    timestamptz not null default now(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists project_time_entries_project_id_idx on public.project_time_entries (project_id);
create index if not exists project_time_entries_user_id_idx on public.project_time_entries (user_id);

-- -----------------------------------------------------------------------------
-- project_documents — documentation vault
-- -----------------------------------------------------------------------------
create table if not exists public.project_documents (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  project_id    uuid not null references public.projects (id) on delete cascade,
  title         text not null,
  doc_type      text not null default 'note',
  content       text,
  file_url      text,
  storage_path  text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists project_documents_project_id_idx on public.project_documents (project_id);

-- -----------------------------------------------------------------------------
-- project_change_requests — scope change tracking
-- -----------------------------------------------------------------------------
create table if not exists public.project_change_requests (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  project_id        uuid not null references public.projects (id) on delete cascade,
  title             text not null,
  description       text,
  original_scope    text,
  requested_change  text,
  estimated_hours   numeric(6, 2),
  suggested_price   numeric(10, 2),
  status            public.change_request_status not null default 'pending',
  approved_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists project_change_requests_project_id_idx on public.project_change_requests (project_id);

-- -----------------------------------------------------------------------------
-- project_quotes — quotation engine output
-- -----------------------------------------------------------------------------
create table if not exists public.project_quotes (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users (id) on delete cascade,
  project_id            uuid references public.projects (id) on delete set null,
  title                 text not null,
  summary               text,
  features              jsonb not null default '[]',
  milestones            jsonb not null default '[]',
  total_estimated_hours numeric(8, 2),
  price_min             numeric(12, 2),
  price_max             numeric(12, 2),
  status                public.quote_status not null default 'draft',
  sent_at               timestamptz,
  expires_at            timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists project_quotes_user_id_idx on public.project_quotes (user_id);
create index if not exists project_quotes_project_id_idx on public.project_quotes (project_id);

-- -----------------------------------------------------------------------------
-- RLS — mirrors the user_id-scoped pattern from 0003 / 0009
-- -----------------------------------------------------------------------------
alter table public.projects enable row level security;
alter table public.project_tasks enable row level security;
alter table public.project_milestones enable row level security;
alter table public.project_time_entries enable row level security;
alter table public.project_documents enable row level security;
alter table public.project_change_requests enable row level security;
alter table public.project_quotes enable row level security;

do $$
declare
  tbl text;
  tables text[] := array[
    'projects', 'project_tasks', 'project_milestones',
    'project_time_entries', 'project_documents',
    'project_change_requests', 'project_quotes'
  ];
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

-- -----------------------------------------------------------------------------
-- updated_at triggers
-- -----------------------------------------------------------------------------
do $$
declare
  tbl text;
  tables text[] := array[
    'projects', 'project_tasks', 'project_milestones',
    'project_time_entries', 'project_documents',
    'project_change_requests', 'project_quotes'
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
