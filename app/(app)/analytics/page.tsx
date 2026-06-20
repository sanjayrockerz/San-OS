import { requireContext } from "@/lib/server/context";

import { PageTransition, Section } from "@/components/layout/page-transition";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadarChart } from "@/components/charts/radar-chart";
import { BarChart } from "@/components/charts/bar-chart";
import { Heatmap } from "@/components/charts/heatmap";
import Link from "next/link";
import {
  Target,
  Zap,
  ArrowRight,
  AlertTriangle,
  Layers,
  History
} from "lucide-react";
import type { Category } from "@/lib/design/category";

export default async function AnalyticsPage() {
  const { user, services } = await requireContext("/analytics");

  // Parallel data fetch
  const now = new Date();
  const toDate = now.toISOString().slice(0, 10);
  const from14 = new Date(now.getTime() - 13 * 86400000).toISOString().slice(0, 10);
  const from112 = new Date(now.getTime() - 111 * 86400000).toISOString().slice(0, 10);

  const [metrics, problems, daily14, daily112, aiInsights, intelSnapshot] = await Promise.all([
    services.analytics.growthMetrics(user.id).catch(() => null),
    services.repos.problems.listVisible(user.id).catch(() => []),
    services.repos.dailyLogs.between(user.id, from14, toDate).catch(() => []),
    services.repos.dailyLogs.between(user.id, from112, toDate).catch(() => []),
    services.repos.aiInsights.active(user.id).catch(() => []),
    services.studentIntelligence.snapshot(user.id).catch(() => null),
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

  const cognitiveScores: { label: string; value: number; category: Category }[] = funnel
    ? [
        { label: "Question Understanding", value: pct(funnel.questionUnderstanding), category: "mission" },
        { label: "Pattern Recognition", value: pct(funnel.patternRecognition), category: "academic" },
        { label: "Algorithm Design", value: pct(funnel.algorithmFormation), category: "warning" },
        { label: "Pseudocode Writing", value: pct(funnel.pseudocodeWriting), category: "mission" },
        { label: "Independent Coding", value: pct(funnel.coding), category: "knowledge" },
        { label: "Debugging", value: pct(funnel.debugging), category: "critical" },
      ]
    : [];

  // Find weakest skill for diagnostic recommendations
  const weakestSkill = cognitiveScores.length > 0
    ? [...cognitiveScores].sort((a, b) => a.value - b.value)[0]
    : null;

  const skillAdvice: Record<string, string> = {
    "Question Understanding": "Analyze problem statements carefully. Write out input-output boundaries and edge cases before coding.",
    "Pattern Recognition": "Browse the Concept Vault or Taxonomy. Group similar problems together to identify recurring patterns.",
    "Algorithm Design": "Draft dry-runs. Solve the problem with manual steps or drawings before defining your code variables.",
    "Pseudocode Writing": "Use structured comments. Outline the flow of the algorithm in plain English within the code editor.",
    "Independent Coding": "Force yourself to type the solution from scratch. Avoid opening editorials or hints early.",
    "Debugging": "Write extensive unit tests. Trace variables line-by-line to understand syntax and runtime exceptions.",
  };

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

  // Streak calculation
  const activeDates = new Set(
    daily112
      .filter((l) => (l.problems_solved ?? 0) > 0 || (l.revisions_done ?? 0) > 0)
      .map((l) => l.log_date)
  );
  let streak = 0;
  const streakCursor = new Date();
  if (!activeDates.has(streakCursor.toISOString().slice(0, 10))) {
    streakCursor.setDate(streakCursor.getDate() - 1);
  }
  while (activeDates.has(streakCursor.toISOString().slice(0, 10))) {
    streak++;
    streakCursor.setDate(streakCursor.getDate() - 1);
  }

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

  const totalProblems = problems.length;
  const uniqueSolved = metrics?.uniqueProblemsSolved ?? 0;
  const readiness = totalProblems ? Math.min(99, Math.round((uniqueSolved / totalProblems) * 100)) : 0;

  function nextMilestone(count: number): number {
    const step = count >= 200 ? 100 : 50;
    return Math.ceil((count + 1) / step) * step;
  }
  const milestone = nextMilestone(uniqueSolved);
  const toMilestone = milestone - uniqueSolved;

  const risks = intelSnapshot?.risks ?? { overallRiskScore: 0, entries: [] };
  const missions = intelSnapshot?.missions ?? [];

  return (
    <PageTransition>
      <PageHeader
        title="Decision Support Center"
        description="Strategic review console, recall diagnostics, and active trajectory planning."
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-category-mission/5 text-category-mission border-category-mission/20">
              Analytics Engine v2.0
            </Badge>
          </div>
        }
      />

      {/* ── LEVEL 1: MISSION SECTION ────────────────────────────────────────────────── */}
      <Section className="mb-6">
        <div className="surface-card rounded-2xl border-t-4 border-t-category-mission p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-border/40">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-category-mission/12 text-category-mission">
                <Target className="size-4" />
              </span>
              <h2 className="text-section font-bold">1. Strategic Mission</h2>
            </div>
            <Badge variant="outline" className="bg-category-mission/5 text-category-mission border-category-mission/20">
              Active Trajectory
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Context/Diagnostic */}
            <div className="lg:col-span-2 space-y-4">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">What happened?</p>
                <p className="mt-1 text-sm text-foreground">
                  Your placement readiness is currently at <span className="font-bold text-category-mission">{readiness}%</span>. You have solved <span className="font-bold">{uniqueSolved}</span> unique problems out of <span className="font-semibold">{totalProblems}</span> total visible problems, with <span className="font-semibold">{weeklyTotal}</span> solved this week.
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Why?</p>
                <p className="mt-1 text-sm text-foreground">
                  Your independent solving rate is <span className="font-bold text-success">{independentPct}%</span> (target &gt;80%). The average time to successfully solve a problem is <span className="font-semibold">{avgMins != null ? `${avgMins} minutes` : "—"}</span>. This indicates moderate concept familiarity but opportunities to reduce reliance on external solutions.
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">What should I do next?</p>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  {aiInsights[0] && <span className="block font-semibold text-foreground mb-1">AI Recommendation: {aiInsights[0].title}</span>}
                  <span>{insightText}</span>
                </p>
              </div>
            </div>

            {/* Trajectory Stats Sidebar */}
            <div className="bg-muted/30 border border-border/50 rounded-xl p-4 space-y-3 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">Goal Metrics</h3>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Placement Readiness</span>
                    <span className="font-bold text-foreground">{readiness}%</span>
                  </div>
                  <Progress value={readiness} indicatorColor="var(--category-mission)" className="h-1.5" />

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-muted-foreground">Next Milestone Target</span>
                    <span className="font-bold text-foreground">{milestone} Solves</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground flex justify-between">
                    <span>Current: {uniqueSolved}</span>
                    <span>{toMilestone} more solves needed</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-border/50 flex flex-wrap items-center gap-2">
                <Link href="/problems" className="flex-1 text-center py-2 px-3 bg-category-mission text-white rounded-lg text-xs font-semibold hover:bg-category-mission/90 transition-colors">
                  Solve Problems
                </Link>
                <Link href="/overview" className="flex-1 text-center py-2 px-3 border border-border text-foreground hover:bg-accent rounded-lg text-xs font-semibold transition-colors">
                  Overview
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ── LEVEL 2: RISK SECTION ───────────────────────────────────────────────────── */}
      <Section className="mb-6">
        <div className="surface-card rounded-2xl border-t-4 border-t-category-critical p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-border/40">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-category-critical/12 text-category-critical">
                <AlertTriangle className="size-4" />
              </span>
              <h2 className="text-section font-bold">2. Strategic Risks</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-semibold">Overall Risk Score:</span>
              <Badge variant={risks.overallRiskScore > 50 ? "danger" : "warning"} className="tabular">
                {risks.overallRiskScore}/100
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">What happened?</p>
                <p className="mt-1 text-sm text-foreground">
                  The memory intelligence engine has detected <span className="font-bold text-category-critical">{risks.entries.length} active risk signal{risks.entries.length === 1 ? "" : "s"}</span> across your queues. Spaced repetition retention, neglected topics, and missed habits contribute to the risk score.
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Why?</p>
                <p className="mt-1 text-sm text-foreground">
                  Your editorial dependency is at <span className="font-bold text-category-warning">{editorialPct}%</span> (target &lt;20%). High editorial dependency prevents deep recall pathways from solidifying. Key topics are decaying due to missed spaced-repetition schedules.
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">What should I do next?</p>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Address critical risks immediately to avoid memory slip. Revise flagged problems without accessing the solutions tab, and complete overdue academic work.
                </p>
              </div>
            </div>

            {/* List of active risks */}
            <div className="bg-muted/30 border border-border/50 rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Risks & Interventions</h3>
              {risks.entries.length > 0 ? (
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                  {risks.entries.slice(0, 3).map((entry, idx) => (
                    <div key={idx} className="bg-card border border-border/80 rounded-lg p-2.5 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-foreground truncate max-w-[130px]">{entry.name}</span>
                        <Badge variant={entry.riskLevel === "critical" ? "danger" : "warning"} className="text-[8px] scale-90">
                          {entry.riskLevel}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground line-clamp-1">{entry.reason}</p>
                      <Link href={entry.recommendedAction.href} className="text-[10px] font-semibold text-primary hover:underline flex items-center gap-0.5">
                        {entry.recommendedAction.label} <ArrowRight className="size-2.5" />
                      </Link>
                    </div>
                  ))}
                  {risks.entries.length > 3 && (
                    <p className="text-[10px] text-center text-muted-foreground italic">
                      +{risks.entries.length - 3} more risks pending
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-muted-foreground">
                  Recall and habits are stable. No active risks.
                </div>
              )}
            </div>
          </div>
        </div>
      </Section>

      {/* ── LEVEL 3: ACTION SECTION ─────────────────────────────────────────────────── */}
      <Section className="mb-6">
        <div className="surface-card rounded-2xl border-t-4 border-t-category-warning p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-border/40">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-category-warning/12 text-category-warning">
                <Zap className="size-4" />
              </span>
              <h2 className="text-section font-bold">3. Strategic Decisions & Actions</h2>
            </div>
            <Badge variant="outline" className="bg-category-warning/5 text-category-warning border-category-warning/20">
              Ranked Priorities
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-4">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">What happened?</p>
                <p className="mt-1 text-sm text-foreground">
                  The intelligence core has compiled <span className="font-semibold">{missions.length} active strategic missions</span> and ranked tasks.
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Why?</p>
                <p className="mt-1 text-sm text-foreground">
                  These tasks are grouped by domain to maximize momentum and scored based on a combination of urgency (50%), impact (35%), and streak momentum (15%).
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">What should I do next?</p>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Launch the top mission to build momentum or view individual prioritized actions below.
                </p>
              </div>
            </div>

            {/* List of active missions */}
            <div className="lg:col-span-2 space-y-3">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Active Strategic Review Missions</h3>
              {missions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {missions.map((m) => (
                    <div key={m.id} className="lift border border-border bg-card rounded-xl p-4 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-xs text-foreground">{m.title}</h4>
                          <Badge variant="secondary" className="text-[9px] tabular">
                            {m.estimatedMinutes}m · {m.actions.length} task{m.actions.length === 1 ? "" : "s"}
                          </Badge>
                        </div>
                        <div className="space-y-1.5 min-h-[50px]">
                          {m.actions.slice(0, 2).map((a, idx) => (
                            <p key={idx} className="text-[11px] text-muted-foreground line-clamp-1 flex items-center gap-1">
                              <span className="size-1 rounded-full bg-category-warning shrink-0" />
                              <span>{a.title}</span>
                            </p>
                          ))}
                          {m.actions.length > 2 && (
                            <p className="text-[9px] text-muted-foreground italic pl-2">
                              +{m.actions.length - 2} more tasks
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 pt-2 border-t border-border/40 flex justify-end">
                        <Link href={m.actions[0]?.href ?? "/overview"} className="text-xs font-semibold text-primary flex items-center gap-0.5 hover:underline">
                          Launch Mission <ArrowRight className="size-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-muted/20 border border-dashed rounded-xl text-xs text-muted-foreground">
                  All strategic actions completed. Take a break!
                </div>
              )}
            </div>
          </div>
        </div>
      </Section>

      {/* ── LEVEL 4: PROGRESS SECTION ───────────────────────────────────────────────── */}
      <Section className="mb-6">
        <div className="surface-card rounded-2xl border-t-4 border-t-category-knowledge p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-border/40">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-category-knowledge/12 text-category-knowledge">
                <Layers className="size-4" />
              </span>
              <h2 className="text-section font-bold">4. Cognitive Progress</h2>
            </div>
            <Badge variant="outline" className="bg-category-knowledge/5 text-category-knowledge border-category-knowledge/20">
              Solving Funnel
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">What happened?</p>
                <p className="mt-1 text-sm text-foreground">
                  Your cognitive profile assesses your strengths in the engineering lifecycle, from initial understanding to debugging execution.
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Why?</p>
                <p className="mt-1 text-sm text-foreground">
                  Based on attempt data, your primary bottleneck is currently in <span className="font-bold text-category-knowledge">{weakestSkill?.label ?? "none"}</span> at <span className="font-bold">{weakestSkill?.value ?? 0}%</span>. This represents the point of friction in your problem-solving flow.
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">What should I do next?</p>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {weakestSkill ? skillAdvice[weakestSkill.label] : "Continue practice to gather enough data points."}
                </p>
              </div>
            </div>

            {/* Radar Chart */}
            <div className="flex items-center justify-center bg-muted/10 border border-border/45 rounded-xl p-4">
              {cognitiveRadar.length > 0 ? (
                <RadarChart data={cognitiveRadar} size={210} color="var(--category-knowledge)" />
              ) : (
                <div className="text-xs text-muted-foreground py-16">
                  No cognitive data yet. Complete attempts.
                </div>
              )}
            </div>

            {/* Skill Breakdown progress bars */}
            <div className="bg-muted/30 border border-border/50 rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Skill Breakdown</h3>
              {cognitiveScores.length > 0 ? (
                <div className="space-y-3">
                  {cognitiveScores.map((s) => (
                    <div key={s.label} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{s.label}</span>
                        <span className="font-bold tabular">{s.value}%</span>
                      </div>
                      <Progress value={s.value} indicatorColor={`var(--category-${s.category})`} className="h-1.5" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-xs text-muted-foreground">
                  Solve problems to build profile statistics.
                </div>
              )}
            </div>
          </div>
        </div>
      </Section>

      {/* ── LEVEL 5: HISTORY SECTION ────────────────────────────────────────────────── */}
      <Section className="mb-6">
        <div className="surface-card rounded-2xl border-t-4 border-t-category-consistency p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-border/40">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-category-consistency/12 text-category-consistency">
                <History className="size-4" />
              </span>
              <h2 className="text-section font-bold">5. Trajectory & Consistency</h2>
            </div>
            <Badge variant="outline" className="bg-category-consistency/5 text-category-consistency border-category-consistency/20">
              Momentum
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="space-y-4 lg:col-span-1">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">What happened?</p>
                <p className="mt-1 text-sm text-foreground">
                  Your consistency heatmap covers 16 weeks, and solve trend shows daily progress over the last 14 days.
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Why?</p>
                <p className="mt-1 text-sm text-foreground">
                  Consistency is the engine of spaced retention. Your current active streak is <span className="font-bold text-category-consistency">{streak} day{streak === 1 ? "" : "s"}</span>.
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">What should I do next?</p>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {streak > 0
                    ? "Keep your daily streak going. Log at least one solve or concept revision before the end of the day."
                    : "Establish consistency. Build a new habit chain starting today by completing 1 priority item."}
                </p>
              </div>
            </div>

            {/* Heatmap & Solve trend grid */}
            <div className="lg:col-span-3 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Solve trend bar chart */}
                <div className="bg-card border border-border/80 rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Solve Trend (14d)</h4>
                  <BarChart data={trendData} color="var(--category-consistency)" height={120} />
                </div>

                {/* Difficulty distribution */}
                <div className="bg-card border border-border/80 rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Difficulty Distribution</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {difficultyDistribution.map((d) => (
                      <div key={d.label} className="border border-border/60 rounded-lg p-2 flex flex-col justify-between">
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                          <span>{d.label}</span>
                          <span className="size-2 rounded-full" style={{ backgroundColor: d.color }} />
                        </div>
                        <p className="text-lg font-bold tabular mt-1">{d.value}</p>
                        <div className="h-1 w-full bg-muted rounded-full mt-2 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${Math.round((d.value / totalDiff) * 100)}%`, backgroundColor: d.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Consistency heatmap row */}
              <div className="bg-card border border-border/80 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <h4 className="font-bold text-foreground uppercase tracking-wider">16-Week Consistency</h4>
                  <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                    Less
                    {[0, 1, 2, 3, 4].map((l) => (
                      <span
                        key={l}
                        className="size-2 rounded-[2px]"
                        style={{
                          backgroundColor: l === 0 ? "var(--muted)" : "var(--category-consistency)",
                          opacity: l === 0 ? 1 : [0, 0.28, 0.5, 0.72, 1][l],
                        }}
                      />
                    ))}
                    More
                  </div>
                </div>
                <div className="overflow-x-auto py-1">
                  <Heatmap data={heatmap} weeks={16} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </PageTransition>
  );
}

