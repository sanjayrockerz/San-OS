/**
 * DSA OS — Pattern Color System
 *
 * The canonical visual language of the app. Every pattern owns a colour
 * that is reused across badges, pills, borders and charts so the user
 * builds a spatial memory of each topic.
 */

export interface Pattern {
  id: string;
  name: string;
  /** Solid accent colour (hex) */
  color: string;
  /** Tint used for translucent backgrounds (hex with alpha) */
  tint: string;
  emoji: string;
}

export const PATTERNS: Pattern[] = [
  { id: "arrays", name: "Arrays", color: "#6366f1", tint: "#6366f11f", emoji: "🔢" },
  { id: "hashmap", name: "HashMap", color: "#22c55e", tint: "#22c55e1f", emoji: "🗂️" },
  { id: "sliding-window", name: "Sliding Window", color: "#f59e0b", tint: "#f59e0b1f", emoji: "🪟" },
  { id: "two-pointers", name: "Two Pointers", color: "#06b6d4", tint: "#06b6d41f", emoji: "👉" },
  { id: "binary-search", name: "Binary Search", color: "#a855f7", tint: "#a855f71f", emoji: "🔍" },
  { id: "stack", name: "Stack", color: "#ec4899", tint: "#ec48991f", emoji: "📚" },
  { id: "linked-list", name: "Linked List", color: "#14b8a6", tint: "#14b8a61f", emoji: "🔗" },
  { id: "trees", name: "Trees", color: "#84cc16", tint: "#84cc161f", emoji: "🌳" },
  { id: "graphs", name: "Graphs", color: "#f43f5e", tint: "#f43f5e1f", emoji: "🕸️" },
  { id: "heap", name: "Heap", color: "#eab308", tint: "#eab3081f", emoji: "⛰️" },
  { id: "backtracking", name: "Backtracking", color: "#8b5cf6", tint: "#8b5cf61f", emoji: "↩️" },
  { id: "dp", name: "DP", color: "#ef4444", tint: "#ef44441f", emoji: "🧩" },
  { id: "greedy", name: "Greedy", color: "#f97316", tint: "#f973161f", emoji: "💰" },
  { id: "intervals", name: "Intervals", color: "#0ea5e9", tint: "#0ea5e91f", emoji: "📏" },
  { id: "bit-manipulation", name: "Bit Manipulation", color: "#64748b", tint: "#64748b1f", emoji: "💡" },
  { id: "math", name: "Math", color: "#10b981", tint: "#10b9811f", emoji: "➗" },
];

const PATTERN_MAP: Record<string, Pattern> = Object.fromEntries(
  PATTERNS.map((p) => [p.id, p])
);

export function getPatternById(id: string): Pattern | undefined {
  return PATTERN_MAP[id];
}

export function getPatternColor(id: string): string {
  return PATTERN_MAP[id]?.color ?? "#8a8a99";
}
