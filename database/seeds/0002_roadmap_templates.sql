-- Roadmap template seeds — global (user_id NULL), applied once to the live DB.
-- Run in the Supabase SQL Editor. Safe to run multiple times (ON CONFLICT DO NOTHING).

-- ─── Striver A2Z DSA Sheet ────────────────────────────────────────────────────
INSERT INTO roadmaps (id, user_id, kind, title, slug, description, source_url)
VALUES (
  'a1000000-4000-a000-0000-000000000001',
  NULL,
  'dsa',
  'Striver A2Z DSA Sheet',
  'striver-a2z',
  'Complete DSA roadmap by Striver — covers every important topic from basics to advanced.',
  'https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/'
) ON CONFLICT (slug) WHERE user_id IS NULL AND slug IS NOT NULL DO NOTHING;

-- Striver A2Z sections
INSERT INTO roadmap_items (id, roadmap_id, parent_item_id, title, is_section, order_index)
VALUES
  ('a1010000-4000-a000-0000-000000000001','a1000000-4000-a000-0000-000000000001',NULL,'Step 1: Basics',             true,  1),
  ('a1010000-4000-a000-0000-000000000002','a1000000-4000-a000-0000-000000000001',NULL,'Step 2: Sorting',            true,  2),
  ('a1010000-4000-a000-0000-000000000003','a1000000-4000-a000-0000-000000000001',NULL,'Step 3: Arrays',             true,  3),
  ('a1010000-4000-a000-0000-000000000004','a1000000-4000-a000-0000-000000000001',NULL,'Step 4: Binary Search',      true,  4),
  ('a1010000-4000-a000-0000-000000000005','a1000000-4000-a000-0000-000000000001',NULL,'Step 5: Strings',            true,  5),
  ('a1010000-4000-a000-0000-000000000006','a1000000-4000-a000-0000-000000000001',NULL,'Step 6: Linked List',        true,  6),
  ('a1010000-4000-a000-0000-000000000007','a1000000-4000-a000-0000-000000000001',NULL,'Step 7: Recursion',          true,  7),
  ('a1010000-4000-a000-0000-000000000008','a1000000-4000-a000-0000-000000000001',NULL,'Step 8: Bit Manipulation',   true,  8),
  ('a1010000-4000-a000-0000-000000000009','a1000000-4000-a000-0000-000000000001',NULL,'Step 9: Stack & Queue',      true,  9),
  ('a1010000-4000-a000-0000-00000000000a','a1000000-4000-a000-0000-000000000001',NULL,'Step 10: Sliding Window',    true, 10),
  ('a1010000-4000-a000-0000-00000000000b','a1000000-4000-a000-0000-000000000001',NULL,'Step 11: Heaps',             true, 11),
  ('a1010000-4000-a000-0000-00000000000c','a1000000-4000-a000-0000-000000000001',NULL,'Step 12: Greedy',            true, 12),
  ('a1010000-4000-a000-0000-00000000000d','a1000000-4000-a000-0000-000000000001',NULL,'Step 13: Binary Trees',      true, 13),
  ('a1010000-4000-a000-0000-00000000000e','a1000000-4000-a000-0000-000000000001',NULL,'Step 14: BST',               true, 14),
  ('a1010000-4000-a000-0000-00000000000f','a1000000-4000-a000-0000-000000000001',NULL,'Step 15: Graphs',            true, 15),
  ('a1010000-4000-a000-0000-000000000010','a1000000-4000-a000-0000-000000000001',NULL,'Step 16: Dynamic Programming',true,16),
  ('a1010000-4000-a000-0000-000000000011','a1000000-4000-a000-0000-000000000001',NULL,'Step 17: Tries',             true, 17)
ON CONFLICT (id) DO NOTHING;

-- Step 1 items (Basics)
INSERT INTO roadmap_items (id, roadmap_id, parent_item_id, title, is_section, order_index)
VALUES
  ('a1020000-4000-a000-0000-000000000001','a1000000-4000-a000-0000-000000000001','a1010000-4000-a000-0000-000000000001','Time & Space Complexity',   false, 1),
  ('a1020000-4000-a000-0000-000000000002','a1000000-4000-a000-0000-000000000001','a1010000-4000-a000-0000-000000000001','Java / C++ STL basics',      false, 2),
  ('a1020000-4000-a000-0000-000000000003','a1000000-4000-a000-0000-000000000001','a1010000-4000-a000-0000-000000000001','Basic Math (GCD, Primes)',   false, 3),
  ('a1020000-4000-a000-0000-000000000004','a1000000-4000-a000-0000-000000000001','a1010000-4000-a000-0000-000000000001','Hashing',                    false, 4)
ON CONFLICT (id) DO NOTHING;

-- Step 3 items (Arrays)
INSERT INTO roadmap_items (id, roadmap_id, parent_item_id, title, is_section, order_index)
VALUES
  ('a1030000-4000-a000-0000-000000000001','a1000000-4000-a000-0000-000000000001','a1010000-4000-a000-0000-000000000003','Two Sum',                    false, 1),
  ('a1030000-4000-a000-0000-000000000002','a1000000-4000-a000-0000-000000000001','a1010000-4000-a000-0000-000000000003','Kadane''s Algorithm',         false, 2),
  ('a1030000-4000-a000-0000-000000000003','a1000000-4000-a000-0000-000000000001','a1010000-4000-a000-0000-000000000003','Sort 0s, 1s, 2s',            false, 3),
  ('a1030000-4000-a000-0000-000000000004','a1000000-4000-a000-0000-000000000001','a1010000-4000-a000-0000-000000000003','Stock Buy & Sell',           false, 4),
  ('a1030000-4000-a000-0000-000000000005','a1000000-4000-a000-0000-000000000001','a1010000-4000-a000-0000-000000000003','Rotate Matrix',              false, 5)
ON CONFLICT (id) DO NOTHING;

-- Step 16 items (DP)
INSERT INTO roadmap_items (id, roadmap_id, parent_item_id, title, is_section, order_index)
VALUES
  ('a1160000-4000-a000-0000-000000000001','a1000000-4000-a000-0000-000000000001','a1010000-4000-a000-0000-000000000010','1D DP: Climbing Stairs',     false, 1),
  ('a1160000-4000-a000-0000-000000000002','a1000000-4000-a000-0000-000000000001','a1010000-4000-a000-0000-000000000010','2D DP: Grid paths',          false, 2),
  ('a1160000-4000-a000-0000-000000000003','a1000000-4000-a000-0000-000000000001','a1010000-4000-a000-0000-000000000010','Knapsack Variants',          false, 3),
  ('a1160000-4000-a000-0000-000000000004','a1000000-4000-a000-0000-000000000001','a1010000-4000-a000-0000-000000000010','LCS / LIS',                  false, 4)
ON CONFLICT (id) DO NOTHING;


-- ─── Blind 75 ─────────────────────────────────────────────────────────────────
INSERT INTO roadmaps (id, user_id, kind, title, slug, description, source_url)
VALUES (
  'b7500000-4000-a000-0000-000000000001',
  NULL,
  'dsa',
  'Blind 75',
  'blind-75',
  '75 must-do LeetCode problems covering core patterns for FAANG interviews.',
  'https://leetcode.com/list/xi4ci4ig/'
) ON CONFLICT (slug) WHERE user_id IS NULL AND slug IS NOT NULL DO NOTHING;

-- Blind 75 sections
INSERT INTO roadmap_items (id, roadmap_id, parent_item_id, title, is_section, order_index)
VALUES
  ('b7510000-4000-a000-0000-000000000001','b7500000-4000-a000-0000-000000000001',NULL,'Arrays & Hashing',    true,  1),
  ('b7510000-4000-a000-0000-000000000002','b7500000-4000-a000-0000-000000000001',NULL,'Two Pointers',        true,  2),
  ('b7510000-4000-a000-0000-000000000003','b7500000-4000-a000-0000-000000000001',NULL,'Sliding Window',      true,  3),
  ('b7510000-4000-a000-0000-000000000004','b7500000-4000-a000-0000-000000000001',NULL,'Stack',               true,  4),
  ('b7510000-4000-a000-0000-000000000005','b7500000-4000-a000-0000-000000000001',NULL,'Binary Search',       true,  5),
  ('b7510000-4000-a000-0000-000000000006','b7500000-4000-a000-0000-000000000001',NULL,'Linked List',         true,  6),
  ('b7510000-4000-a000-0000-000000000007','b7500000-4000-a000-0000-000000000001',NULL,'Trees',               true,  7),
  ('b7510000-4000-a000-0000-000000000008','b7500000-4000-a000-0000-000000000001',NULL,'Heap / Priority Queue',true, 8),
  ('b7510000-4000-a000-0000-000000000009','b7500000-4000-a000-0000-000000000001',NULL,'Backtracking',        true,  9),
  ('b7510000-4000-a000-0000-000000000010','b7500000-4000-a000-0000-000000000001',NULL,'Graphs',              true, 10),
  ('b7510000-4000-a000-0000-000000000011','b7500000-4000-a000-0000-000000000001',NULL,'Dynamic Programming', true, 11),
  ('b7510000-4000-a000-0000-000000000012','b7500000-4000-a000-0000-000000000001',NULL,'Greedy',              true, 12),
  ('b7510000-4000-a000-0000-000000000013','b7500000-4000-a000-0000-000000000001',NULL,'Intervals',           true, 13),
  ('b7510000-4000-a000-0000-000000000014','b7500000-4000-a000-0000-000000000001',NULL,'Math & Geometry',     true, 14),
  ('b7510000-4000-a000-0000-000000000015','b7500000-4000-a000-0000-000000000001',NULL,'Bit Manipulation',    true, 15)
ON CONFLICT (id) DO NOTHING;

-- Arrays & Hashing items
INSERT INTO roadmap_items (id, roadmap_id, parent_item_id, title, is_section, order_index)
VALUES
  ('b7520000-4000-a000-0000-000000000001','b7500000-4000-a000-0000-000000000001','b7510000-4000-a000-0000-000000000001','Contains Duplicate',         false, 1),
  ('b7520000-4000-a000-0000-000000000002','b7500000-4000-a000-0000-000000000001','b7510000-4000-a000-0000-000000000001','Valid Anagram',               false, 2),
  ('b7520000-4000-a000-0000-000000000003','b7500000-4000-a000-0000-000000000001','b7510000-4000-a000-0000-000000000001','Two Sum',                     false, 3),
  ('b7520000-4000-a000-0000-000000000004','b7500000-4000-a000-0000-000000000001','b7510000-4000-a000-0000-000000000001','Group Anagrams',              false, 4),
  ('b7520000-4000-a000-0000-000000000005','b7500000-4000-a000-0000-000000000001','b7510000-4000-a000-0000-000000000001','Top K Frequent Elements',     false, 5),
  ('b7520000-4000-a000-0000-000000000006','b7500000-4000-a000-0000-000000000001','b7510000-4000-a000-0000-000000000001','Encode and Decode Strings',   false, 6),
  ('b7520000-4000-a000-0000-000000000007','b7500000-4000-a000-0000-000000000001','b7510000-4000-a000-0000-000000000001','Product of Array Except Self',false, 7),
  ('b7520000-4000-a000-0000-000000000008','b7500000-4000-a000-0000-000000000001','b7510000-4000-a000-0000-000000000001','Longest Consecutive Sequence',false, 8)
ON CONFLICT (id) DO NOTHING;

-- Trees items
INSERT INTO roadmap_items (id, roadmap_id, parent_item_id, title, is_section, order_index)
VALUES
  ('b7570000-4000-a000-0000-000000000001','b7500000-4000-a000-0000-000000000001','b7510000-4000-a000-0000-000000000007','Invert Binary Tree',          false, 1),
  ('b7570000-4000-a000-0000-000000000002','b7500000-4000-a000-0000-000000000001','b7510000-4000-a000-0000-000000000007','Max Depth of Binary Tree',    false, 2),
  ('b7570000-4000-a000-0000-000000000003','b7500000-4000-a000-0000-000000000001','b7510000-4000-a000-0000-000000000007','Same Tree',                   false, 3),
  ('b7570000-4000-a000-0000-000000000004','b7500000-4000-a000-0000-000000000001','b7510000-4000-a000-0000-000000000007','Binary Tree Level Order',     false, 4),
  ('b7570000-4000-a000-0000-000000000005','b7500000-4000-a000-0000-000000000001','b7510000-4000-a000-0000-000000000007','Lowest Common Ancestor of BST',false,5),
  ('b7570000-4000-a000-0000-000000000006','b7500000-4000-a000-0000-000000000001','b7510000-4000-a000-0000-000000000007','Serialize & Deserialize',     false, 6)
ON CONFLICT (id) DO NOTHING;


-- ─── NeetCode 150 ─────────────────────────────────────────────────────────────
INSERT INTO roadmaps (id, user_id, kind, title, slug, description, source_url)
VALUES (
  'c1500000-4000-a000-0000-000000000001',
  NULL,
  'dsa',
  'NeetCode 150',
  'neetcode-150',
  '150 problems with video solutions by NeetCode — structured for systematic interview prep.',
  'https://neetcode.io/practice'
) ON CONFLICT (slug) WHERE user_id IS NULL AND slug IS NOT NULL DO NOTHING;

-- NeetCode 150 sections (mirrors Blind 75 topics + extras)
INSERT INTO roadmap_items (id, roadmap_id, parent_item_id, title, is_section, order_index)
VALUES
  ('c5100000-4000-a000-0000-000000000001','c1500000-4000-a000-0000-000000000001',NULL,'Arrays & Hashing',    true,  1),
  ('c5100000-4000-a000-0000-000000000002','c1500000-4000-a000-0000-000000000001',NULL,'Two Pointers',        true,  2),
  ('c5100000-4000-a000-0000-000000000003','c1500000-4000-a000-0000-000000000001',NULL,'Sliding Window',      true,  3),
  ('c5100000-4000-a000-0000-000000000004','c1500000-4000-a000-0000-000000000001',NULL,'Stack',               true,  4),
  ('c5100000-4000-a000-0000-000000000005','c1500000-4000-a000-0000-000000000001',NULL,'Binary Search',       true,  5),
  ('c5100000-4000-a000-0000-000000000006','c1500000-4000-a000-0000-000000000001',NULL,'Linked List',         true,  6),
  ('c5100000-4000-a000-0000-000000000007','c1500000-4000-a000-0000-000000000001',NULL,'Trees',               true,  7),
  ('c5100000-4000-a000-0000-000000000008','c1500000-4000-a000-0000-000000000001',NULL,'Tries',               true,  8),
  ('c5100000-4000-a000-0000-000000000009','c1500000-4000-a000-0000-000000000001',NULL,'Heap / Priority Queue',true, 9),
  ('c5100000-4000-a000-0000-000000000010','c1500000-4000-a000-0000-000000000001',NULL,'Backtracking',        true, 10),
  ('c5100000-4000-a000-0000-000000000011','c1500000-4000-a000-0000-000000000001',NULL,'Graphs',              true, 11),
  ('c5100000-4000-a000-0000-000000000012','c1500000-4000-a000-0000-000000000001',NULL,'Advanced Graphs',     true, 12),
  ('c5100000-4000-a000-0000-000000000013','c1500000-4000-a000-0000-000000000001',NULL,'1-D DP',              true, 13),
  ('c5100000-4000-a000-0000-000000000014','c1500000-4000-a000-0000-000000000001',NULL,'2-D DP',              true, 14),
  ('c5100000-4000-a000-0000-000000000015','c1500000-4000-a000-0000-000000000001',NULL,'Greedy',              true, 15),
  ('c5100000-4000-a000-0000-000000000016','c1500000-4000-a000-0000-000000000001',NULL,'Intervals',           true, 16),
  ('c5100000-4000-a000-0000-000000000017','c1500000-4000-a000-0000-000000000001',NULL,'Math & Geometry',     true, 17),
  ('c5100000-4000-a000-0000-000000000018','c1500000-4000-a000-0000-000000000001',NULL,'Bit Manipulation',    true, 18)
ON CONFLICT (id) DO NOTHING;
