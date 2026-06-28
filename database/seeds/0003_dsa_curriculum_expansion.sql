-- =============================================================================
-- Seed 0003 — DSA curriculum expansion (Phase: DSA Module Sprint)
-- =============================================================================
-- Expands the 5 topics / 10 patterns seeded in 0001 into a full interview
-- curriculum: ~18 new top-level topics, ~90 child topics (hierarchy via
-- parent_topic_id), ~30 new patterns, and a curated catalog of real LeetCode
-- problems linked to both via topic_id/pattern_id.
--
-- Idempotent: topics/patterns use ON CONFLICT (slug) WHERE user_id IS NULL DO
-- NOTHING (same as 0001); problems use ON CONFLICT (title) WHERE user_id IS
-- NULL DO NOTHING via a partial unique index created below (the table has no
-- natural unique key for catalog rows otherwise).
--   psql "$DATABASE_URL" -f database/seeds/0003_dsa_curriculum_expansion.sql
-- =============================================================================

create unique index if not exists problems_catalog_title_uniq
  on public.problems (title)
  where user_id is null;

-- -----------------------------------------------------------------------------
-- New top-level topics
-- -----------------------------------------------------------------------------
insert into public.topics (name, slug, description, icon, color, order_index)
values
  ('Strings', 'strings', 'Character sequences; matching, palindromes, and hashing techniques.', 'Type', '#06b6d4', 6),
  ('Two Pointers', 'two-pointers', 'Two indices scanning a sequence to avoid a nested loop.', 'MoveHorizontal', '#ec4899', 7),
  ('Binary Search', 'binary-search', 'Halving a monotonic search space for O(log n) lookups.', 'Binary', '#84cc16', 8),
  ('Linked List', 'linked-list', 'Pointer-based sequences; reversal, cycle detection, merging.', 'Link', '#f97316', 9),
  ('Stack', 'stack', 'LIFO structure for nested/matching structure and monotonic scans.', 'Layers', '#6366f1', 10),
  ('Queue', 'queue', 'FIFO structure underlying BFS and sliding-window-max problems.', 'ListOrdered', '#14b8a6', 11),
  ('Trees', 'trees', 'Hierarchical structures; traversal, construction, and tree metrics.', 'TreePine', '#a855f7', 12),
  ('Binary Search Tree', 'binary-search-tree', 'Ordered binary trees; validation, lookup, and balancing.', 'GitBranch', '#eab308', 13),
  ('Trie', 'trie', 'Prefix tree for fast prefix search over strings.', 'GitFork', '#64748b', 14),
  ('Heap & Priority Queue', 'heap-priority-queue', 'Partially-ordered structure for k-th element and merge problems.', 'ArrowUpDown', '#d946ef', 15),
  ('Union Find', 'union-find', 'Disjoint Set Union for connectivity and cycle detection.', 'CircuitBoard', '#0ea5e9', 16),
  ('Greedy', 'greedy', 'Locally-optimal choices that provably yield a global optimum.', 'Gem', '#22c55e', 17),
  ('Bit Manipulation', 'bit-manipulation', 'Operating on the binary representation of numbers directly.', 'Binary', '#fb7185', 18),
  ('Backtracking', 'backtracking-topic', 'Exhaustive search with pruning over candidate solutions.', 'Undo2', '#facc15', 19),
  ('Segment Tree', 'segment-tree', 'Binary tree over ranges for fast range queries and updates.', 'Grid3x3', '#4ade80', 20),
  ('Fenwick Tree', 'fenwick-tree', 'Binary Indexed Tree for prefix-sum queries and point updates.', 'Grid2x2', '#fbbf24', 21),
  ('Math & Number Theory', 'math-number-theory', 'Primes, GCD/LCM, modular arithmetic, and combinatorics.', 'Sigma', '#3b82f6', 22),
  ('Intervals', 'intervals', 'Overlapping ranges; merging, inserting, and scheduling.', 'CalendarRange', '#10b981', 23)
on conflict (slug) where user_id is null do nothing;

-- -----------------------------------------------------------------------------
-- Child topics — Arrays (existing parent)
-- -----------------------------------------------------------------------------
insert into public.topics (name, slug, description, icon, color, order_index, parent_topic_id)
values
  ('Prefix Sum', 'prefix-sum', 'Precomputed running sums for O(1) range-sum queries.', 'Plus', '#3b82f6', 1, (select id from topics where slug = 'arrays' and user_id is null)),
  ('Kadane''s Algorithm', 'kadanes-algorithm-topic', 'Running max-subarray sum in a single linear pass.', 'TrendingUp', '#3b82f6', 2, (select id from topics where slug = 'arrays' and user_id is null)),
  ('Cyclic Sort', 'cyclic-sort-topic', 'Placing each value at its index when values are a known range.', 'RotateCw', '#3b82f6', 3, (select id from topics where slug = 'arrays' and user_id is null)),
  ('Matrix Traversal', 'matrix-traversal', 'Row/column/diagonal scans and in-place rotation of a 2D grid.', 'Grid3x3', '#3b82f6', 4, (select id from topics where slug = 'arrays' and user_id is null)),
  ('Dutch National Flag', 'dutch-national-flag', 'Three-way in-place partitioning around a pivot value.', 'Flag', '#3b82f6', 5, (select id from topics where slug = 'arrays' and user_id is null))
on conflict (slug) where user_id is null do nothing;

-- -----------------------------------------------------------------------------
-- Child topics — HashMap (existing parent)
-- -----------------------------------------------------------------------------
insert into public.topics (name, slug, description, icon, color, order_index, parent_topic_id)
values
  ('Frequency Counting', 'frequency-counting', 'Counting occurrences of elements with a hash map.', 'Hash', '#10b981', 1, (select id from topics where slug = 'hashmap' and user_id is null)),
  ('Complement Lookup', 'complement-lookup', 'Two-sum style: check for a needed complement while scanning.', 'Search', '#10b981', 2, (select id from topics where slug = 'hashmap' and user_id is null)),
  ('Grouping by Key', 'grouping-by-key', 'Bucketing items (e.g. anagrams) by a derived canonical key.', 'Boxes', '#10b981', 3, (select id from topics where slug = 'hashmap' and user_id is null))
on conflict (slug) where user_id is null do nothing;

-- -----------------------------------------------------------------------------
-- Child topics — Sliding Window (existing parent)
-- -----------------------------------------------------------------------------
insert into public.topics (name, slug, description, icon, color, order_index, parent_topic_id)
values
  ('Fixed-Size Window', 'fixed-size-window', 'Window of constant width k slides across the input.', 'PanelLeft', '#f59e0b', 1, (select id from topics where slug = 'sliding-window' and user_id is null)),
  ('Variable-Size Window', 'variable-size-window', 'Window grows/shrinks to satisfy a constraint.', 'PanelsTopLeft', '#f59e0b', 2, (select id from topics where slug = 'sliding-window' and user_id is null)),
  ('Monotonic Deque Window', 'monotonic-deque-window', 'A deque keeps the window max/min available in O(1).', 'AlignHorizontalJustifyCenter', '#f59e0b', 3, (select id from topics where slug = 'sliding-window' and user_id is null))
on conflict (slug) where user_id is null do nothing;

-- -----------------------------------------------------------------------------
-- Child topics — Dynamic Programming (existing parent)
-- -----------------------------------------------------------------------------
insert into public.topics (name, slug, description, icon, color, order_index, parent_topic_id)
values
  ('0/1 Knapsack', 'knapsack-01-topic', 'Pick items once each under a capacity constraint.', 'Backpack', '#8b5cf6', 1, (select id from topics where slug = 'dynamic-programming' and user_id is null)),
  ('Unbounded Knapsack', 'knapsack-unbounded-topic', 'Items may be picked unlimited times (coin change family).', 'Coins', '#8b5cf6', 2, (select id from topics where slug = 'dynamic-programming' and user_id is null)),
  ('Longest Increasing Subsequence', 'lis-topic', 'Longest strictly increasing subsequence of an array.', 'TrendingUp', '#8b5cf6', 3, (select id from topics where slug = 'dynamic-programming' and user_id is null)),
  ('Longest Common Subsequence', 'lcs-topic', 'Longest subsequence shared by two sequences.', 'GitCompare', '#8b5cf6', 4, (select id from topics where slug = 'dynamic-programming' and user_id is null)),
  ('Edit Distance', 'edit-distance-topic', 'Minimum insert/delete/replace operations between two strings.', 'Diff', '#8b5cf6', 5, (select id from topics where slug = 'dynamic-programming' and user_id is null)),
  ('Interval DP', 'interval-dp', 'DP over subranges, e.g. matrix chain multiplication.', 'Brackets', '#8b5cf6', 6, (select id from topics where slug = 'dynamic-programming' and user_id is null)),
  ('Digit DP', 'digit-dp-topic', 'Counting numbers in a range satisfying a digit-wise property.', 'Hash', '#8b5cf6', 7, (select id from topics where slug = 'dynamic-programming' and user_id is null)),
  ('Bitmask DP', 'bitmask-dp-topic', 'State includes a bitmask over a small set of elements.', 'Binary', '#8b5cf6', 8, (select id from topics where slug = 'dynamic-programming' and user_id is null)),
  ('Tree DP', 'tree-dp-topic', 'DP defined over subtrees, combining children''s results.', 'TreePine', '#8b5cf6', 9, (select id from topics where slug = 'dynamic-programming' and user_id is null)),
  ('DP on Subsequences', 'dp-on-subsequences', 'Counting/optimising over subsequences of a sequence.', 'ListTree', '#8b5cf6', 10, (select id from topics where slug = 'dynamic-programming' and user_id is null)),
  ('Palindrome DP', 'palindrome-dp', 'DP over substrings to test/count/build palindromes.', 'Repeat', '#8b5cf6', 11, (select id from topics where slug = 'dynamic-programming' and user_id is null))
on conflict (slug) where user_id is null do nothing;

-- -----------------------------------------------------------------------------
-- Child topics — Graphs (existing parent)
-- -----------------------------------------------------------------------------
insert into public.topics (name, slug, description, icon, color, order_index, parent_topic_id)
values
  ('Breadth-First Search', 'bfs-topic', 'Level-by-level traversal; shortest path in unweighted graphs.', 'Waves', '#ef4444', 1, (select id from topics where slug = 'graphs' and user_id is null)),
  ('Depth-First Search', 'dfs-topic', 'Explore as deep as possible before backtracking.', 'GitFork', '#ef4444', 2, (select id from topics where slug = 'graphs' and user_id is null)),
  ('Topological Sort', 'topological-sort-topic', 'Linear ordering of a DAG respecting dependency edges.', 'ListOrdered', '#ef4444', 3, (select id from topics where slug = 'graphs' and user_id is null)),
  ('Dijkstra''s Algorithm', 'dijkstra', 'Shortest paths from a source with non-negative weights.', 'Route', '#ef4444', 4, (select id from topics where slug = 'graphs' and user_id is null)),
  ('Bellman-Ford Algorithm', 'bellman-ford', 'Shortest paths tolerant of negative edge weights.', 'Route', '#ef4444', 5, (select id from topics where slug = 'graphs' and user_id is null)),
  ('Floyd-Warshall Algorithm', 'floyd-warshall', 'All-pairs shortest paths via DP over intermediate vertices.', 'Network', '#ef4444', 6, (select id from topics where slug = 'graphs' and user_id is null)),
  ('Minimum Spanning Tree', 'minimum-spanning-tree', 'Kruskal''s and Prim''s algorithms for a graph''s cheapest tree.', 'Share2', '#ef4444', 7, (select id from topics where slug = 'graphs' and user_id is null)),
  ('Bridges & Articulation Points', 'bridges-articulation-points', 'Critical edges/vertices whose removal disconnects a graph.', 'Unlink', '#ef4444', 8, (select id from topics where slug = 'graphs' and user_id is null)),
  ('Strongly Connected Components', 'strongly-connected-components', 'Maximal sets of mutually-reachable vertices (Tarjan/Kosaraju).', 'CircuitBoard', '#ef4444', 9, (select id from topics where slug = 'graphs' and user_id is null))
on conflict (slug) where user_id is null do nothing;

-- -----------------------------------------------------------------------------
-- Child topics — Strings
-- -----------------------------------------------------------------------------
insert into public.topics (name, slug, description, icon, color, order_index, parent_topic_id)
values
  ('String Matching', 'string-matching', 'Finding a pattern in text — KMP, Z-algorithm, Rabin-Karp.', 'Search', '#06b6d4', 1, (select id from topics where slug = 'strings' and user_id is null)),
  ('Palindrome Techniques', 'palindrome-techniques', 'Expand-around-center and Manacher''s for palindrome problems.', 'Repeat', '#06b6d4', 2, (select id from topics where slug = 'strings' and user_id is null)),
  ('Anagram & Permutation Techniques', 'anagram-permutation-techniques', 'Character-count comparison for anagram and permutation checks.', 'Shuffle', '#06b6d4', 3, (select id from topics where slug = 'strings' and user_id is null)),
  ('Trie-based String Problems', 'trie-based-string-problems', 'Prefix-tree solutions for word search and autocomplete.', 'GitFork', '#06b6d4', 4, (select id from topics where slug = 'strings' and user_id is null)),
  ('Rolling Hash', 'rolling-hash', 'Incrementally-updatable hash for substring comparison.', 'Hash', '#06b6d4', 5, (select id from topics where slug = 'strings' and user_id is null))
on conflict (slug) where user_id is null do nothing;

-- -----------------------------------------------------------------------------
-- Child topics — Two Pointers
-- -----------------------------------------------------------------------------
insert into public.topics (name, slug, description, icon, color, order_index, parent_topic_id)
values
  ('Opposite-Direction Pointers', 'opposite-direction-pointers', 'Pointers start at both ends and converge inward.', 'ArrowLeftRight', '#ec4899', 1, (select id from topics where slug = 'two-pointers' and user_id is null)),
  ('Same-Direction Pointers', 'same-direction-pointers', 'Both pointers advance forward at different rates/conditions.', 'MoveRight', '#ec4899', 2, (select id from topics where slug = 'two-pointers' and user_id is null)),
  ('k-Sum (Multi-Pointer)', 'k-sum-multi-pointer', 'Fix k-2 elements, two-pointer the remaining pair.', 'Plus', '#ec4899', 3, (select id from topics where slug = 'two-pointers' and user_id is null))
on conflict (slug) where user_id is null do nothing;

-- -----------------------------------------------------------------------------
-- Child topics — Binary Search
-- -----------------------------------------------------------------------------
insert into public.topics (name, slug, description, icon, color, order_index, parent_topic_id)
values
  ('Binary Search on Sorted Array', 'binary-search-sorted-array', 'Classic search for a target or insertion point.', 'Binary', '#84cc16', 1, (select id from topics where slug = 'binary-search' and user_id is null)),
  ('Binary Search on Answer', 'binary-search-on-answer', 'Search a feasibility predicate''s answer space, not an array.', 'Target', '#84cc16', 2, (select id from topics where slug = 'binary-search' and user_id is null)),
  ('Binary Search on Rotated Array', 'binary-search-rotated-array', 'Locate the pivot/target in a rotated sorted array.', 'RotateCw', '#84cc16', 3, (select id from topics where slug = 'binary-search' and user_id is null))
on conflict (slug) where user_id is null do nothing;

-- -----------------------------------------------------------------------------
-- Child topics — Linked List
-- -----------------------------------------------------------------------------
insert into public.topics (name, slug, description, icon, color, order_index, parent_topic_id)
values
  ('Reversal Techniques', 'reversal-techniques', 'Iterative/recursive reversal of a whole or partial list.', 'Undo2', '#f97316', 1, (select id from topics where slug = 'linked-list' and user_id is null)),
  ('Fast & Slow Pointers (Linked List)', 'fast-slow-linked-list', 'Cycle detection and middle-finding via Floyd''s algorithm.', 'GitCommitHorizontal', '#f97316', 2, (select id from topics where slug = 'linked-list' and user_id is null)),
  ('Merge Techniques', 'linked-list-merge-techniques', 'Merging two or k sorted lists into one.', 'Combine', '#f97316', 3, (select id from topics where slug = 'linked-list' and user_id is null)),
  ('Doubly Linked List Design', 'doubly-linked-list-design', 'Designing O(1) structures (LRU cache) atop a DLL.', 'Link2', '#f97316', 4, (select id from topics where slug = 'linked-list' and user_id is null))
on conflict (slug) where user_id is null do nothing;

-- -----------------------------------------------------------------------------
-- Child topics — Stack
-- -----------------------------------------------------------------------------
insert into public.topics (name, slug, description, icon, color, order_index, parent_topic_id)
values
  ('Monotonic Stack', 'monotonic-stack-topic', 'Stack kept increasing/decreasing for next-greater style problems.', 'BarChart3', '#6366f1', 1, (select id from topics where slug = 'stack' and user_id is null)),
  ('Expression Evaluation', 'expression-evaluation', 'Parsing and evaluating arithmetic expressions with a stack.', 'Calculator', '#6366f1', 2, (select id from topics where slug = 'stack' and user_id is null)),
  ('Next Greater/Smaller Element', 'next-greater-smaller-element', 'Find each element''s next greater/smaller using a stack.', 'ChevronsUpDown', '#6366f1', 3, (select id from topics where slug = 'stack' and user_id is null))
on conflict (slug) where user_id is null do nothing;

-- -----------------------------------------------------------------------------
-- Child topics — Queue
-- -----------------------------------------------------------------------------
insert into public.topics (name, slug, description, icon, color, order_index, parent_topic_id)
values
  ('Monotonic Deque', 'monotonic-deque-topic', 'Deque maintaining max/min over a sliding window.', 'AlignHorizontalJustifyCenter', '#14b8a6', 1, (select id from topics where slug = 'queue' and user_id is null)),
  ('Circular Queue', 'circular-queue', 'Fixed-capacity queue wrapping around a backing array.', 'RotateCw', '#14b8a6', 2, (select id from topics where slug = 'queue' and user_id is null)),
  ('BFS Level-Order Processing', 'bfs-level-order-processing', 'Processing a graph/tree one full level at a time.', 'Layers', '#14b8a6', 3, (select id from topics where slug = 'queue' and user_id is null))
on conflict (slug) where user_id is null do nothing;

-- -----------------------------------------------------------------------------
-- Child topics — Trees
-- -----------------------------------------------------------------------------
insert into public.topics (name, slug, description, icon, color, order_index, parent_topic_id)
values
  ('Tree Traversals', 'tree-traversals', 'Preorder, inorder, postorder, and level-order traversal.', 'ListTree', '#a855f7', 1, (select id from topics where slug = 'trees' and user_id is null)),
  ('Lowest Common Ancestor', 'lowest-common-ancestor', 'Deepest node that is an ancestor of two given nodes.', 'GitMerge', '#a855f7', 2, (select id from topics where slug = 'trees' and user_id is null)),
  ('Diameter of a Tree', 'diameter-of-a-tree', 'Longest path between any two nodes in a tree.', 'Ruler', '#a855f7', 3, (select id from topics where slug = 'trees' and user_id is null)),
  ('Serialize & Deserialize', 'serialize-deserialize', 'Encoding a tree to a string and rebuilding it exactly.', 'FileCode', '#a855f7', 4, (select id from topics where slug = 'trees' and user_id is null)),
  ('Tree Construction', 'tree-construction', 'Rebuilding a tree from traversal order(s).', 'Hammer', '#a855f7', 5, (select id from topics where slug = 'trees' and user_id is null))
on conflict (slug) where user_id is null do nothing;

-- -----------------------------------------------------------------------------
-- Child topics — Binary Search Tree
-- -----------------------------------------------------------------------------
insert into public.topics (name, slug, description, icon, color, order_index, parent_topic_id)
values
  ('BST Validation', 'bst-validation', 'Checking the BST invariant holds across the whole tree.', 'CheckCircle2', '#eab308', 1, (select id from topics where slug = 'binary-search-tree' and user_id is null)),
  ('BST Insertion & Deletion', 'bst-insertion-deletion', 'Maintaining the BST property while mutating the tree.', 'PlusCircle', '#eab308', 2, (select id from topics where slug = 'binary-search-tree' and user_id is null)),
  ('Kth Smallest/Largest in BST', 'kth-smallest-largest-bst', 'Order-statistics via inorder traversal of a BST.', 'ArrowUpDown', '#eab308', 3, (select id from topics where slug = 'binary-search-tree' and user_id is null)),
  ('Balanced BST', 'balanced-bst', 'Rebalancing strategies (AVL/Red-Black) for guaranteed O(log n).', 'Scale', '#eab308', 4, (select id from topics where slug = 'binary-search-tree' and user_id is null))
on conflict (slug) where user_id is null do nothing;

-- -----------------------------------------------------------------------------
-- Child topics — Trie
-- -----------------------------------------------------------------------------
insert into public.topics (name, slug, description, icon, color, order_index, parent_topic_id)
values
  ('Prefix Search', 'prefix-search', 'Checking/listing words sharing a prefix in O(prefix length).', 'Search', '#64748b', 1, (select id from topics where slug = 'trie' and user_id is null)),
  ('Wildcard Word Search', 'wildcard-word-search', 'Trie + DFS/backtracking for grid word search with wildcards.', 'Asterisk', '#64748b', 2, (select id from topics where slug = 'trie' and user_id is null)),
  ('Autocomplete Systems', 'autocomplete-systems', 'Ranking and returning suggestions for a typed prefix.', 'ListChecks', '#64748b', 3, (select id from topics where slug = 'trie' and user_id is null))
on conflict (slug) where user_id is null do nothing;

-- -----------------------------------------------------------------------------
-- Child topics — Heap & Priority Queue
-- -----------------------------------------------------------------------------
insert into public.topics (name, slug, description, icon, color, order_index, parent_topic_id)
values
  ('Kth Largest/Smallest Element', 'kth-largest-smallest-element', 'A bounded-size heap tracks the top/bottom k seen so far.', 'ArrowUpDown', '#d946ef', 1, (select id from topics where slug = 'heap-priority-queue' and user_id is null)),
  ('Merge K Sorted Lists', 'merge-k-sorted-lists', 'A min-heap of list heads merges k sorted lists efficiently.', 'Combine', '#d946ef', 2, (select id from topics where slug = 'heap-priority-queue' and user_id is null)),
  ('Top-K Frequent Elements', 'top-k-frequent-elements', 'Frequency map plus a heap to extract the k most common.', 'BarChart', '#d946ef', 3, (select id from topics where slug = 'heap-priority-queue' and user_id is null))
on conflict (slug) where user_id is null do nothing;

-- -----------------------------------------------------------------------------
-- Child topics — Union Find
-- -----------------------------------------------------------------------------
insert into public.topics (name, slug, description, icon, color, order_index, parent_topic_id)
values
  ('Union by Rank & Path Compression', 'union-by-rank-path-compression', 'The two optimisations that make DSU near O(1) amortised.', 'CircuitBoard', '#0ea5e9', 1, (select id from topics where slug = 'union-find' and user_id is null)),
  ('Cycle Detection via DSU', 'cycle-detection-dsu', 'A union that would connect two already-joined nodes is a cycle.', 'AlertTriangle', '#0ea5e9', 2, (select id from topics where slug = 'union-find' and user_id is null)),
  ('Connected Components Count', 'connected-components-count', 'Number of distinct sets after all unions are applied.', 'Boxes', '#0ea5e9', 3, (select id from topics where slug = 'union-find' and user_id is null))
on conflict (slug) where user_id is null do nothing;

-- -----------------------------------------------------------------------------
-- Child topics — Greedy
-- -----------------------------------------------------------------------------
insert into public.topics (name, slug, description, icon, color, order_index, parent_topic_id)
values
  ('Interval Scheduling', 'interval-scheduling', 'Sort by end time, greedily take the next compatible interval.', 'CalendarCheck', '#22c55e', 1, (select id from topics where slug = 'greedy' and user_id is null)),
  ('Huffman Encoding', 'huffman-encoding', 'Greedy merge of least-frequent nodes builds an optimal prefix code.', 'FileDigit', '#22c55e', 2, (select id from topics where slug = 'greedy' and user_id is null)),
  ('Jump Game / Reachability', 'jump-game-reachability', 'Greedily track the farthest index reachable so far.', 'ArrowRightCircle', '#22c55e', 3, (select id from topics where slug = 'greedy' and user_id is null))
on conflict (slug) where user_id is null do nothing;

-- -----------------------------------------------------------------------------
-- Child topics — Bit Manipulation
-- -----------------------------------------------------------------------------
insert into public.topics (name, slug, description, icon, color, order_index, parent_topic_id)
values
  ('XOR Tricks', 'xor-tricks', 'Self-cancelling XOR for single-number and pairing problems.', 'X', '#fb7185', 1, (select id from topics where slug = 'bit-manipulation' and user_id is null)),
  ('Subset Enumeration via Bitmask', 'subset-enumeration-bitmask', 'Iterate 0..2^n-1 to enumerate every subset of n elements.', 'Binary', '#fb7185', 2, (select id from topics where slug = 'bit-manipulation' and user_id is null)),
  ('Counting Bits & Bit Tricks', 'counting-bits-tricks', 'Brian Kernighan''s trick, bit shifting, and popcount patterns.', 'Hash', '#fb7185', 3, (select id from topics where slug = 'bit-manipulation' and user_id is null))
on conflict (slug) where user_id is null do nothing;

-- -----------------------------------------------------------------------------
-- Child topics — Backtracking
-- -----------------------------------------------------------------------------
insert into public.topics (name, slug, description, icon, color, order_index, parent_topic_id)
values
  ('Permutations & Combinations', 'permutations-combinations', 'Generate every ordering or every k-subset of a set.', 'Shuffle', '#facc15', 1, (select id from topics where slug = 'backtracking-topic' and user_id is null)),
  ('Subsets / Power Set', 'subsets-power-set', 'Generate every subset by including/excluding each element.', 'Boxes', '#facc15', 2, (select id from topics where slug = 'backtracking-topic' and user_id is null)),
  ('N-Queens', 'n-queens-topic', 'Place n queens on an n×n board with no two attacking.', 'Crown', '#facc15', 3, (select id from topics where slug = 'backtracking-topic' and user_id is null)),
  ('Sudoku Solver', 'sudoku-solver-topic', 'Constraint-satisfaction backtracking over a 9×9 grid.', 'Grid3x3', '#facc15', 4, (select id from topics where slug = 'backtracking-topic' and user_id is null))
on conflict (slug) where user_id is null do nothing;

-- -----------------------------------------------------------------------------
-- Child topics — Segment Tree
-- -----------------------------------------------------------------------------
insert into public.topics (name, slug, description, icon, color, order_index, parent_topic_id)
values
  ('Range Sum/Min/Max Query', 'range-sum-min-max-query', 'O(log n) range queries by combining segment results.', 'BarChart2', '#4ade80', 1, (select id from topics where slug = 'segment-tree' and user_id is null)),
  ('Lazy Propagation', 'lazy-propagation', 'Deferring range updates to children until they''re queried.', 'Clock', '#4ade80', 2, (select id from topics where slug = 'segment-tree' and user_id is null))
on conflict (slug) where user_id is null do nothing;

-- -----------------------------------------------------------------------------
-- Child topics — Fenwick Tree
-- -----------------------------------------------------------------------------
insert into public.topics (name, slug, description, icon, color, order_index, parent_topic_id)
values
  ('Point Update / Range Query (BIT)', 'point-update-range-query-bit', 'The classic Fenwick tree operation pair in O(log n) each.', 'Grid2x2', '#fbbf24', 1, (select id from topics where slug = 'fenwick-tree' and user_id is null)),
  ('2D Fenwick Tree', '2d-fenwick-tree', 'Extending BIT to 2D grids for matrix range-sum queries.', 'Grid3x3', '#fbbf24', 2, (select id from topics where slug = 'fenwick-tree' and user_id is null))
on conflict (slug) where user_id is null do nothing;

-- -----------------------------------------------------------------------------
-- Child topics — Math & Number Theory
-- -----------------------------------------------------------------------------
insert into public.topics (name, slug, description, icon, color, order_index, parent_topic_id)
values
  ('Sieve of Eratosthenes', 'sieve-of-eratosthenes-topic', 'Precomputing all primes up to n in O(n log log n).', 'Sigma', '#3b82f6', 1, (select id from topics where slug = 'math-number-theory' and user_id is null)),
  ('GCD/LCM & Modular Arithmetic', 'gcd-lcm-modular-arithmetic', 'Euclid''s algorithm and modular exponentiation/inverse.', 'Divide', '#3b82f6', 2, (select id from topics where slug = 'math-number-theory' and user_id is null)),
  ('Combinatorics (nCr)', 'combinatorics-ncr', 'Counting combinations/permutations, often modulo a prime.', 'Hash', '#3b82f6', 3, (select id from topics where slug = 'math-number-theory' and user_id is null))
on conflict (slug) where user_id is null do nothing;

-- -----------------------------------------------------------------------------
-- Child topics — Intervals
-- -----------------------------------------------------------------------------
insert into public.topics (name, slug, description, icon, color, order_index, parent_topic_id)
values
  ('Merge Intervals', 'merge-intervals-topic', 'Sort by start, merge any intervals that overlap.', 'Combine', '#10b981', 1, (select id from topics where slug = 'intervals' and user_id is null)),
  ('Insert Interval', 'insert-interval-topic', 'Insert a new interval into a sorted, non-overlapping list.', 'PlusSquare', '#10b981', 2, (select id from topics where slug = 'intervals' and user_id is null)),
  ('Meeting Rooms / Overlap Counting', 'meeting-rooms-overlap-counting', 'Counting max concurrent intervals (sweep line / heap).', 'CalendarClock', '#10b981', 3, (select id from topics where slug = 'intervals' and user_id is null))
on conflict (slug) where user_id is null do nothing;

-- -----------------------------------------------------------------------------
-- New patterns
-- -----------------------------------------------------------------------------
insert into public.patterns
  (name, slug, recognition_clues, generic_algorithm, common_mistakes, variants, description)
values
  ('Merge Intervals', 'merge-intervals',
   array['Overlapping ranges', 'Scheduling/calendar problems', 'List of [start, end] pairs'],
   'Sort intervals by start time; walk through, merging the current interval into the last kept one whenever they overlap.',
   array['Forgetting to sort first', 'Using <= vs < incorrectly at boundaries', 'Not handling fully-nested intervals'],
   array['Merge', 'Insert interval', 'Overlap counting'],
   'Sort by start, then sweep once to merge anything that overlaps.'),

  ('Cyclic Sort', 'cyclic-sort',
   array['Array contains values in a known range like 1..n', 'Find missing/duplicate number', 'Sort in O(n) without extra space'],
   'Place each value at the index it should occupy by repeatedly swapping; one pass after placement reveals missing/duplicate slots.',
   array['Infinite loop from wrong swap condition', 'Off-by-one between value and index', 'Not handling duplicates'],
   array['Find missing number', 'Find duplicate', 'Find all missing/duplicates'],
   'Index-as-destination swapping sorts a 1..n range array in O(n) time, O(1) space.'),

  ('In-place Linked List Reversal', 'in-place-linked-list-reversal',
   array['Reverse a linked list or a sublist', 'O(1) extra space required', 'Reverse in groups of k'],
   'Walk the list keeping prev/curr/next pointers; relink curr.next to prev each step, advancing all three.',
   array['Losing the head/tail reference', 'Off-by-one on the reversal boundary', 'Null pointer when list is shorter than k'],
   array['Full list', 'Sublist', 'Groups of k'],
   'Re-point next references while walking once, reversing without allocating new nodes.'),

  ('Two Heaps', 'two-heaps',
   array['Need both min and max of a dynamic set', 'Running median', 'Splitting data into two halves'],
   'Maintain a max-heap for the lower half and a min-heap for the upper half, rebalancing sizes after each insert.',
   array['Heaps drifting unbalanced', 'Wrong heap for wrong half', 'Forgetting to rebalance before reading the median'],
   array['Running median', 'Sliding window median', 'IPO/scheduling max-profit'],
   'Two heaps split a stream so the median/boundary is always at the top in O(log n) per insert.'),

  ('Subsets (Power Set)', 'subsets-pattern',
   array['Generate all subsets', 'Combinatorial enumeration', 'Each element included or excluded'],
   'Start with the empty set; for each new element, add it to every subset generated so far to double the set of subsets.',
   array['Duplicate subsets from unsorted duplicate input', 'Exponential blowup without pruning when only counting is needed'],
   array['Iterative doubling', 'Backtracking', 'Bitmask enumeration'],
   'Build every subset by deciding in/out for each element, either iteratively or via backtracking.'),

  ('Modified Binary Search', 'modified-binary-search',
   array['Sorted-ish array (rotated, nearly sorted)', 'Find boundary/peak/pivot', 'Search space is monotonic in disguise'],
   'Adapt the standard lo/hi halving by comparing extra context (e.g. mid vs ends) to decide which half retains the property you''re searching for.',
   array['Wrong comparison when array is rotated', 'Infinite loop from non-shrinking bounds', 'Mixing strict/non-strict comparisons'],
   array['Rotated array search', 'Find peak element', 'Search in infinite/unknown-size array'],
   'Binary search adapted with extra invariant checks for rotated/peak-finding problems.'),

  ('Top K Elements', 'top-k-elements',
   array['Find the k largest/smallest/most frequent', 'Don''t need full sort', 'Streaming/large input'],
   'Maintain a heap of size k; push each candidate and pop the worst whenever the heap exceeds size k.',
   array['Using a max-heap when a min-heap (or vice versa) is needed', 'Sorting the full input when only top-k matters', 'Off-by-one on heap size'],
   array['Kth largest', 'Top-k frequent', 'K closest points'],
   'A bounded heap tracks only the k best candidates seen so far in O(n log k).'),

  ('K-way Merge', 'k-way-merge',
   array['Merge k sorted lists/arrays', 'Smallest range covering elements from k lists', 'External sorting'],
   'Push the first element of each list into a min-heap; repeatedly pop the smallest, push it to output, and push the next element from its source list.',
   array['Forgetting to track which list an element came from', 'Not handling lists of unequal length', 'Heap holding values instead of (value, listIndex, elementIndex)'],
   array['Merge k sorted lists', 'Smallest range', 'K smallest pairs'],
   'A heap of k pointers merges k sorted sources in O(n log k).'),

  ('0/1 Knapsack', 'knapsack-01',
   array['Items with weight/value, pick each at most once', 'Maximize value under a capacity', 'Subset-sum family'],
   'dp[i][cap] = max(dp[i-1][cap], value[i] + dp[i-1][cap-weight[i]]) if it fits; iterate items outer, capacity inner (descending if space-optimised to 1D).',
   array['Iterating capacity ascending in the 1-D version (double-counts items)', 'Off-by-one on capacity bounds', 'Confusing with unbounded knapsack'],
   array['Subset sum', 'Partition equal subset sum', 'Target sum'],
   'Each item is taken 0 or 1 times; DP over (item, remaining capacity).'),

  ('Unbounded Knapsack', 'knapsack-unbounded',
   array['Items can be reused unlimited times', 'Coin change / minimum coins', 'Combination sum with repetition'],
   'dp[cap] = best over all items of value[i] + dp[cap-weight[i]]; iterate capacity ascending so reuse within the same pass is allowed.',
   array['Iterating capacity descending (prevents reuse, turns it into 0/1)', 'Not initialising the base case dp[0] correctly'],
   array['Coin change (min coins)', 'Coin change II (count ways)', 'Rod cutting'],
   'Items may repeat; DP over capacity alone, ascending, lets reuse happen naturally.'),

  ('Longest Common Subsequence', 'longest-common-subsequence',
   array['Two sequences, find shared subsequence', 'Edit distance family', 'Diff/merge tooling'],
   'dp[i][j] = dp[i-1][j-1]+1 if chars match, else max(dp[i-1][j], dp[i][j-1]); fill the 2D table in row-major order.',
   array['Confusing subsequence with substring', 'Off-by-one indexing into the strings vs the DP table', 'Not reconstructing the path correctly when asked for the actual subsequence'],
   array['LCS length', 'LCS reconstruction', 'Shortest common supersequence'],
   'Classic 2D DP comparing two sequences character by character.'),

  ('Longest Increasing Subsequence', 'longest-increasing-subsequence',
   array['Longest strictly increasing subsequence', 'Patience sorting', 'O(n log n) optimisation expected'],
   'Maintain an array of smallest tail values for increasing subsequences of each length; binary-search each new element''s position to extend or replace a tail.',
   array['Confusing the tails array with the actual LIS', 'O(n^2) DP when O(n log n) is required', 'Off-by-one in the binary search insertion point'],
   array['LIS length (O(n log n))', 'LIS O(n^2) DP', 'Longest chain / box stacking'],
   'Binary search over tail values gives O(n log n) instead of the naive O(n^2) DP.'),

  ('Palindromic Subsequence', 'palindromic-subsequence',
   array['Longest/shortest palindromic substring or subsequence', 'Minimum insertions/deletions to make a palindrome'],
   'Expand-around-center for substrings in O(n^2), or 2D interval DP (dp[i][j] from dp[i+1][j-1]) for subsequence variants.',
   array['Using substring techniques for subsequence problems (they are not interchangeable)', 'Off-by-one on interval bounds', 'Forgetting even-length centers'],
   array['Longest palindromic substring', 'Longest palindromic subsequence', 'Palindrome partitioning'],
   'Symmetric structure lets you build outward from centers or fill an interval DP table.'),

  ('Multi-source BFS (Islands/Matrix)', 'multisource-bfs-islands',
   array['Grid/matrix with multiple starting cells', 'Flood fill / number of islands', 'Rotting oranges style spreading'],
   'Enqueue every source cell at once; run standard BFS so all sources expand simultaneously, tracking distance/visited per cell.',
   array['Enqueuing sources one at a time instead of all together', 'Not marking visited before enqueueing neighbours', 'Off-grid index errors'],
   array['Number of islands', 'Rotting oranges', '01 matrix distance'],
   'Seeding a BFS queue with every source cell lets distances spread from all of them in lockstep.'),

  ('Trie', 'trie-pattern',
   array['Prefix-based lookup over many strings', 'Autocomplete', 'Word search with multiple target words'],
   'Each node holds children keyed by character and an end-of-word flag; insert/search walk character by character, creating/visiting child nodes.',
   array['Not marking end-of-word, breaking prefix-vs-whole-word checks', 'Memory blowup from over-allocating children arrays', 'Forgetting to handle the empty string'],
   array['Standard trie', 'Trie + DFS (word search II)', 'Compressed/radix trie'],
   'A 26(or more)-way tree keyed by character gives O(length) prefix operations.'),

  ('Union Find', 'union-find-pattern',
   array['Group elements into connected sets', 'Detect a cycle while adding edges', 'Count connected components dynamically'],
   'Maintain a parent array; find() follows parents to the root (with path compression), union() links two roots (by rank/size).',
   array['Omitting path compression or union by rank (degrades to O(n) per op)', 'Union-ing without checking they''re already connected', 'Off-by-one in 0- vs 1-indexed nodes'],
   array['Path compression', 'Union by rank', 'Weighted/union with size'],
   'Near-O(1) amortised connectivity queries via a forest of parent pointers.'),

  ('Bitwise XOR', 'bitwise-xor',
   array['Find the single/odd-occurring number', 'Pairing elements that cancel out', 'Missing number without extra space'],
   'XOR every element together; values appearing an even number of times cancel to 0, leaving only the odd-one-out.',
   array['Assuming XOR works when multiple unpaired values exist (needs bit-grouping tricks)', 'Confusing XOR with addition for missing-number variants'],
   array['Single number', 'Single number II/III', 'Missing number via XOR with range'],
   'XOR''s self-cancelling property isolates an unpaired value in O(n) time, O(1) space.'),

  ('Monotonic Stack', 'monotonic-stack',
   array['Next/previous greater or smaller element', 'Largest rectangle in histogram', 'Stock span style problems'],
   'Push indices/values while maintaining a monotonic order; pop while the new element breaks monotonicity, resolving answers for popped elements.',
   array['Storing values instead of indices when distance/index is needed', 'Wrong monotonic direction for the problem', 'Not draining the stack at the end'],
   array['Next greater element', 'Largest rectangle in histogram', 'Daily temperatures'],
   'A stack kept strictly increasing/decreasing resolves "next greater/smaller" queries in one O(n) pass.'),

  ('Sliding Window Maximum', 'sliding-window-maximum',
   array['Max/min over every window of size k', 'Need O(n) not O(nk)'],
   'Maintain a deque of indices in decreasing value order; pop from the back when a new element is bigger, pop from the front when it falls outside the window.',
   array['Using a heap (O(n log k)) when a deque gives O(n)', 'Forgetting to evict indices that slid out of the window', 'Storing values instead of indices'],
   array['Sliding window maximum', 'Sliding window minimum', 'Shortest subarray with max-min constraint'],
   'A monotonic deque of indices gives the window extremum in amortised O(1) per slide.'),

  ('Greedy Interval Scheduling', 'greedy-interval-scheduling',
   array['Maximise non-overlapping intervals', 'Minimum platforms/rooms', 'Activity selection'],
   'Sort by end time; greedily select the next interval whose start is after the last selected interval''s end.',
   array['Sorting by start time instead of end time', 'Not proving the greedy choice is safe before applying it', 'Off-by-one at exact-touching boundaries'],
   array['Activity selection', 'Non-overlapping intervals', 'Minimum arrows to burst balloons'],
   'Sorting by end time and taking greedily is provably optimal for interval scheduling.'),

  ('Prefix Sum', 'prefix-sum-pattern',
   array['Repeated range-sum queries', 'Subarray sum equals k', 'Need O(1) range sum after O(n) preprocessing'],
   'Build prefix[i] = sum of first i elements; range sum (l, r) = prefix[r+1] - prefix[l]. Pair with a hash map for "subarray sum equals k" counting.',
   array['Off-by-one between inclusive/exclusive prefix indices', 'Recomputing sums in a loop instead of using the prefix array', 'Forgetting prefix[0] = 0 base case'],
   array['Range sum query', 'Subarray sum equals k (with hashmap)', '2D prefix sum'],
   'Precompute cumulative sums once to answer any range-sum query in O(1).'),

  ('Kadane''s Algorithm', 'kadanes-algorithm',
   array['Maximum subarray sum', 'Maximum product subarray (variant)', 'Best single contiguous run'],
   'Track the best sum ending at the current index (reset to 0 if negative) and the best seen overall, updating both in one pass.',
   array['Resetting to 0 when negative numbers should sometimes still be carried (e.g. product variant needs min tracking too)', 'Returning 0 for an all-negative array instead of the least-negative element'],
   array['Maximum subarray sum', 'Maximum product subarray', 'Maximum circular subarray sum'],
   'A single running "best ending here" value finds the maximum-sum contiguous run in O(n).'),

  ('KMP String Matching', 'kmp-string-matching',
   array['Find all occurrences of a pattern in text', 'Need better than O(n*m) naive matching'],
   'Precompute the pattern''s longest-prefix-suffix (failure) function; on a mismatch, jump using the failure function instead of restarting from scratch.',
   array['Off-by-one in the failure function construction', 'Re-scanning text on every mismatch (defeats the purpose)', 'Forgetting failure[0] = 0'],
   array['KMP matching', 'Z-algorithm', 'Rabin-Karp rolling hash'],
   'The failure function lets pattern matching skip redundant comparisons, achieving O(n+m).'),

  ('Segment Tree / Range Query', 'segment-tree-pattern',
   array['Range sum/min/max query with point or range updates', 'Need O(log n) per query/update, not O(n)'],
   'Build a binary tree over the array where each node stores an aggregate of its range; query/update by recursing into the relevant half(s).',
   array['Off-by-one between inclusive/exclusive range bounds', 'Forgetting to propagate lazy updates before reading a node', 'Building with the wrong combine function for the target query'],
   array['Range sum segment tree', 'Range min/max segment tree', 'Lazy propagation for range updates'],
   'A balanced tree of range aggregates answers range queries and updates in O(log n).'),

  ('Bitmask DP', 'bitmask-dp',
   array['Small set (n <= ~20) where state is "which subset is used"', 'Traveling salesman style problems', 'Assignment problems'],
   'State is (mask, extra); transition by trying to add one more unset bit to the mask and recursing/memoising on the new state.',
   array['n too large for 2^n states to be feasible', 'Forgetting to memoise, causing exponential blowup', 'Off-by-one between bit index and array index'],
   array['Traveling salesman (DP+bitmask)', 'Minimum cost to connect all points', 'Assignment problem'],
   'Encode "which elements are used" as bits so DP state fits a small set exactly.'),

  ('Tree DP', 'tree-dp',
   array['Optimise/count something defined recursively over a tree''s subtrees', 'Diameter, max independent set on a tree'],
   'DFS the tree; at each node, combine the DP results of its children (often two cases: node included or excluded) into the node''s own result.',
   array['Double-counting a node''s contribution in both parent and child results', 'Not handling leaf base cases explicitly', 'Stack overflow on deep unbalanced trees from recursion'],
   array['Tree diameter', 'Maximum path sum', 'House robber III (max independent set)'],
   'Post-order DFS lets each node combine its children''s already-solved subproblems.'),

  ('Digit DP', 'digit-dp',
   array['Count numbers in [0, N] with a digit-wise property', 'Numbers too large to enumerate directly'],
   'DP over (position, tight-bound flag, extra state) processing digits left to right, branching on whether the prefix still matches N''s prefix exactly.',
   array['Forgetting the "tight" flag, over/under-counting numbers near the bound', 'Not handling leading zeros correctly', 'State space too large from unnecessary extra dimensions'],
   array['Count numbers with digit sum constraint', 'Count numbers without a given digit', 'Numbers divisible by k with digit constraints'],
   'Process digits one at a time with a tight-bound flag to count constrained numbers without enumeration.'),

  ('Meet in the Middle', 'meet-in-the-middle',
   array['n too large for 2^n but small enough for 2^(n/2)', 'Subset sum / partition with n up to ~40'],
   'Split the input in half, enumerate all subset results for each half separately, then combine (often via sorting + binary search or a hash set).',
   array['Not realising 2^(n/2) is dramatically smaller than 2^n', 'Combining halves with an O(n^2) join when sorting+binary search gives O(n log n)'],
   array['Subset sum with large n', 'Closest subset sum to target', 'Counting subset XOR/sum combinations'],
   'Halving the search space turns an infeasible 2^n into a feasible 2*2^(n/2).'),

  ('Binary Search on Answer', 'binary-search-on-answer',
   array['"Minimise the maximum" / "maximise the minimum" phrasing', 'A feasibility check is monotonic in the answer'],
   'Binary search over the range of possible answers; for each candidate, run an O(n) feasibility check to decide which half of the range to keep.',
   array['Feasibility check not actually monotonic (binary search is invalid)', 'Off-by-one on whether the boundary candidate itself is feasible', 'O(n log n) feasibility check making the whole approach too slow'],
   array['Minimise max workload (split array)', 'Capacity to ship packages in D days', 'Aggressive cows / minimum max distance'],
   'When "can we achieve answer <= x?" is monotonic in x, binary search the answer directly.'),

  ('Sieve of Eratosthenes', 'sieve-of-eratosthenes',
   array['Need all primes up to n', 'Multiple primality queries up to the same bound'],
   'Mark a boolean array true; for each prime p starting at 2, mark all multiples of p as composite, skipping ahead by p each time.',
   array['Re-checking primality from scratch per query instead of precomputing once', 'Starting the inner marking loop at 2*p instead of p*p (correct either way, but p*p is the efficient choice)', 'Off-by-one on the array size (n+1 needed for inclusive n)'],
   array['Standard sieve', 'Segmented sieve (large n)', 'Smallest prime factor sieve'],
   'Marking composites in O(n log log n) precomputes primality for every number up to n at once.')
on conflict (slug) where user_id is null do nothing;
