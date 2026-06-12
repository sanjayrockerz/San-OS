-- =============================================================================
-- Seed 0001 — Global topics and patterns
-- =============================================================================
-- Idempotent (ON CONFLICT (slug) DO NOTHING). Run with the service role, which
-- bypasses RLS, since these global rows have no owner.
--   psql "$DATABASE_URL" -f database/seeds/0001_seed_topics_and_patterns.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Topics
-- -----------------------------------------------------------------------------
insert into public.topics (name, slug, description, icon, color, order_index)
values
  ('Arrays', 'arrays',
   'Contiguous in-memory sequences; indexing, two-pointer and prefix techniques.',
   'Brackets', '#3b82f6', 1),
  ('HashMap', 'hashmap',
   'Hash-based key/value lookups for O(1) membership and frequency counting.',
   'Hash', '#10b981', 2),
  ('Sliding Window', 'sliding-window',
   'Maintaining a moving sub-range to solve subarray/substring problems.',
   'PanelsTopLeft', '#f59e0b', 3),
  ('Dynamic Programming', 'dynamic-programming',
   'Optimal substructure and overlapping subproblems via memoisation/tabulation.',
   'Network', '#8b5cf6', 4),
  ('Graphs', 'graphs',
   'Vertices and edges; traversal, shortest paths, and connectivity.',
   'Share2', '#ef4444', 5)
on conflict (slug) do nothing;

-- -----------------------------------------------------------------------------
-- Patterns
-- -----------------------------------------------------------------------------
insert into public.patterns
  (name, slug, recognition_clues, generic_algorithm, common_mistakes, variants, description)
values
  ('Two Pointers', 'two-pointers',
   array['Sorted array or pair/triplet search', 'Comparing elements from both ends', 'In-place partitioning'],
   'Place pointers at strategic positions (ends or slow/fast) and move them inward/forward based on a comparison until they meet or the condition is satisfied.',
   array['Forgetting to skip duplicates', 'Wrong pointer-movement condition', 'Off-by-one at the boundaries'],
   array['Opposite ends', 'Fast & slow', 'Same-direction'],
   'Use two indices to scan a sequence in O(n) instead of a nested O(n^2) loop.'),

  ('Sliding Window', 'sliding-window-pattern',
   array['Longest/shortest contiguous subarray or substring', 'Constraint on a window (sum, distinct count)', 'Optimising over all subarrays of size k'],
   'Expand the window by advancing the right edge; when the window violates the constraint, shrink from the left. Track the best window seen.',
   array['Shrinking with if instead of while', 'Not updating the answer at the right moment', 'Mishandling fixed vs variable window size'],
   array['Fixed size', 'Variable size', 'Monotonic deque window'],
   'Maintain a moving range over the data to avoid recomputing overlapping work.'),

  ('Fast & Slow Pointers', 'fast-slow-pointers',
   array['Cycle detection', 'Finding the middle of a linked list', 'Linked list / sequence with a loop'],
   'Advance one pointer by one step and another by two; their meeting (or the fast pointer reaching the end) reveals cycles or the midpoint.',
   array['Null-dereferencing the fast pointer', 'Wrong loop termination', 'Confusing cycle start with meeting point'],
   array['Floyd''s cycle detection', 'Midpoint finding', 'Happy number'],
   'Two pointers at different speeds detect cycles and midpoints in O(1) space.'),

  ('Binary Search', 'binary-search',
   array['Sorted input', 'Monotonic predicate', 'Search space can be halved', '"Minimise/maximise" with a feasibility check'],
   'Maintain lo/hi bounds; repeatedly test the midpoint and discard the half that cannot contain the answer until the bounds converge.',
   array['Overflow in mid computation', 'Infinite loop from wrong bound update', 'Incorrect lo<=hi vs lo<hi condition'],
   array['On index', 'On answer space', 'Lower/upper bound'],
   'Halve the search space each step for O(log n) lookups over a monotonic domain.'),

  ('Breadth-First Search', 'bfs',
   array['Shortest path in an unweighted graph', 'Level-order traversal', 'Spreading/flood from sources'],
   'Push start node(s) into a queue; repeatedly dequeue, visit unseen neighbours, and enqueue them, tracking visited and distance per level.',
   array['Not marking visited on enqueue', 'Revisiting nodes', 'Forgetting multi-source initialisation'],
   array['Single-source', 'Multi-source', 'Grid BFS', '0-1 BFS'],
   'Explore a graph level by level using a queue; finds shortest unweighted paths.'),

  ('Depth-First Search', 'dfs',
   array['Connected components', 'Path/exhaustive exploration', 'Tree/graph traversal', 'Topological ordering'],
   'Recurse (or use an explicit stack) into an unvisited neighbour, fully exploring that branch before backtracking, marking visited to avoid cycles.',
   array['Missing visited set causing infinite recursion', 'Stack overflow on deep graphs', 'Mutating shared state without undo'],
   array['Recursive', 'Iterative stack', 'Grid DFS', 'Cycle detection'],
   'Explore as deep as possible before backtracking; underpins many graph algorithms.'),

  ('Dynamic Programming', 'dynamic-programming-pattern',
   array['Optimal substructure', 'Overlapping subproblems', 'Count/min/max over choices', 'Exponential brute force that repeats work'],
   'Define the state and recurrence, establish base cases, then fill memo/table in dependency order; optionally compress dimensions.',
   array['Wrong state definition', 'Incorrect transition or base case', 'Iterating in the wrong order'],
   array['1-D', '2-D', 'Knapsack', 'Interval DP', 'Bitmask DP'],
   'Break a problem into reusable subproblems and cache their results.'),

  ('Backtracking', 'backtracking',
   array['Generate all combinations/permutations/subsets', 'Constraint satisfaction', '"All valid configurations"'],
   'Make a choice, recurse, then undo the choice; prune branches that cannot lead to a valid/optimal solution.',
   array['Forgetting to undo state', 'Missing pruning leading to TLE', 'Duplicate results from unsorted input'],
   array['Subsets', 'Permutations', 'Combination sum', 'N-Queens'],
   'Systematically explore candidate solutions, abandoning partial ones that fail.'),

  ('Hashing / Frequency Map', 'hashing',
   array['Membership or duplicate checks', 'Counting occurrences', 'Grouping by a key', 'Complement lookups (two-sum style)'],
   'Build a hash map keyed by the relevant attribute; query/update it in O(1) while scanning the input once.',
   array['Hash collisions with mutable keys', 'Counting off-by-one', 'Iterating a map while mutating it'],
   array['Frequency count', 'Seen-set', 'Group-by', 'Prefix-sum + map'],
   'Trade space for time using a hash map to get O(1) lookups and counts.'),

  ('Topological Sort', 'topological-sort',
   array['Dependency/ordering constraints', 'Directed acyclic graph', 'Course-schedule style problems'],
   'Compute in-degrees and repeatedly emit zero-in-degree nodes (Kahn''s), or DFS and push nodes on completion; a leftover cycle means no ordering.',
   array['Not detecting cycles', 'Wrong in-degree bookkeeping', 'Assuming a unique ordering'],
   array['Kahn''s (BFS)', 'DFS post-order'],
   'Order the vertices of a DAG so every edge points forward.')
on conflict (slug) do nothing;
