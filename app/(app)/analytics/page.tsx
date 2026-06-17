import { requireContext } from "@/lib/server/context";

import { PageTransition, Section } from "@/components/layout/page-transition";
import { PageHeader, SectionHeading } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadarChart } from "@/components/charts/radar-chart";
import { BarChart } from "@/components/charts/bar-chart";
import { Heatmap } from "@/components/charts/heatmap";
import { Flame, TrendingUp, Target, Zap, Clock, BookOpen } from "lucide-react";

export default async function AnalyticsPage() {
  const { user, services } = await requireContext("/analytics");

  // Parallel data fetch
  const now = new Date();
  const toDate = now.toISOString().slice(0, 10);
  const from14 = new Date(now.getTime() - 13 * 86400000).toISOString().slice(0, 10);
  const from112 = new Date(now.getTime() - 111 * 86400000).toISOString().slice(0, 10);

  const [metrics, problems, daily14, daily112, aiInsights] = await Promise.all([
    services.analytics.growthMetrics(user.id).catch(() => null),
    services.repos.problems.listVisible(user.id).catch(() => []),
    services.repos.dailyLogs.between(user.id, from14, toDate).catch(() => []),
    services.repos.dailyLogs.between(user.id, from112, toDate).catch(() => []),
    services.repos.aiInsights.active(user.id).catch(() => []),
  ]);

  // ── Cognitive radar (normalise funnel counts → 0-100) ───────────────────────
  const total = metrics?.totalAttempts ?? 0;
  const pct = (n: number) => (total > 0 ? Math.min(100, Math.round((n / total) * 100)) : 0);
  const funnel = metrics?.funnel;
  const cognitiveRadar = funnel
    ? [
        { label: "Understanding", value: pct(funnel.questionUnderstanding) },
        { label: "Pattern", value: pct(funnel.patternRecognition) },
        { label: "Algorithm", value: pct(funnel.algorithmFormation) },
        { label: "Pseudocode", value: pct(funnel.pseudocodeWriting) },
        { label: "Coding", value: pct(funnel.coding) },
        { label: "Debugging", value: pct(funnel.debugging) },
      ]
    : [];

  const cognitiveScores = funnel
    ? [
        { label: "Question Understanding", value: pct(funnel.questionUnderstanding), color: "#7c7dff" },
        { label: "Pattern Recognition", value: pct(funnel.patternRecognition), color: "#34d399" },
        { label: "Algorithm Design", value: pct(funnel.algorithmFormation), color: "#fbbf24" },
        { label: "Pseudocode Writing", value: pct(funnel.pseudocodeWriting), color: "#a78bfa" },
        { label: "Independent Coding", value: pct(funnel.coding), color: "#60a5fa" },
        { label: "Debugging", value: pct(funnel.debugging), color: "#f87171" },
      ]
    : [];

  // ── Solve trend — last 14 days ───────────────────────────────────────────────
  const logByDate = new Map(daily14.map((l) => [l.log_date, l]));
  const trendData = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date(now.getTime() - (13 - i) * 86400000);
    const key = d.toISOString().slice(0, 10);
    return {
      label: d.toLocaleDateString("en-US", { weekday: "short" }),
      value: logByDate.get(key)?.problems_solved ?? 0,
    };
  });

  // ── Difficulty distribution ──────────────────────────────────────────────────
  const diffCount = { easy: 0, medium: 0, hard: 0 };
  for (const p of problems) {
    if (p.difficulty === "easy") diffCount.easy++;
    else if (p.difficulty === "medium") diffCount.medium++;
    else if (p.difficulty === "hard") diffCount.hard++;
  }
  const totalDiff = diffCount.easy + diffCount.medium + diffCount.hard || 1;
  const difficultyDistribution = [
    { label: "Easy", value: diffCount.easy, color: "var(--success)" },
    { label: "Medium", value: diffCount.medium, color: "var(--warning)" },
    { label: "Hard", value: diffCount.hard, color: "var(--danger)" },
  ];

  // ── Heatmap — last 16 weeks ──────────────────────────────────────────────────
  const heatLogByDate = new Map(daily112.map((l) => [l.log_date, l]));
  const heatmap: number[] = Array.from({ length: 112 }).map((_, i) => {
    const d = new Date(now.getTime() - (111 - i) * 86400000);
    const key = d.toISOString().slice(0, 10);
    const log = heatLogByDate.get(key);
    const activity = (log?.problems_solved ?? 0) + (log?.revisions_done ?? 0);
    if (activity === 0) return 0;
    if (activity <= 1) return 1;
    if (activity <= 3) return 2;
    if (activity <= 5) return 3;
    return 4;
  });

  // ── Summary stats ────────────────────────────────────────────────────────────
  const avgMins =
    metrics?.averageSolveSeconds != null
      ? Math.round(metrics.averageSolveSeconds / 60)
      : null;
  const independentPct = Math.round((metrics?.independentSolveRate ?? 0) * 100);
  const editorialPct = Math.round((metrics?.editorialDependencyRate ?? 0) * 100);
  const weeklyTotal = daily14.slice(-7).reduce((s, l) => s + (l.problems_solved ?? 0), 0);

  const insightText =
    aiInsights[0]?.detail ??
    (metrics?.totalAttempts
      ? `You've made ${metrics.totalAttempts} attempt${metrics.totalAttempts === 1 ? "" : "s"} with a ${independentPct}% independent-coding rate. Keep the pattern recognition habit going.`
      : "Solve a few problems to unlock your personalised insight.");

  return (
    <PageTransition>
      <PageHeader
        title="Analytics"
        description="A calm read on your trajectory as an engineer."
        actions={<Badge variant="secondary">Last 14 days</Badge>}
      />

      {/* Key Insight */}
      <Section className="mb-6">
        <div className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 via-card to-card p-5">
          <div className="flex gap-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary">
              <Zap className="size-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                {aiInsights[0] ? aiInsights[0].title : "Key Insight"}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-balance">{insightText}</p>
            </div>
          </div>
        </div>
      </Section>

      {/* Hero stats row */}
      <Section className="mb-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              label: "Problems Solved",
              value: metrics?.uniqueProblemsSolved ?? 0,
              icon: Target,
              color: "text-success",
              bg: "bg-success/12",
            },
            {
              label: "This Week",
              value: weeklyTotal,
              icon: TrendingUp,
              color: "text-primary",
              bg: "bg-primary/12",
            },
            {
              label: "Avg Solve Time",
              value: avgMins != null ? `${avgMins}m` : "—",
              icon: Clock,
              color: "text-warning",
              bg: "bg-warning/12",
            },
            {
              label: "Independent Rate",
              value: `${independentPct}%`,
              icon: BookOpen,
              color: "text-blue-400",
              bg: "bg-blue-400/12",
            },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="surface-card flex items-center gap-3 rounded-2xl p-4">
              <span className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${bg} ${color}`}>
                <Icon className="size-4" />
              </span>
              <div>
                <p className="text-xl font-bold tabular">{value}</p>
                <p className="text-[11px] text-muted-foreground">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Cognitive radar */}
        <Section>
          <div className="surface-card h-full rounded-2xl p-5">
            <SectionHeading title="Cognitive Profile" />
            {cognitiveRadar.length > 0 ? (
              <div className="flex justify-center py-2">
                <RadarChart data={cognitiveRadar} size={220} />
              </div>
            ) : (
              <div className="flex justify-center py-12 text-sm text-muted-foreground">
                Solve problems to see your profile.
              </div>
            )}
          </div>
        </Section>

        {/* Cognitive skill bars */}
        <Section className="lg:col-span-2">
          <div className="surface-card h-full rounded-2xl p-5">
            <SectionHeading title="Skill Breakdown" />
            {cognitiveScores.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {cognitiveScores.map((s) => (
                  <div key={s.label} className="rounded-xl border border-border p-3">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{s.label}</span>
                      <span className="font-bold tabular">{s.value}%</span>
                    </div>
                    <Progress value={s.value} indicatorColor={s.color} className="h-1.5" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
                No attempt data yet.
              </div>
            )}
          </div>
        </Section>
      </div>

      {/* Solve trend */}
      <Section className="mb-6">
        <div className="surface-card rounded-2xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">Solve Trend</h2>
            {weeklyTotal > 0 && (
              <span className="flex items-center gap-1 text-xs font-medium text-success">
                <TrendingUp className="size-3.5" />
                {weeklyTotal} this week
              </span>
            )}
          </div>
          <BarChart data={trendData} color="var(--primary)" height={170} />
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Problems solved per day · last 14 days
          </p>
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
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.round((d.value / totalDiff) * 100)}%`,
                        backgroundColor: d.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* Consistency heatmap */}
        <Section>
          <div className="surface-card h-full rounded-2xl p-5">
            <SectionHeading
              title="Consistency"
              action={
                <span className="flex items-center gap-1 text-xs text-warning">
                  <Flame className="size-3.5" />
                </span>
              }
            />
            <Heatmap data={heatmap} weeks={16} />
            <div className="mt-4 flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground">
              Less
              {[0, 1, 2, 3, 4].map((l) => (
                <span
                  key={l}
                  className="size-[10px] rounded-[3px]"
                  style={{
                    backgroundColor:
                      l === 0 ? "var(--muted)" : "var(--primary)",
                    opacity: l === 0 ? 1 : [0, 0.28, 0.5, 0.72, 1][l],
                  }}
                />
              ))}
              More
            </div>
          </div>
        </Section>
      </div>

      {/* Editorial dependency note */}
      {editorialPct > 0 && (
        <Section className="mb-6">
          <div className="surface-card rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Editorial Dependency</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {editorialPct}% of your scheduled problems have an editorial flag. Reducing
                  this over time is the mark of genuine mastery.
                </p>
              </div>
              <div className="shrink-0 text-2xl font-bold tabular text-warning">
                {editorialPct}%
              </div>
            </div>
            <Progress value={editorialPct} indicatorColor="var(--warning)" className="mt-3 h-1.5" />
          </div>
        </Section>
      )}
    </PageTransition>
  );
}
