export type WidgetSize = "sm" | "md" | "lg" | "xl";

export type WidgetIconName =
  | "Target"
  | "Flame"
  | "FolderKanban"
  | "Wallet"
  | "Heart"
  | "GraduationCap"
  | "Code2"
  | "Briefcase"
  | "HeartHandshake"
  | "Lightbulb"
  | "Calendar"
  | "TrendingUp";

export interface DashboardWidget {
  id: string;
  title: string;
  icon: WidgetIconName;
  service: string;
  priority: number;
  color: string;
  gradient: string;
  darkGradient: string;
  size: WidgetSize;
  refreshRate: number;
  permissions: string[];
}

export const WIDGET_CONFIG: DashboardWidget[] = [
  {
    id: "focus",
    title: "Today's Focus",
    icon: "Target",
    service: "executionEngine",
    priority: 1,
    color: "#7c3aed",
    gradient: "linear-gradient(135deg, #8b5cf6, #c4b5fd)",
    darkGradient: "linear-gradient(135deg, #7c3aed, #a78bfa)",
    size: "md",
    refreshRate: 30000,
    permissions: [],
  },
  {
    id: "streak",
    title: "Study Streak",
    icon: "Flame",
    service: "habitEngine",
    priority: 2,
    color: "#22c55e",
    gradient: "linear-gradient(135deg, #4ade80, #a7f3d0)",
    darkGradient: "linear-gradient(135deg, #22c55e, #4ade80)",
    size: "sm",
    refreshRate: 60000,
    permissions: [],
  },
  {
    id: "projects",
    title: "Projects",
    icon: "FolderKanban",
    service: "project",
    priority: 3,
    color: "#3b82f6",
    gradient: "linear-gradient(135deg, #60a5fa, #bfdbfe)",
    darkGradient: "linear-gradient(135deg, #3b82f6, #60a5fa)",
    size: "md",
    refreshRate: 60000,
    permissions: [],
  },
  {
    id: "finance",
    title: "Finance",
    icon: "Wallet",
    service: "finance",
    priority: 4,
    color: "#f97316",
    gradient: "linear-gradient(135deg, #fb923c, #fdba74)",
    darkGradient: "linear-gradient(135deg, #f97316, #fb923c)",
    size: "sm",
    refreshRate: 60000,
    permissions: ["finance"],
  },
  {
    id: "health",
    title: "Health",
    icon: "Heart",
    service: "habitEngine",
    priority: 5,
    color: "#ec4899",
    gradient: "linear-gradient(135deg, #f472b6, #fbcfe8)",
    darkGradient: "linear-gradient(135deg, #ec4899, #f472b6)",
    size: "sm",
    refreshRate: 120000,
    permissions: [],
  },
  {
    id: "academic",
    title: "Academic",
    icon: "GraduationCap",
    service: "academicCoach",
    priority: 6,
    color: "#14b8a6",
    gradient: "linear-gradient(135deg, #2dd4bf, #99f6e4)",
    darkGradient: "linear-gradient(135deg, #14b8a6, #2dd4bf)",
    size: "md",
    refreshRate: 60000,
    permissions: [],
  },
  {
    id: "dsa",
    title: "DSA",
    icon: "Code2",
    service: "placementReadiness",
    priority: 7,
    color: "#6366f1",
    gradient: "linear-gradient(135deg, #818cf8, #c7d2fe)",
    darkGradient: "linear-gradient(135deg, #6366f1, #818cf8)",
    size: "sm",
    refreshRate: 60000,
    permissions: [],
  },
  {
    id: "business",
    title: "Business",
    icon: "Briefcase",
    service: "businessCoach",
    priority: 8,
    color: "#d97706",
    gradient: "linear-gradient(135deg, #f59e0b, #fde68a)",
    darkGradient: "linear-gradient(135deg, #d97706, #f59e0b)",
    size: "sm",
    refreshRate: 120000,
    permissions: ["business"],
  },
  {
    id: "relationships",
    title: "Relationships",
    icon: "HeartHandshake",
    service: "relationshipService",
    priority: 9,
    color: "#e11d48",
    gradient: "linear-gradient(135deg, #fb7185, #fecdd3)",
    darkGradient: "linear-gradient(135deg, #e11d48, #fb7185)",
    size: "sm",
    refreshRate: 300000,
    permissions: [],
  },
  {
    id: "knowledge",
    title: "Knowledge",
    icon: "Lightbulb",
    service: "knowledge",
    priority: 10,
    color: "#06b6d4",
    gradient: "linear-gradient(135deg, #22d3ee, #a5f3fc)",
    darkGradient: "linear-gradient(135deg, #06b6d4, #22d3ee)",
    size: "sm",
    refreshRate: 120000,
    permissions: [],
  },
  {
    id: "planner",
    title: "Planner",
    icon: "Calendar",
    service: "dailyPlanner",
    priority: 11,
    color: "#8b5cf6",
    gradient: "linear-gradient(135deg, #a78bfa, #ddd6fe)",
    darkGradient: "linear-gradient(135deg, #8b5cf6, #a78bfa)",
    size: "lg",
    refreshRate: 30000,
    permissions: [],
  },
  {
    id: "readiness",
    title: "Placement Readiness",
    icon: "TrendingUp",
    service: "placementReadiness",
    priority: 0,
    color: "#10b981",
    gradient: "linear-gradient(135deg, #34d399, #a7f3d0)",
    darkGradient: "linear-gradient(135deg, #10b981, #34d399)",
    size: "xl",
    refreshRate: 30000,
    permissions: [],
  },
];

export const MISSION_CONTROL_ORDER = [
  "readiness",
  "focus",
  "streak",
  "projects",
  "planner",
  "finance",
  "academic",
  "dsa",
  "business",
  "health",
  "knowledge",
  "relationships",
] as const;

export const WIDGET_ICON_MAP = {
  Target: "Target",
  Flame: "Flame",
  FolderKanban: "FolderKanban",
  Wallet: "Wallet",
  Heart: "Heart",
  GraduationCap: "GraduationCap",
  Code2: "Code2",
  Briefcase: "Briefcase",
  HeartHandshake: "HeartHandshake",
  Lightbulb: "Lightbulb",
  Calendar: "Calendar",
  TrendingUp: "TrendingUp",
} as const;