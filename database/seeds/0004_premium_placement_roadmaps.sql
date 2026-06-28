-- =============================================================================
-- Seed 0004 — Premium Placement Roadmaps
-- =============================================================================
-- Adds structured, dependency-gated placement roadmaps.
-- Tiers: Beginner, Intermediate, Advanced, FAANG, Product Companies, 
-- 30-Day Plan, 60-Day Plan, 90-Day Plan.
-- =============================================================================

-- ─── 30-Day Placement Plan ──────────────────────────────────────────────────
INSERT INTO roadmaps (id, user_id, kind, tier, title, slug, description, source_url)
VALUES (
  '30d00000-4000-a000-0000-000000000001',
  NULL,
  'placement',
  '30-Day Plan',
  '30-Day Placement Plan',
  '30-day-placement-plan',
  'A rigorous 30-day plan covering the most high-frequency patterns for urgent placement prep.',
  NULL
) ON CONFLICT (slug) WHERE user_id IS NULL AND slug IS NOT NULL DO NOTHING;

INSERT INTO roadmap_items (id, roadmap_id, parent_item_id, title, is_section, order_index, depends_on_item_id)
VALUES
  ('30d10000-4000-a000-0000-000000000001','30d00000-4000-a000-0000-000000000001',NULL,'Week 1: Arrays, Strings & Hashing', true, 1, NULL),
  ('30d10000-4000-a000-0000-000000000002','30d00000-4000-a000-0000-000000000001',NULL,'Week 2: Linked Lists, Stacks & Queues', true, 2, '30d10000-4000-a000-0000-000000000001'),
  ('30d10000-4000-a000-0000-000000000003','30d00000-4000-a000-0000-000000000001',NULL,'Week 3: Trees & Binary Search', true, 3, '30d10000-4000-a000-0000-000000000002'),
  ('30d10000-4000-a000-0000-000000000004','30d00000-4000-a000-0000-000000000001',NULL,'Week 4: Graphs & DP', true, 4, '30d10000-4000-a000-0000-000000000003')
ON CONFLICT (id) DO NOTHING;

-- Week 1 Items
INSERT INTO roadmap_items (id, roadmap_id, parent_item_id, title, is_section, order_index)
VALUES
  ('30d20000-4000-a000-0000-000000000001','30d00000-4000-a000-0000-000000000001','30d10000-4000-a000-0000-000000000001','Two Sum', false, 1),
  ('30d20000-4000-a000-0000-000000000002','30d00000-4000-a000-0000-000000000001','30d10000-4000-a000-0000-000000000001','Valid Anagram', false, 2)
ON CONFLICT (id) DO NOTHING;

-- ─── FAANG Prep ─────────────────────────────────────────────────────────────
INSERT INTO roadmaps (id, user_id, kind, tier, title, slug, description, source_url)
VALUES (
  'faad0000-4000-a000-0000-000000000001',
  NULL,
  'placement',
  'FAANG',
  'FAANG Preparation Roadmap',
  'faang-prep',
  'Advanced concepts, distributed systems overlap, and hard DP/Graph problems.',
  NULL
) ON CONFLICT (slug) WHERE user_id IS NULL AND slug IS NOT NULL DO NOTHING;

INSERT INTO roadmap_items (id, roadmap_id, parent_item_id, title, is_section, order_index, depends_on_item_id)
VALUES
  ('faad1000-4000-a000-0000-000000000001','faad0000-4000-a000-0000-000000000001',NULL,'Phase 1: Advanced Data Structures', true, 1, NULL),
  ('faad1000-4000-a000-0000-000000000002','faad0000-4000-a000-0000-000000000001',NULL,'Phase 2: Complex Graphs & DP', true, 2, 'faad1000-4000-a000-0000-000000000001'),
  ('faad1000-4000-a000-0000-000000000003','faad0000-4000-a000-0000-000000000001',NULL,'Phase 3: System Design Overlap', true, 3, 'faad1000-4000-a000-0000-000000000002')
ON CONFLICT (id) DO NOTHING;

-- Phase 1 Items
INSERT INTO roadmap_items (id, roadmap_id, parent_item_id, title, is_section, order_index)
VALUES
  ('faad2000-4000-a000-0000-000000000001','faad0000-4000-a000-0000-000000000001','faad1000-4000-a000-0000-000000000001','Segment Tree & Fenwick Tree', false, 1),
  ('faad2000-4000-a000-0000-000000000002','faad0000-4000-a000-0000-000000000001','faad1000-4000-a000-0000-000000000001','Trie Implementation', false, 2)
ON CONFLICT (id) DO NOTHING;
