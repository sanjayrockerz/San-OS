import { Dumbbell, CalendarClock, BookOpen, TrendingUp, Star } from "lucide-react";

import { Section } from "@/components/layout/page-transition";
import { StatCard } from "./stat-card";
import type { OverviewData } from "./overview-client";

/** The 5-tile stat row — every value pulled straight from existing
 * OverviewData fields, no new data sources. */
export function StatTiles({
  solvedToday,
  hero,
  dailyDigest,
  memoryHealth,
  forgettingForecast,
}: {
  solvedToday: number;
  hero: OverviewData["hero"];
  dailyDigest: OverviewData["dailyDigest"];
  memoryHealth: OverviewData["memoryHealth"];
  forgettingForecast: OverviewData["forgettingForecast"];
}) {
  const consistency = memoryHealth.overallScore;
  const consistencyNote = consistency >= 80 ? "Great!" : consistency >= 50 ? "Keep going" : "Needs attention";

  return (
    <Section>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          icon={Dumbbell}
          label="Solved Today"
          value={String(solvedToday)}
          sub={`${hero.solvedThisWeek} this week`}
          accent="#f59e0b"
        />
        <StatCard
          icon={CalendarClock}
          label="Revisions Due"
          value={String(hero.revisionDue)}
          sub={forgettingForecast.atRiskCount > 0 ? `${forgettingForecast.atRiskCount} at risk` : "On track"}
          accent="#ef4444"
        />
        <StatCard
          icon={BookOpen}
          label="Concepts Logged"
          value={String(dailyDigest.conceptsCreated)}
          sub="today"
          accent="#10b981"
        />
        <StatCard
          icon={TrendingUp}
          label="Problems Solved"
          value={String(hero.uniqueSolved)}
          sub={`+${hero.solvedThisWeek} this week`}
          accent="#6366f1"
        />
        <StatCard
          icon={Star}
          label="Consistency"
          value={`${consistency}%`}
          sub={consistencyNote}
          accent="#f97316"
        />
      </div>
    </Section>
  );
}
