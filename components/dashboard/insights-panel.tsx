import Link from "next/link";
import { Sparkles, TrendingUp, Target, AlertTriangle, type LucideIcon } from "lucide-react";

import { Section } from "@/components/layout/page-transition";
import { Sparkline } from "@/components/charts/sparkline";
import { cn } from "@/lib/utils";
import { CATEGORY_TEXT, type Category } from "@/lib/design/category";
import type { DailyCoachBrief, RiskRegister } from "@/lib/services";

interface InsightCardData {
  key: string;
  label: string;
  category: Category;
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; href: string };
  trend: number[];
}

/** Deterministic decorative trend per card — ambient texture, not a claimed metric (no real daily history exists yet). */
function trendFor(seed: number): number[] {
  return Array.from({ length: 8 }, (_, i) => 3 + ((seed + i * 7) % 5));
}

/**
 * "Insights for You" — the home for the coach's qualitative read (strength /
 * opportunity / focus area), replacing the inline opportunity & risk
 * callouts that used to live inside Today's Focus.
 */
export function InsightsPanel({
  brief,
  risks,
}: {
  brief: DailyCoachBrief;
  risks: RiskRegister;
}) {
  const strength: InsightCardData = brief.confidence?.mostEffectiveKind
    ? {
        key: "strength",
        label: "Strength",
        category: "academic",
        icon: TrendingUp,
        title: brief.confidence.mostEffectiveKind.label,
        description: `${Math.round(brief.confidence.mostEffectiveKind.successRate * 100)}% success rate. Keep pushing!`,
        action: { label: "View Progress", href: "/analytics" },
        trend: trendFor(2),
      }
    : {
        key: "strength",
        label: "Strength",
        category: "academic",
        icon: TrendingUp,
        title: "Building Momentum",
        description: "Keep logging sessions — your confidence score unlocks after a few more.",
        trend: trendFor(2),
      };

  const opportunity: InsightCardData = brief.today.biggestOpportunity
    ? {
        key: "opportunity",
        label: "Opportunity",
        category: "warning",
        icon: Target,
        title: brief.today.biggestOpportunity.title,
        description: brief.today.insight ?? brief.today.biggestOpportunity.detail,
        action: { label: "Start Now", href: brief.today.biggestOpportunity.href },
        trend: trendFor(5),
      }
    : {
        key: "opportunity",
        label: "Opportunity",
        category: "warning",
        icon: Target,
        title: "All caught up",
        description: "No standout opportunity right now — solve something new to create one.",
        action: { label: "Browse Problems", href: "/problems" },
        trend: trendFor(5),
      };

  const topRisk = brief.today.biggestRisk ?? risks.entries[0] ?? null;
  const focusArea: InsightCardData = topRisk
    ? {
        key: "focus",
        label: "Focus Area",
        category: "mission",
        icon: AlertTriangle,
        title: topRisk.name,
        description: topRisk.reason,
        action: { label: "Review Now", href: topRisk.recommendedAction.href },
        trend: trendFor(9),
      }
    : {
        key: "focus",
        label: "Focus Area",
        category: "mission",
        icon: Sparkles,
        title: "On Track",
        description: "No risk areas flagged today.",
        trend: trendFor(9),
      };

  const cards = [strength, opportunity, focusArea];

  return (
    <Section>
      <div className="surface-card rounded-2xl p-5">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className={cn("size-4.5", CATEGORY_TEXT.mission)} />
          <h2 className="text-section">Insights for You</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.key} className="flex flex-col rounded-xl border border-border bg-card p-4">
                <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", CATEGORY_TEXT[card.category])}>
                  <Icon className="size-3.5" />
                  {card.label}
                </span>
                <p className="mt-2 text-sm font-semibold">{card.title}</p>
                <p className="mt-1 flex-1 text-xs leading-relaxed text-muted-foreground">{card.description}</p>
                {card.action && (
                  <Link
                    href={card.action.href}
                    className={cn("mt-2 inline-flex items-center gap-1 text-xs font-medium hover:underline", CATEGORY_TEXT[card.category])}
                  >
                    {card.action.label} →
                  </Link>
                )}
                <Sparkline
                  data={card.trend}
                  color={`var(--category-${card.category})`}
                  width={200}
                  height={28}
                  className="mt-3 w-full"
                />
              </div>
            );
          })}
        </div>
      </div>
    </Section>
  );
}
