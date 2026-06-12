"use client";

import { Lightbulb, TrendingUp, Flame } from "lucide-react";

import { PageTransition, Section } from "@/components/layout/page-transition";
import { PageHeader, SectionHeading } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadarChart } from "@/components/charts/radar-chart";
import { BarChart } from "@/components/charts/bar-chart";
import { Heatmap } from "@/components/charts/heatmap";
import {
  analyticsInsight,
  cognitiveScores,
  cognitiveRadar,
  solveTrend,
  difficultyDistribution,
  studyHeatmap,
} from "@/lib/mock-data";

export default function AnalyticsPage() {
  const totalDifficulty = difficultyDistribution.reduce((s, d) => s + d.value, 0);
  const trendData = solveTrend.map((v, i) => ({ label: `${i + 1}`, value: v }));

  return (
    <PageTransition>
      <PageHeader
        title="Analytics"
        description="What kind of engineer are you becoming? A calm, monochromatic read on your trajectory."
        actions={<Badge variant="secondary">Last 30 days</Badge>}
      />

      {/* Insight */}
      <Section className="mb-6">
        <div className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 via-card to-card p-5">
          <div className="flex gap-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary">
              <Lightbulb className="size-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">Key Insight</p>
              <p className="mt-1.5 text-sm leading-relaxed text-balance">{analyticsInsight}</p>
            </div>
          </div>
        </div>
      </Section>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Cognitive radar */}
        <Section>
          <div className="surface-card h-full rounded-2xl p-5">
            <SectionHeading title="Cognitive Profile" />
            <div className="flex justify-center py-2">
              <RadarChart data={cognitiveRadar} size={220} />
            </div>
          </div>
        </Section>

        {/* Cognitive bars */}
        <Section className="lg:col-span-2">
          <div className="surface-card h-full rounded-2xl p-5">
            <SectionHeading title="Skill Breakdown" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {cognitiveScores.map((s) => (
                <div key={s.label} className="rounded-xl border border-border p-3">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{s.label}</span>
                    <span className="font-bold tabular">{s.value}</span>
                  </div>
                  <Progress value={s.value} indicatorColor={s.color} className="h-1.5" />
                </div>
              ))}
            </div>
          </div>
        </Section>
      </div>

      {/* Solve trend */}
      <Section className="mb-6">
        <div className="surface-card rounded-2xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">Solve Trend</h2>
            <span className="flex items-center gap-1 text-xs font-medium text-success">
              <TrendingUp className="size-3.5" /> +24% over period
            </span>
          </div>
          <BarChart data={trendData} color="var(--primary)" height={170} />
          <p className="mt-3 text-center text-xs text-muted-foreground">Problems solved per day · last 14 days</p>
        </div>
      </Section>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Difficulty distribution */}
        <Section className="lg:col-span-2">
          <div className="surface-card h-full rounded-2xl p-5">
            <SectionHeading title="Difficulty Distribution" />
            <div className="grid grid-cols-3 gap-3">
              {difficultyDistribution.map((d) => (
                <div key={d.label} className="rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{d.label}</span>
                    <span className="size-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  </div>
                  <p className="mt-2 text-2xl font-bold tabular">{d.value}</p>
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full" style={{ width: `${(d.value / totalDifficulty) * 100}%`, backgroundColor: d.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* Consistency */}
        <Section>
          <div className="surface-card h-full rounded-2xl p-5">
            <SectionHeading title="Consistency" action={<span className="flex items-center gap-1 text-xs text-warning"><Flame className="size-3.5" /> 14d</span>} />
            <Heatmap data={studyHeatmap} weeks={16} />
            <div className="mt-4 flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground">
              Less
              {[0, 1, 2, 3, 4].map((l) => (
                <span
                  key={l}
                  className="size-[10px] rounded-[3px]"
                  style={{ backgroundColor: l === 0 ? "var(--muted)" : "var(--primary)", opacity: l === 0 ? 1 : [0, 0.28, 0.5, 0.72, 1][l] }}
                />
              ))}
              More
            </div>
          </div>
        </Section>
      </div>
    </PageTransition>
  );
}
