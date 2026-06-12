/**
 * Static mock data for the Phase 1 visual shell.
 * No backend — every value here is hand-authored to make the UI feel alive.
 */

export type Difficulty = "Easy" | "Medium" | "Hard";

export interface ProblemMock {
  id: string;
  title: string;
  difficulty: Difficulty;
  patterns: string[];
  confidence: number;
  lastSolved: string;
  lastRevised?: string;
  timeTaken?: string;
  language?: string;
  status?: "Solved" | "Attempted" | "Review";
  notes?: string;
  mistakes?: string;
}

/* ---------- Overview / dashboard ---------- */

export const user = { name: "Sanjay", level: 8, streak: 14 };

export const readiness = {
  value: 72,
  trend: [58, 60, 59, 63, 66, 65, 68, 70, 69, 72],
  weakest: "Code Translation → Implementation",
};

export const summaryMetrics = {
  overallProgress: { value: 68, trend: [40, 46, 44, 52, 55, 60, 63, 68] },
  problemsSolved: { value: 342, trend: [180, 210, 240, 268, 290, 312, 330, 342] },
  revisionPending: { value: 23, trend: [12, 16, 14, 20, 18, 24, 21, 23] },
};

export const weeklyGoal = { done: 15, total: 21 };

export const todaysPlan = [
  { id: "1", label: "Revise Prefix Sum pattern", tag: "Revision", done: true },
  { id: "2", label: "Solve 2 HashMap mediums", tag: "Practice", done: false },
  { id: "3", label: "Watch DBMS Lecture 7", tag: "IIT", done: false },
  { id: "4", label: "Complete OS assignment", tag: "IIT", done: false },
];

export const cognitiveRadar = [
  { label: "Pattern Recog.", value: 84 },
  { label: "Algo Design", value: 71 },
  { label: "Code Translation", value: 46 },
  { label: "Edge Cases", value: 58 },
  { label: "Time Complexity", value: 67 },
  { label: "Debugging", value: 62 },
];

export const cognitiveStrengths = [
  { label: "Pattern Recognition", value: 84, color: "#34d399" },
  { label: "Algorithm Design", value: 71, color: "#7c7dff" },
  { label: "Time Complexity", value: 67, color: "#a855f7" },
  { label: "Edge-Case Handling", value: 58, color: "#06b6d4" },
  { label: "Code Translation", value: 46, color: "#fbbf24" },
];

export const performanceWeekly = [
  { label: "Mon", value: 4 },
  { label: "Tue", value: 6 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 8 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 9 },
  { label: "Sun", value: 7 },
];

export const performanceStats = [
  { label: "Focus time", value: "28.4h" },
  { label: "Avg / problem", value: "21m" },
  { label: "Consistency", value: "87%" },
];

export const dashboardStats = {
  streak: 14,
  goalDone: 3,
  goalTotal: 5,
  totalSolved: 342,
  revisionDue: 23,
};

export const revisionDue: ProblemMock[] = [
  { id: "two-sum", title: "Two Sum", difficulty: "Easy", patterns: ["hashmap"], confidence: 64, lastSolved: "6 days ago" },
  { id: "longest-substring", title: "Longest Substring Without Repeating", difficulty: "Medium", patterns: ["sliding-window", "hashmap"], confidence: 48, lastSolved: "9 days ago" },
  { id: "remove-duplicates", title: "Remove Duplicates from Sorted Array", difficulty: "Easy", patterns: ["two-pointers"], confidence: 72, lastSolved: "12 days ago" },
];

export const patternConfidence: { id: string; value: number; lastRevised: string; weakSub: string }[] = [
  { id: "arrays", value: 88, lastRevised: "2d ago", weakSub: "Kadane variants" },
  { id: "hashmap", value: 74, lastRevised: "1d ago", weakSub: "Frequency maps" },
  { id: "sliding-window", value: 52, lastRevised: "5d ago", weakSub: "Variable window" },
  { id: "two-pointers", value: 69, lastRevised: "3d ago", weakSub: "Fast/slow" },
  { id: "binary-search", value: 61, lastRevised: "4d ago", weakSub: "On answer" },
  { id: "trees", value: 58, lastRevised: "6d ago", weakSub: "BST delete" },
  { id: "graphs", value: 41, lastRevised: "8d ago", weakSub: "Topo sort" },
  { id: "dp", value: 34, lastRevised: "9d ago", weakSub: "Interval DP" },
];

export const recentActivity: { id: string; text: string; patternId: string; time: string }[] = [
  { id: "a1", text: "Solved Two Sum II", patternId: "two-pointers", time: "2h ago" },
  { id: "a2", text: "Added Prefix Sum concept note", patternId: "arrays", time: "5h ago" },
  { id: "a3", text: "Watched IIT Lecture 6 — DBMS", patternId: "math", time: "Yesterday" },
  { id: "a4", text: "Revised Sliding Window", patternId: "sliding-window", time: "Yesterday" },
  { id: "a5", text: "Solved Course Schedule", patternId: "graphs", time: "2 days ago" },
];

export const weakAreas = [
  { id: "dp", label: "Dynamic Programming", value: 34, note: "Interval & bitmask DP" },
  { id: "graphs", label: "Graphs", value: 41, note: "Topological sort" },
  { id: "sliding-window", label: "Sliding Window", value: 52, note: "Variable-size windows" },
];

export const upcomingDeadlines = [
  { id: "d1", title: "DSA Assignment 4", course: "IIT Madras", due: "Tomorrow", urgent: true },
  { id: "d2", title: "OS Quiz — Scheduling", course: "IIT Madras", due: "In 3 days", urgent: false },
  { id: "d3", title: "DBMS Project Demo", course: "IIT Madras", due: "May 30", urgent: false },
];

/* study consistency heatmap: 16 weeks * 7 days, intensity 0-4 */
export const studyHeatmap = Array.from({ length: 16 * 7 }, (_, i) => {
  const seed = (i * 2654435761) % 100;
  if (seed < 22) return 0;
  if (seed < 45) return 1;
  if (seed < 68) return 2;
  if (seed < 86) return 3;
  return 4;
});

/* ---------- Problems ---------- */

export const problems: ProblemMock[] = [
  { id: "trapping-rain-water", title: "Trapping Rain Water", difficulty: "Hard", patterns: ["two-pointers", "arrays"], confidence: 35, lastSolved: "3d ago", lastRevised: "10d ago", timeTaken: "42m", language: "C++", status: "Review", notes: "Track left/right max; area at i = min(maxL,maxR) − height[i].", mistakes: "Off-by-one on pointer convergence." },
  { id: "group-anagrams", title: "Group Anagrams", difficulty: "Medium", patterns: ["hashmap"], confidence: 71, lastSolved: "5d ago", lastRevised: "5d ago", timeTaken: "18m", language: "Python", status: "Solved", notes: "Key each word by sorted chars (or char-count tuple).", mistakes: "Used sort key when counts were faster." },
  { id: "max-subarray", title: "Maximum Subarray", difficulty: "Medium", patterns: ["dp", "arrays"], confidence: 54, lastSolved: "1w ago", lastRevised: "1w ago", timeTaken: "12m", language: "C++", status: "Solved", notes: "Kadane: cur = max(x, cur+x); best = max(best,cur).", mistakes: "Initialised best to 0 instead of -inf." },
  { id: "min-window-substring", title: "Minimum Window Substring", difficulty: "Hard", patterns: ["sliding-window", "hashmap"], confidence: 28, lastSolved: "2w ago", lastRevised: "14d ago", timeTaken: "55m", language: "Python", status: "Review", notes: "Expand right, contract left while window valid; track need count.", mistakes: "Forgot to shrink to the minimal window." },
  { id: "container-water", title: "Container With Most Water", difficulty: "Medium", patterns: ["two-pointers"], confidence: 80, lastSolved: "4d ago", lastRevised: "4d ago", timeTaken: "9m", language: "C++", status: "Solved", notes: "Move the shorter wall inward each step.", mistakes: "None — clean solve." },
];

export const problemFilters = ["All", "Easy", "Medium", "Hard", "Arrays", "HashMap", "Sliding Window", "DP"];

/* ---------- Revision ---------- */

export const revisionCard = {
  patternId: "sliding-window",
  title: "Longest Substring Without Repeating Characters",
  difficulty: "Medium" as Difficulty,
  mastery: "Reinforcing",
  algorithm: [
    "Use a sliding window with two pointers (left, right).",
    "Track last-seen index of each character in a HashMap.",
    "When a repeat is found inside the window, jump left past it.",
    "Record the max window length at every step.",
  ],
};

/* ---------- Analytics ---------- */

export const analyticsInsight =
  "You understand patterns well, but implementation speed is 1.8× slower than your average. Your weakest cognitive skill is converting a correct algorithm into working code.";

export const cognitiveScores = [
  { label: "Pattern Recognition", value: 84, color: "#34d399" },
  { label: "Algorithm Design", value: 71, color: "#7c7dff" },
  { label: "Code Translation", value: 46, color: "#fbbf24" },
  { label: "Edge-Case Handling", value: 58, color: "#06b6d4" },
  { label: "Time Complexity", value: 67, color: "#a855f7" },
];

export const solveTrend = [4, 6, 3, 8, 5, 9, 7, 11, 6, 10, 8, 12, 9, 14];

export const difficultyDistribution = [
  { label: "Easy", value: 168, color: "#34d399" },
  { label: "Medium", value: 142, color: "#fbbf24" },
  { label: "Hard", value: 32, color: "#f87171" },
];

/* ---------- Concepts ---------- */

export const concepts = [
  { id: "prefix-sum", title: "Prefix Sum", patternId: "arrays", summary: "Precompute cumulative sums for O(1) range queries.", notes: 6, problems: 12, revised: "2d ago" },
  { id: "monotonic-stack", title: "Monotonic Stack", patternId: "stack", summary: "Maintain increasing/decreasing stack for next-greater problems.", notes: 4, problems: 9, revised: "5d ago" },
  { id: "union-find", title: "Union-Find (DSU)", patternId: "graphs", summary: "Near-constant connectivity with path compression + rank.", notes: 5, problems: 7, revised: "1w ago" },
  { id: "binary-search-answer", title: "Binary Search on Answer", patternId: "binary-search", summary: "Search the answer space when monotonic feasibility holds.", notes: 3, problems: 8, revised: "3d ago" },
  { id: "topological-sort", title: "Topological Sort", patternId: "graphs", summary: "Order a DAG via Kahn's algorithm or DFS post-order.", notes: 4, problems: 6, revised: "8d ago" },
  { id: "backtracking-template", title: "Backtracking Template", patternId: "backtracking", summary: "Choose → explore → un-choose. Prune aggressively.", notes: 7, problems: 14, revised: "4d ago" },
];

/* ---------- Roadmaps ---------- */

export const roadmaps = [
  {
    id: "neetcode-150",
    title: "NeetCode 150",
    description: "The canonical interview pattern set.",
    progress: 68,
    total: 150,
    done: 102,
    color: "#7c7dff",
    stages: [
      { name: "Arrays & Hashing", done: true },
      { name: "Two Pointers", done: true },
      { name: "Sliding Window", done: true },
      { name: "Stack", done: true },
      { name: "Binary Search", done: false },
      { name: "Trees", done: false },
      { name: "Graphs", done: false },
      { name: "Dynamic Programming", done: false },
    ],
  },
  {
    id: "placement-prep",
    title: "Placement Sprint",
    description: "8-week plan toward campus placements.",
    progress: 45,
    total: 80,
    done: 36,
    color: "#34d399",
    stages: [
      { name: "Core DSA Revision", done: true },
      { name: "DBMS + OS", done: true },
      { name: "System Design Basics", done: false },
      { name: "Mock Interviews", done: false },
    ],
  },
];

/* ---------- IIT Workspace ---------- */

export const iitCourses = [
  { id: "dbms", title: "Database Management", code: "BSCS3001", progress: 72, nextItem: "Lecture 7 — Normalization", due: "Tomorrow" },
  { id: "os", title: "Operating Systems", code: "BSCS3002", progress: 58, nextItem: "Quiz — CPU Scheduling", due: "In 3 days" },
  { id: "pdsa", title: "Programming & DSA", code: "BSCS2001", progress: 84, nextItem: "Assignment 4", due: "May 30" },
];

/* ---------- Knowledge Vault ---------- */

export const vaultItems = [
  { id: "v1", title: "Sliding Window — Master Notes", type: "Note", patternId: "sliding-window", updated: "2d ago" },
  { id: "v2", title: "Graph Traversal Cheatsheet", type: "Cheatsheet", patternId: "graphs", updated: "4d ago" },
  { id: "v3", title: "DP State Design Walkthrough", type: "Note", patternId: "dp", updated: "1w ago" },
  { id: "v4", title: "Bit Tricks Collection", type: "Snippet", patternId: "bit-manipulation", updated: "1w ago" },
  { id: "v5", title: "Binary Search Templates", type: "Snippet", patternId: "binary-search", updated: "2w ago" },
  { id: "v6", title: "Tree Recursion Patterns", type: "Note", patternId: "trees", updated: "3w ago" },
];
