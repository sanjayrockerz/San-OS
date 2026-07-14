create table if not exists public.interests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  status text not null default 'active' check (status in ('active','paused','archived')),
  progress integer not null default 0 check (progress between 0 and 100),
  color text not null default '#818cf8',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists interests_user_idx on public.interests(user_id, status, updated_at desc);
alter table public.interests enable row level security;
drop policy if exists "interests_select_own" on public.interests;
create policy "interests_select_own" on public.interests for select to authenticated using (auth.uid() = user_id);
drop policy if exists "interests_insert_own" on public.interests;
create policy "interests_insert_own" on public.interests for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "interests_update_own" on public.interests;
create policy "interests_update_own" on public.interests for update to authenticated using (auth.uid() = user_id);
