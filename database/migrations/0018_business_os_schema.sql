-- =============================================================================
-- Migration 0018 — Business OS schema (Phase 6)
-- =============================================================================
-- Tables:
--   clients, pipeline_entries, invoices, income_entries, expense_entries
--
-- Clients become a first-class entity. Projects and project_quotes gain an
-- optional client_id FK so business data can be rolled up across projects.
-- BusinessCoachService (service-layer only) will plug these into
-- StudentIntelligenceCore the same way ProjectCoachService does — no DB
-- changes needed for that step.
-- RLS: all tables are user-scoped; policies mirror the pattern in 0017.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Enum types
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'client_status') then
    create type public.client_status as enum (
      'prospect', 'active', 'inactive', 'churned'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'pipeline_stage') then
    create type public.pipeline_stage as enum (
      'lead', 'discovery', 'proposal', 'negotiation', 'won', 'lost'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'invoice_status') then
    create type public.invoice_status as enum (
      'draft', 'sent', 'paid', 'overdue', 'cancelled'
    );
  end if;
end
$$;

-- -----------------------------------------------------------------------------
-- clients — first-class client entity
-- -----------------------------------------------------------------------------
create table if not exists public.clients (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null,
  company     text,
  industry    text,
  website     text,
  email       text,
  phone       text,
  whatsapp    text,
  timezone    text,
  address     text,
  tax_info    text,
  status      public.client_status not null default 'prospect',
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists clients_user_id_idx on public.clients (user_id);
create index if not exists clients_status_idx on public.clients (status);

-- -----------------------------------------------------------------------------
-- pipeline_entries — pre-project business development funnel
-- -----------------------------------------------------------------------------
create table if not exists public.pipeline_entries (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users (id) on delete cascade,
  client_id           uuid references public.clients (id) on delete set null,
  title               text not null,
  value_estimate      numeric(12, 2),
  stage               public.pipeline_stage not null default 'lead',
  probability         integer not null default 50 check (probability between 0 and 100),
  expected_close_date date,
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists pipeline_entries_user_id_idx on public.pipeline_entries (user_id);
create index if not exists pipeline_entries_client_id_idx on public.pipeline_entries (client_id);
create index if not exists pipeline_entries_stage_idx on public.pipeline_entries (stage);

-- -----------------------------------------------------------------------------
-- invoices
-- -----------------------------------------------------------------------------
create table if not exists public.invoices (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  client_id       uuid not null references public.clients (id) on delete cascade,
  project_id      uuid references public.projects (id) on delete set null,
  invoice_number  text not null,
  line_items      jsonb not null default '[]',
  total_amount    numeric(12, 2) not null default 0,
  currency        text not null default 'INR',
  status          public.invoice_status not null default 'draft',
  due_date        date,
  sent_at         timestamptz,
  paid_at         timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists invoices_user_id_idx on public.invoices (user_id);
create index if not exists invoices_client_id_idx on public.invoices (client_id);
create index if not exists invoices_status_idx on public.invoices (status);
create index if not exists invoices_due_date_idx on public.invoices (due_date);
create unique index if not exists invoices_user_id_invoice_number_idx
  on public.invoices (user_id, invoice_number);

-- -----------------------------------------------------------------------------
-- income_entries — recorded revenue, optionally tied to an invoice
-- -----------------------------------------------------------------------------
create table if not exists public.income_entries (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  client_id    uuid references public.clients (id) on delete set null,
  project_id   uuid references public.projects (id) on delete set null,
  invoice_id   uuid references public.invoices (id) on delete set null,
  amount       numeric(12, 2) not null,
  currency     text not null default 'INR',
  category     text not null default 'project_revenue',
  description  text,
  received_at  date not null default current_date,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists income_entries_user_id_idx on public.income_entries (user_id);
create index if not exists income_entries_received_at_idx on public.income_entries (received_at);

-- -----------------------------------------------------------------------------
-- expense_entries
-- -----------------------------------------------------------------------------
create table if not exists public.expense_entries (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  category     text not null default 'other',
  amount       numeric(12, 2) not null,
  currency     text not null default 'INR',
  description  text,
  occurred_at  date not null default current_date,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists expense_entries_user_id_idx on public.expense_entries (user_id);
create index if not exists expense_entries_occurred_at_idx on public.expense_entries (occurred_at);

-- -----------------------------------------------------------------------------
-- Link clients into existing Project OS tables
-- -----------------------------------------------------------------------------
alter table public.projects
  add column if not exists client_id uuid references public.clients (id) on delete set null;

create index if not exists projects_client_id_idx on public.projects (client_id);

alter table public.project_quotes
  add column if not exists client_id uuid references public.clients (id) on delete set null;

create index if not exists project_quotes_client_id_idx on public.project_quotes (client_id);

-- -----------------------------------------------------------------------------
-- Configurable hourly rate (replaces hardcoded INR rates in QuoteEngineService)
-- -----------------------------------------------------------------------------
alter table public.user_preferences
  add column if not exists default_hourly_rate numeric(10, 2);

-- -----------------------------------------------------------------------------
-- RLS — mirrors the user_id-scoped pattern from 0017
-- -----------------------------------------------------------------------------
alter table public.clients enable row level security;
alter table public.pipeline_entries enable row level security;
alter table public.invoices enable row level security;
alter table public.income_entries enable row level security;
alter table public.expense_entries enable row level security;

do $$
declare
  tbl text;
  tables text[] := array[
    'clients', 'pipeline_entries', 'invoices', 'income_entries', 'expense_entries'
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
    'clients', 'pipeline_entries', 'invoices', 'income_entries', 'expense_entries'
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
