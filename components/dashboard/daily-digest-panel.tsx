"use client";

import Link from "next/link";
import {
  Flame,
  Dumbbell,
  RefreshCw,
  Sparkles,
  Library,
  GraduationCap,
  ArrowRight,
} from "lucide-react";

import { Section } from "@/components/layout/page-transition";
import { SectionHeading } from "@/components/layout/page-header";

import type { OverviewData } from "./overview-client";

type DailyDigestData = OverviewData["dailyDigest"];

export function DailyDigestPanel({ data }: { data: DailyDigestData }) {
  const hasActivity =
    data.problemsSolved > 0 ||
    data.revisionsCompleted > 0 ||
    data.conceptsCreated > 0 ||
    data.knowledgeAdded > 0 ||
    data.iitCompleted > 0;

  if (!hasActivity) return null;

  return (
    <Section>
      <div className="surface-card rounded-2xl p-5 border border-primary/20 bg-primary/5">
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
          <p className="mb-4 text-sm leading-relaxed text-foreground font-medium border-l-2 border-primary pl-3">
            {data.observation}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
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
            label="IIT Tasks"
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
