import {
  RefreshCw,
  Dumbbell,
  BookOpen,
  GraduationCap,
  Sparkles,
  Library,
  Target,
  FileText,
  MonitorPlay,
  Code2,
  Link2,
  BookMarked,
  Lightbulb,
  Image as ImageIcon,
  FileType2,
  AlertTriangle,
  Network,
} from "lucide-react";

import { type Category } from "./category";
import type { RiskLevel, StudentAction } from "@/lib/services";

/**
 * Domain-specific status/kind/type → {@link Category} lookup maps. These used
 * to be redeclared (often with raw hex) independently in every feature file;
 * now each one lives here once and components import the mapping + render
 * with `CATEGORY_TEXT`/`CATEGORY_TINT` from `lib/design/category.ts`.
 */

/* -------------------------------------------------------------------------- */
/* Concepts                                                                     */
/* -------------------------------------------------------------------------- */

export type ConceptStatus = "learning" | "understood" | "weak" | "forgotten" | "mastered";

export const CONCEPT_STATUS_CATEGORY: Record<ConceptStatus, Category> = {
  learning: "warning", // in progress, not yet settled
  understood: "knowledge", // grasped — knowledge domain
  weak: "critical", // needs urgent attention
  forgotten: "memory", // forgetting is literally the memory domain
  mastered: "academic", // reuse academic green as the "done well" tone
};

export const CONCEPT_STATUS_LABEL: Record<ConceptStatus, string> = {
  learning: "Learning",
  understood: "Understood",
  weak: "Weak",
  forgotten: "Forgotten",
  mastered: "Mastered",
};

/* -------------------------------------------------------------------------- */
/* IIT courses                                                                  */
/* -------------------------------------------------------------------------- */

export type IitStatus = "in_progress" | "completed" | "dropped" | "planned";

export const IIT_STATUS_CATEGORY: Record<IitStatus, Category> = {
  in_progress: "mission",
  completed: "academic",
  dropped: "critical",
  planned: "warning",
};

/* -------------------------------------------------------------------------- */
/* Roadmaps                                                                     */
/* -------------------------------------------------------------------------- */

export type RoadmapKind = "dsa" | "iit" | "custom";

export const ROADMAP_KIND_CATEGORY: Record<RoadmapKind, Category> = {
  dsa: "mission",
  iit: "academic",
  custom: "warning",
};

export const ROADMAP_KIND_LABEL: Record<RoadmapKind, string> = {
  dsa: "DSA",
  iit: "IIT",
  custom: "Custom",
};

/* -------------------------------------------------------------------------- */
/* Vault items                                                                  */
/* -------------------------------------------------------------------------- */

export type VaultItemType =
  | "note"
  | "youtube"
  | "algorithm"
  | "resource"
  | "cheatsheet"
  | "observation"
  | "lecture"
  | "image"
  | "pdf";

export const VAULT_TYPE_META: Record<
  VaultItemType,
  { label: string; icon: typeof FileText; category: Category }
> = {
  note: { label: "Note", icon: FileText, category: "knowledge" },
  youtube: { label: "YouTube", icon: MonitorPlay, category: "critical" },
  algorithm: { label: "Algorithm", icon: Code2, category: "academic" },
  resource: { label: "Resource", icon: Link2, category: "mission" },
  cheatsheet: { label: "Cheatsheet", icon: BookMarked, category: "warning" },
  observation: { label: "Observation", icon: Lightbulb, category: "consistency" },
  lecture: { label: "Lecture", icon: GraduationCap, category: "knowledge" },
  image: { label: "Image", icon: ImageIcon, category: "knowledge" },
  pdf: { label: "PDF", icon: FileType2, category: "knowledge" },
};

/* -------------------------------------------------------------------------- */
/* Difficulty                                                                   */
/* -------------------------------------------------------------------------- */

export type Difficulty = "easy" | "medium" | "hard";

export const DIFFICULTY_BADGE_VARIANT: Record<Difficulty, "success" | "warning" | "danger"> = {
  easy: "success",
  medium: "warning",
  hard: "danger",
};

/* -------------------------------------------------------------------------- */
/* Reminder / notification categories                                          */
/* -------------------------------------------------------------------------- */

export const REMINDER_CATEGORY_LABEL: Record<string, string> = {
  learning_dsa: "DSA",
  learning_revision: "Revision",
  learning_concepts: "Concepts",
  learning_roadmaps: "Roadmaps",
  academic_iit: "IIT",
  academic_assignments: "Assignments",
  academic_exams: "Exams",
  project_development: "Development",
  project_client_work: "Client Work",
  personal_priorities: "Priorities",
  personal_relationships: "Relationships",
  personal_family: "Family",
  health_sleep: "Sleep",
  health_exercise: "Exercise",
};

/* -------------------------------------------------------------------------- */
/* Focus modes                                                                  */
/* -------------------------------------------------------------------------- */

export const FOCUS_MODE_LABEL: Record<string, string> = {
  work: "Work",
  academic: "Academic",
  personal: "Personal",
  family: "Family",
  recovery: "Recovery",
  deep_focus: "Deep Focus",
  none: "All",
};

/* -------------------------------------------------------------------------- */
/* Dashboard — battle plan steps (BattlePlanStep["kind"])                      */
/* -------------------------------------------------------------------------- */

export type BattlePlanKind = "revise" | "strengthen" | "learn" | "academic";

export const BATTLE_PLAN_KIND_META: Record<
  BattlePlanKind,
  { icon: typeof RefreshCw; category: Category }
> = {
  revise: { icon: RefreshCw, category: "memory" },
  strengthen: { icon: Dumbbell, category: "warning" },
  learn: { icon: BookOpen, category: "academic" },
  academic: { icon: GraduationCap, category: "mission" },
};

/* -------------------------------------------------------------------------- */
/* Dashboard — daily session plan steps (SessionTask["type"])                 */
/* -------------------------------------------------------------------------- */

export type DailyPlanType = "revision" | "concept" | "problem" | "iit" | "roadmap";

export const DAILY_PLAN_TYPE_CATEGORY: Record<
  DailyPlanType,
  { icon: typeof RefreshCw; category: Category }
> = {
  revision: { icon: RefreshCw, category: "memory" },
  concept: { icon: Sparkles, category: "academic" },
  problem: { icon: Dumbbell, category: "warning" },
  iit: { icon: GraduationCap, category: "mission" },
  roadmap: { icon: Target, category: "consistency" },
};

/* -------------------------------------------------------------------------- */
/* Dashboard — "resume / continue learning" cards (resumeItems[number].type)  */
/* -------------------------------------------------------------------------- */

export type ResumeItemType = "revision" | "concept" | "vault" | "problem" | "iit";

export const RESUME_ITEM_META: Record<
  ResumeItemType,
  { icon: typeof RefreshCw; category: Category }
> = {
  revision: { icon: RefreshCw, category: "memory" },
  concept: { icon: Sparkles, category: "academic" },
  vault: { icon: Library, category: "warning" },
  problem: { icon: Dumbbell, category: "mission" },
  iit: { icon: GraduationCap, category: "mission" },
};

/* -------------------------------------------------------------------------- */
/* Mission Control — StudentIntelligenceCore priorities/risks                  */
/* -------------------------------------------------------------------------- */

export const STUDENT_ACTION_SOURCE_META: Record<
  StudentAction["source"],
  { icon: typeof RefreshCw; category: Category }
> = {
  revision: { icon: RefreshCw, category: "memory" },
  memory: { icon: Sparkles, category: "memory" },
  habit: { icon: AlertTriangle, category: "warning" },
  iit: { icon: GraduationCap, category: "mission" },
  taxonomy: { icon: Network, category: "knowledge" },
  knowledge: { icon: Library, category: "knowledge" },
};

export const RISK_LEVEL_META: Record<
  RiskLevel,
  { label: string; badgeVariant: "secondary" | "default" | "warning" | "danger" }
> = {
  low: { label: "Low", badgeVariant: "secondary" },
  medium: { label: "Medium", badgeVariant: "default" },
  high: { label: "High", badgeVariant: "warning" },
  critical: { label: "Critical", badgeVariant: "danger" },
};

/** Buckets a 0-100 StudentAction score into the same 4-tier vocabulary as {@link RiskLevel}. */
export function scoreToRiskLevel(score: number): RiskLevel {
  if (score >= 70) return "critical";
  if (score >= 50) return "high";
  if (score >= 30) return "medium";
  return "low";
}
