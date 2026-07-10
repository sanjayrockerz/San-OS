export type TimeOfDay = "morning" | "afternoon" | "evening" | "night";

export interface HeroTheme {
  timeOfDay: TimeOfDay;
  greeting: string;
  gradient: string;
  backgroundGradient: string;
  accentColor: string;
  accentGradient: string;
  skyColor: string;
  sunMoonColor: string;
  mountainColor: string;
  particleColor: string;
  textColor: string;
  mutedTextColor: string;
  illustration: string;
  isDark: boolean;
}

function getTimeOfDay(hour: number): TimeOfDay {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 20) return "evening";
  return "night";
}

const THEMES: Record<TimeOfDay, Omit<HeroTheme, "timeOfDay" | "greeting">> = {
  morning: {
    gradient: "from-orange-400/20 via-amber-300/10 to-purple-400/20",
    backgroundGradient:
      "linear-gradient(170deg, rgba(251,146,60,0.12) 0%, rgba(168,85,247,0.08) 40%, rgba(251,191,36,0.05) 100%)",
    accentColor: "#f97316",
    accentGradient: "linear-gradient(135deg, #f97316, #d946ef)",
    skyColor: "#fef3c7",
    sunMoonColor: "#fb923c",
    mountainColor: "rgba(251,146,60,0.15)",
    particleColor: "rgba(251,146,60,0.4)",
    textColor: "#1c1917",
    mutedTextColor: "#78716c",
    illustration: "morning",
    isDark: false,
  },
  afternoon: {
    gradient: "from-sky-400/15 via-blue-300/10 to-white/5",
    backgroundGradient:
      "linear-gradient(170deg, rgba(56,189,248,0.1) 0%, rgba(147,197,253,0.06) 50%)",
    accentColor: "#0ea5e9",
    accentGradient: "linear-gradient(135deg, #0ea5e9, #6366f1)",
    skyColor: "#e0f2fe",
    sunMoonColor: "#facc15",
    mountainColor: "rgba(56,189,248,0.12)",
    particleColor: "rgba(56,189,248,0.3)",
    textColor: "#0c0a09",
    mutedTextColor: "#6b7280",
    illustration: "afternoon",
    isDark: false,
  },
  evening: {
    gradient: "from-orange-500/20 via-pink-500/15 to-purple-600/20",
    backgroundGradient:
      "linear-gradient(170deg, rgba(249,115,22,0.15) 0%, rgba(219,39,119,0.1) 50%, rgba(147,51,234,0.12) 100%)",
    accentColor: "#e11d48",
    accentGradient: "linear-gradient(135deg, #f97316, #e11d48)",
    skyColor: "#fecdd3",
    sunMoonColor: "#fb923c",
    mountainColor: "rgba(236,72,153,0.12)",
    particleColor: "rgba(236,72,153,0.3)",
    textColor: "#1c1917",
    mutedTextColor: "#78716c",
    illustration: "evening",
    isDark: false,
  },
  night: {
    gradient: "from-indigo-950 via-slate-900 to-purple-950",
    backgroundGradient:
      "linear-gradient(170deg, rgba(30,27,75,0.95) 0%, rgba(15,23,42,0.98) 50%, rgba(88,28,135,0.9) 100%)",
    accentColor: "#818cf8",
    accentGradient: "linear-gradient(135deg, #818cf8, #c084fc)",
    skyColor: "#1e1b4b",
    sunMoonColor: "#fef08a",
    mountainColor: "rgba(129,140,248,0.1)",
    particleColor: "rgba(255,255,255,0.6)",
    textColor: "#fafafa",
    mutedTextColor: "#a1a1aa",
    illustration: "night",
    isDark: true,
  },
};

function greetingFor(name: string, hour: number, yesterdayCompleted: number, firstPriority?: string): string {
  const timeOfDay = getTimeOfDay(hour);
  const base = timeOfDay === "morning" ? "Good morning" : timeOfDay === "afternoon" ? "Good afternoon" : timeOfDay === "evening" ? "Good evening" : "Good night";
  const priorityLine = firstPriority ? ` Today's first win: ${firstPriority}.` : "";

  if (hour >= 5 && hour < 12) {
    return `${base}, ${name}. ${yesterdayCompleted > 0 ? `Yesterday you completed ${yesterdayCompleted} tasks.` : "Fresh day ahead."}${priorityLine} Let's build momentum.`;
  }
  if (hour >= 12 && hour < 17) {
    return `${base}, ${name}.${priorityLine || " Stay focused on the main objective."}`;
  }
  if (hour >= 17 && hour < 21) {
    return `${base}, ${name}. ${yesterdayCompleted > 0 ? "You still have enough time to finish what matters." : "Wind down with intention."}${priorityLine}`;
  }
  return `${base}, ${name}. ${priorityLine ? `Prep for ${firstPriority} tomorrow and rest well.` : "Rest up — tomorrow is a new opportunity."}`;
}

export function getHeroTheme(name: string, hour: number, yesterdayCompleted: number, firstPriority?: string): HeroTheme {
  const timeOfDay = getTimeOfDay(hour);
  const base = THEMES[timeOfDay];
  const greeting = greetingFor(name, hour, yesterdayCompleted, firstPriority);

  return {
    timeOfDay,
    greeting,
    ...base,
  };
}

export { getTimeOfDay, THEMES, greetingFor };