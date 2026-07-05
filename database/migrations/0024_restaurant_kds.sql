-- =============================================================================
-- Migration 0024 — Restaurant Alert System (KDS)
-- =============================================================================

create type public.order_status as enum (
  'pending', 'acknowledged', 'completed', 'cancelled'
);

-- -----------------------------------------------------------------------------
-- orders
-- -----------------------------------------------------------------------------
create table public.orders (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  customer_name   text,
  items           jsonb not null default '[]'::jsonb,
  total_amount    numeric(10, 2),
  status          public.order_status not null default 'pending',
  created_at      timestamptz not null default now(),
  acknowledged_at timestamptz,
  completed_at    timestamptz
);

create index orders_user_id_status_idx on public.orders (user_id, status);

alter table public.orders enable row level security;
create policy "Users manage their orders" on public.orders
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- kds_settings
-- -----------------------------------------------------------------------------
create table public.kds_settings (
  user_id                      uuid primary key references auth.users (id) on delete cascade,
  sound_url                    text,
  volume                       integer not null default 100 check (volume between 0 and 100),
  repeat_interval_sec          integer not null default 10 check (repeat_interval_sec >= 0),
  is_muted                     boolean not null default false,
  enable_browser_notifications boolean not null default true,
  updated_at                   timestamptz not null default now()
);

alter table public.kds_settings enable row level security;
create policy "Users manage their kds settings" on public.kds_settings
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- Realtime
-- -----------------------------------------------------------------------------
-- Add orders to the supabase_realtime publication so WebSockets trigger on changes
begin;
  -- If supabase_realtime publication does not exist, create it (usually it exists)
  do $$
  begin
    if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
      create publication supabase_realtime;
    end if;
  end
  $$;
  
  alter publication supabase_realtime add table public.orders;
commit;
