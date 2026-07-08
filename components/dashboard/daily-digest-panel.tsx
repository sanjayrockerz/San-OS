import Link from "next/link";
import {
  Dumbbell,
  RefreshCw,
  Sparkles,
  Library,
  GraduationCap,
} from "lucide-react";

import { Section } from "@/components/layout/page-transition";
import { SectionHeading } from "@/components/layout/page-header";

import type { OverviewData } from "./overview-client";

type DailyDigestData = OverviewData["dailyDigest"];

export function DailyDigestPanel({
  data,
  milestone,
  toMilestone,
  className,
}: {
  data: DailyDigestData;
  milestone?: number;
  toMilestone?: number;
  className?: string;
}) {
  const hasActivity =
    data.problemsSolved > 0 ||
    data.revisionsCompleted > 0 ||
    data.conceptsCreated > 0 ||
    data.knowledgeAdded > 0 ||
    data.iitCompleted > 0;

  if (!hasActivity) return null;

  return (
    <Section className={className}>
      <div className="surface-card h-full rounded-xl p-4 border border-primary/20 bg-primary/5">
        <SectionHeading
          title="Today's Summary"
          action={
            <Link
              href="/timeline"
              className="text-xs font-medium text-primary hover:underline"
            >
              Timeline
            </Link>
          }
        />

        {data.observation && (
          <p className="mb-3 text-xs leading-relaxed text-foreground font-medium border-l-2 border-primary pl-3">
            {data.observation}
          </p>
        )}
        {milestone !== undefined && toMilestone !== undefined && toMilestone > 0 && (
          <p className="mb-3 text-xs text-muted-foreground">
            {toMilestone} more to your next milestone ({milestone} solved).
          </p>
        )}

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
          <MetricCard
            icon={Dumbbell}
            value={data.problemsSolved}
            label="Solved"
            color="text-amber-500"
          />
          <MetricCard
            icon={RefreshCw}
            value={data.revisionsCompleted}
            label="Revisions"
            color="text-blue-500"
          />
          <MetricCard
            icon={Sparkles}
            value={data.conceptsCreated}
            label="Concepts"
            color="text-emerald-500"
          />
          <MetricCard
            icon={Library}
            value={data.knowledgeAdded}
            label="Vault Items"
            color="text-amber-500"
          />
          <MetricCard
            icon={GraduationCap}
            value={data.iitCompleted}
            label="Academic"
            color="text-purple-500"
          />
        </div>
      </div>
    </Section>
  );
}

function MetricCard({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: React.ElementType;
  value: number;
  label: string;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl bg-card border border-border p-3 text-center shadow-sm">
      <Icon className={`size-5 mb-1 ${color}`} />
      <span className="text-xl font-bold">{value}</span>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
        {label}
      </span>
    </div>
  );
}
