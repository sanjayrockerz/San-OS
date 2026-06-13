-- =============================================================================
-- Migration 0009 — Row Level Security for Phase 2 tables
-- =============================================================================
-- RLS is enabled on EVERY new table (0004–0008).
--
-- Policy model:
--   * User-owned tables: full CRUD where auth.uid() = user_id.
--   * roadmaps: global templates (user_id IS NULL, read-only to users) plus
--     user-authored rows the owner can fully manage — mirrors `problems`.
--   * roadmap_items: readable when their parent roadmap is readable; writable
--     only by the owner of that roadmap.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Enable RLS everywhere
-- -----------------------------------------------------------------------------
alter table public.concept_notes       enable row level security;
alter table public.concept_resources   enable row level security;
alter table public.concept_problems    enable row level security;
alter table public.roadmaps            enable row level security;
alter table public.roadmap_items       enable row level security;
alter table public.roadmap_progress    enable row level security;
alter table public.activity_logs       enable row level security;
alter table public.study_sessions      enable row level security;
alter table public.daily_logs          enable row level security;
alter table public.iit_courses         enable row level security;
alter table public.iit_assignments     enable row level security;
alter table public.iit_lectures        enable row level security;
alter table public.academic_documents  enable row level security;
alter table public.ai_daily_briefs     enable row level security;
alter table public.ai_insights         enable row level security;

-- -----------------------------------------------------------------------------
-- roadmaps (shared template + user-authored) — mirrors public.problems
-- -----------------------------------------------------------------------------
drop policy if exists "roadmaps_select_template_or_own" on public.roadmaps;
create policy "roadmaps_select_template_or_own" on public.roadmaps
  for select to authenticated
  using (user_id is null or auth.uid() = user_id);

drop policy if exists "roadmaps_insert_own" on public.roadmaps;
create policy "roadmaps_insert_own" on public.roadmaps
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "roadmaps_update_own" on public.roadmaps;
create policy "roadmaps_update_own" on public.roadmaps
  for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "roadmaps_delete_own" on public.roadmaps;
create policy "roadmaps_delete_own" on public.roadmaps
  for delete to authenticated using (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- roadmap_items — visibility/writability inherited from the parent roadmap
-- -----------------------------------------------------------------------------
drop policy if exists "roadmap_items_select_visible" on public.roadmap_items;
create policy "roadmap_items_select_visible" on public.roadmap_items
  for select to authenticated
  using (
    exists (
      select 1 from public.roadmaps r
      where r.id = roadmap_id
        and (r.user_id is null or r.user_id = auth.uid())
    )
  );

drop policy if exists "roadmap_items_insert_own" on public.roadmap_items;
create policy "roadmap_items_insert_own" on public.roadmap_items
  for insert to authenticated
  with check (
    exists (
      select 1 from public.roadmaps r
      where r.id = roadmap_id and r.user_id = auth.uid()
    )
  );

drop policy if exists "roadmap_items_update_own" on public.roadmap_items;
create policy "roadmap_items_update_own" on public.roadmap_items
  for update to authenticated
  using (
    exists (
      select 1 from public.roadmaps r
      where r.id = roadmap_id and r.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.roadmaps r
      where r.id = roadmap_id and r.user_id = auth.uid()
    )
  );

drop policy if exists "roadmap_items_delete_own" on public.roadmap_items;
create policy "roadmap_items_delete_own" on public.roadmap_items
  for delete to authenticated
  using (
    exists (
      select 1 from public.roadmaps r
      where r.id = roadmap_id and r.user_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- Per-user owned tables — identical auth.uid() = user_id CRUD policies
-- -----------------------------------------------------------------------------
do $$
declare
  tbl text;
  tables text[] := array[
    'concept_notes',
    'concept_resources',
    'concept_problems',
    'roadmap_progress',
    'activity_logs',
    'study_sessions',
    'daily_logs',
    'iit_courses',
    'iit_assignments',
    'iit_lectures',
    'academic_documents',
    'ai_daily_briefs',
    'ai_insights'
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
