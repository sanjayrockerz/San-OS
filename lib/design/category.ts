/**
 * The app's seven category colors — one meaning each, backed by the
 * `--category-*` CSS variables in globals.css (registered under
 * `@theme` so Tailwind generates `text-category-*`/`bg-category-*`/
 * `border-category-*` utilities automatically). Every place that used to
 * invent its own hex tint for "what color is this thing" should resolve
 * a {@link Category} and pull classes from here instead.
 */
export type Category =
  | "memory"
  | "academic"
  | "knowledge"
  | "mission"
  | "warning"
  | "critical"
  | "consistency";

export const CATEGORY_LABEL: Record<Category, string> = {
  memory: "Memory",
  academic: "Academic",
  knowledge: "Knowledge",
  mission: "Mission",
  warning: "Warning",
  critical: "Critical",
  consistency: "Consistency",
};

/** Icon/text color for a category. */
export const CATEGORY_TEXT: Record<Category, string> = {
  memory: "text-category-memory",
  academic: "text-category-academic",
  knowledge: "text-category-knowledge",
  mission: "text-category-mission",
  warning: "text-category-warning",
  critical: "text-category-critical",
  consistency: "text-category-consistency",
};

/** Soft tinted background + matching text, for badges/icon chips. */
export const CATEGORY_TINT: Record<Category, string> = {
  memory: "bg-category-memory/12 text-category-memory",
  academic: "bg-category-academic/12 text-category-academic",
  knowledge: "bg-category-knowledge/12 text-category-knowledge",
  mission: "bg-category-mission/12 text-category-mission",
  warning: "bg-category-warning/12 text-category-warning",
  critical: "bg-category-critical/12 text-category-critical",
  consistency: "bg-category-consistency/12 text-category-consistency",
};

/** Solid (full-opacity) background for a category — e.g. a selected pill/chip. */
export const CATEGORY_BG: Record<Category, string> = {
  memory: "bg-category-memory",
  academic: "bg-category-academic",
  knowledge: "bg-category-knowledge",
  mission: "bg-category-mission",
  warning: "bg-category-warning",
  critical: "bg-category-critical",
  consistency: "bg-category-consistency",
};
