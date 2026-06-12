-- =============================================================================
-- Migration 0003 — Row Level Security
-- =============================================================================
-- RLS is enabled on EVERY table.
--
-- Policy model:
--   * User-owned tables (users_profile, problem_attempts, problem_reflections,
--     problem_code_versions, revision_queue): full CRUD where
--     auth.uid() = user_id.
--   * problems: shared catalog (user_id IS NULL, read-only to users) plus
--     user-authored rows that the owner can fully manage.
--   * Global taxonomy (topics, patterns): readable by any authenticated user;
--     writes are reserved for the service role (which bypasses RLS), e.g. seeds.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Enable RLS everywhere
-- -----------------------------------------------------------------------------
alter table public.users_profile         enable row level security;
alter table public.topics                 enable row level security;
alter table public.patterns               enable row level security;
alter table public.problems               enable row level security;
alter table public.problem_attempts       enable row level security;
alter table public.problem_reflections    enable row level security;
alter table public.problem_code_versions  enable row level security;
alter table public.revision_queue         enable row level security;

-- -----------------------------------------------------------------------------
-- users_profile
-- -----------------------------------------------------------------------------
drop policy if exists "users_profile_select_own" on public.users_profile;
create policy "users_profile_select_own" on public.users_profile
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "users_profile_insert_own" on public.users_profile;
create policy "users_profile_insert_own" on public.users_profile
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "users_profile_update_own" on public.users_profile;
create policy "users_profile_update_own" on public.users_profile
  for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "users_profile_delete_own" on public.users_profile;
create policy "users_profile_delete_own" on public.users_profile
  for delete to authenticated using (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- topics (global reference: read-only to authenticated users)
-- -----------------------------------------------------------------------------
drop policy if exists "topics_select_authenticated" on public.topics;
create policy "topics_select_authenticated" on public.topics
  for select to authenticated using (true);

-- -----------------------------------------------------------------------------
-- patterns (global reference: read-only to authenticated users)
-- -----------------------------------------------------------------------------
drop policy if exists "patterns_select_authenticated" on public.patterns;
create policy "patterns_select_authenticated" on public.patterns
  for select to authenticated using (true);

-- -----------------------------------------------------------------------------
-- problems (shared catalog + user-authored)
-- -----------------------------------------------------------------------------
drop policy if exists "problems_select_catalog_or_own" on public.problems;
create policy "problems_select_catalog_or_own" on public.problems
  for select to authenticated
  using (user_id is null or auth.uid() = user_id);

drop policy if exists "problems_insert_own" on public.problems;
create policy "problems_insert_own" on public.problems
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "problems_update_own" on public.problems;
create policy "problems_update_own" on public.problems
  for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "problems_delete_own" on public.problems;
create policy "problems_delete_own" on public.problems
  for delete to authenticated using (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- Per-user owned tables — identical auth.uid() = user_id CRUD policies
-- -----------------------------------------------------------------------------
do $$
declare
  tbl text;
  tables text[] := array[
    'problem_attempts',
    'problem_reflections',
    'problem_code_versions',
    'revision_queue'
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
