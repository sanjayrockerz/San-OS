-- =============================================================================
-- Migration 0020 — Roadmap dependencies + premium placement roadmaps
-- =============================================================================
-- Adds:
--   roadmap_items.depends_on_item_id — an item can require another item
--   (typically the previous phase's section) to be completed first, enabling
--   real dependency-gated progression instead of a static checklist.
--   roadmaps.tier — a free-text tier label ("Beginner", "FAANG", "30-Day
--   Plan", ...) so premium placement roadmaps can be grouped/filtered without
--   bloating the roadmap_kind enum per tier.
--   roadmap_kind gains a 'placement' member for these premium roadmaps.
-- =============================================================================

alter table public.roadmap_items
  add column if not exists depends_on_item_id uuid references public.roadmap_items (id) on delete set null;

create index if not exists roadmap_items_depends_on_item_id_idx
  on public.roadmap_items (depends_on_item_id);

alter table public.roadmaps
  add column if not exists tier text;

-- ALTER TYPE ... ADD VALUE cannot run inside a DO/PL-pgSQL block or an
-- explicit transaction, so this is a plain top-level statement; IF NOT
-- EXISTS keeps it idempotent on re-run.
alter type public.roadmap_kind add value if not exists 'placement';
