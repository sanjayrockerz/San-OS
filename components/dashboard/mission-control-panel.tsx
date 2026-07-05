import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CalendarCheck,
} from "lucide-react";

import { Section } from "@/components/layout/page-transition";
import { SectionHeading } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Disclosure } from "@/components/ui/disclosure";
import { ProgressRing } from "@/components/charts/progress-ring";
import { MissedWorkPanel } from "./missed-work-panel";
import { cn } from "@/lib/utils";
import type { Mission, MissedWorkItem, RiskRegister, StudentAction } from "@/lib/services";
import { ACTION_LABEL_BY_KIND } from "@/lib/design/status";
import { CATEGORY_TEXT, CATEGORY_TINT } from "@/lib/design/category";
import { RISK_LEVEL_META, STUDENT_ACTION_SOURCE_META, scoreToRiskLevel } from "@/lib/design/status";

interface OverviewMemoryHealth {
  overallScore: number;
  atRisk: { id: string; name: string; healthScore: number }[];
  neglected: { id: string; name: string }[];
}

interface OverviewForgettingForecast {
  likelyForgotten: { problemId: string; title: string; score: number }[];
  atRiskCount: number;
}

interface OverviewAssignment {
  id: string;
  title: string;
  due: string;
  urgent: boolean;
}

/* -------------------------------------------------------------------------- */
/* Top 3 Priorities — secondary to Today's Mission, single row, compact       */
/* -------------------------------------------------------------------------- */

export function PriorityStack({ priorities }: { priorities: StudentAction[] }) {
  const top = priorities.slice(0, 3);
  if (top.length === 0) return null;

  return (
    <Section className="mb-5">
      <div className="surface-card rounded-2xl p-4">
        <SectionHeading title="Top 3 Priorities" />
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {top.map((action) => {
            const level = scoreToRiskLevel(action.score);
            const meta = STUDENT_ACTION_SOURCE_META[action.source];
            const Icon = meta.icon;
            const ctaLabel = ACTION_LABEL_BY_KIND[action.kind] ?? "Open";
            return (
              <Link
                key={action.id}
                href={action.href}
                className="lift group flex items-center gap-2.5 rounded-xl border border-border bg-card p-3"
              >
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-lg",
                    CATEGORY_TINT[meta.category],
                  )}
                >
                  <Icon className="size-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{action.title}</p>
                  <span className="flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    {ctaLabel} <ArrowRight className="size-3" />
                  </span>
                </div>
                <Badge variant={RISK_LEVEL_META[level].badgeVariant}>
                  {RISK_LEVEL_META[level].label}
                </Badge>
              </Link>
            );
          })}
        </div>
      </div>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/* Today's Missions — moved into "Show more" (Mission Control level 2 detail) */
/* -------------------------------------------------------------------------- */

const MISSION_DOMAIN_ICON: Record<string, string> = {
  revision: "📚",
  memory: "🧠",
  academic: "🎓",
  knowledge: "💡",
  habit: "⚡",
  project: "🛠",
  business: "💼",
};

export function MissionCenter({ missions }: { missions: Mission[] }) {
  const visible = missions.slice(0, 4);
  if (visible.length === 0) return null;

  return (
    <Section>
      <div className="surface-card rounded-2xl p-5">
        <SectionHeading title="Today's Missions" />
        <p className="text-xs text-muted-foreground mb-4">
          Time-boxed focus areas ranked by combined urgency and impact.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {visible.map((mission) => {
            const domainKey = Object.keys(MISSION_DOMAIN_ICON).find((k) =>
              mission.title.toLowerCase().includes(k),
            ) ?? "habit";
            const emoji = MISSION_DOMAIN_ICON[domainKey] ?? "⚡";
            const topActions = mission.actions.slice(0, 3);

            return (
              <div
                key={mission.id}
                className="rounded-xl border border-border bg-card p-4 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{emoji}</span>
                    <p className="text-sm font-semibold">{mission.title}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    ~{mission.estimatedMinutes}m
                  </span>
                </div>
                <div className="space-y-1.5">
                  {topActions.map((action) => {
                    const ctaLabel = ACTION_LABEL_BY_KIND[action.kind] ?? "Open";
                    return (
                      <Link
                        key={action.id}
                        href={action.href}
                        className="group flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white/5 transition-colors"
                      >
                        <CalendarCheck className="size-3 text-muted-foreground shrink-0" />
                        <span className="flex-1 text-xs truncate">{action.title}</span>
                        <span className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {ctaLabel} →
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/* Risk Alerts — compact list replacing the old 4-column Risk Center grid     */
/* -------------------------------------------------------------------------- */

export function RiskAlerts({
  risks,
  memoryHealth,
  forgettingForecast,
  missedWork,
  upcomingAssignments,
}: {
  risks: RiskRegister;
  memoryHealth: OverviewMemoryHealth;
  forgettingForecast: OverviewForgettingForecast;
  missedWork: MissedWorkItem[];
  upcomingAssignments: OverviewAssignment[];
}) {
  const urgentAssignments = upcomingAssignments.filter((a) => a.urgent);
  const otherAssignments = upcomingAssignments.filter((a) => !a.urgent);
  const patternRisks = risks.entries.filter(
    (e) => e.entityType === "pattern" || e.entityType === "concept",
  );

  const memoryRiskCount =
    forgettingForecast.likelyForgotten.length +
    memoryHealth.atRisk.length +
    memoryHealth.neglected.length;

  const rows = [
    {
      key: "memory",
      label: "Memory at Risk",
      count: memoryRiskCount,
      content: (
        <div className="space-y-1.5">
          {forgettingForecast.likelyForgotten.slice(0, 3).map((item) => (
            <Link
              key={item.problemId}
              href={`/problems/${item.problemId}`}
              className="flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/5 p-2.5 transition-colors hover:bg-danger/10"
            >
              <AlertTriangle className="size-3.5 shrink-0 text-danger" />
              <span className="min-w-0 flex-1 truncate text-xs font-medium">{item.title}</span>
              <span className="shrink-0 text-xs font-semibold text-danger">{item.score}%</span>
            </Link>
          ))}
          {memoryHealth.atRisk.slice(0, 2).map((topic) => (
            <Link
              key={topic.id}
              href={`/concepts/${topic.id}`}
              className="flex items-center gap-2 rounded-xl border border-border p-2.5 transition-colors hover:bg-accent"
            >
              <span className="min-w-0 flex-1 truncate text-xs font-medium">{topic.name}</span>
              <Badge variant="warning">at risk</Badge>
            </Link>
          ))}
          {memoryHealth.neglected.slice(0, 2).map((topic) => (
            <Link
              key={topic.id}
              href={`/concepts/${topic.id}`}
              className="flex items-center gap-2 rounded-xl border border-border p-2.5 transition-colors hover:bg-accent"
            >
              <span className="min-w-0 flex-1 truncate text-xs font-medium">{topic.name}</span>
              <Badge variant="default">neglected</Badge>
            </Link>
          ))}
          <div className="flex items-center gap-3 pt-1">
            <ProgressRing value={memoryHealth.overallScore} size={32} stroke={4}>
              <span className="text-[9px] font-bold tabular">{memoryHealth.overallScore}</span>
            </ProgressRing>
            <span className="text-xs text-muted-foreground">overall recall score</span>
          </div>
        </div>
      ),
    },
    {
      key: "missed",
      label: "While You Were Away",
      count: missedWork.length,
      content: <MissedWorkPanel items={missedWork} bare />,
    },
    {
      key: "academic",
      label: "Academic Commitments",
      count: upcomingAssignments.length,
      content: (
        <div className="space-y-1.5">
          {[...urgentAssignments, ...otherAssignments].slice(0, 4).map((d) => (
            <Link
              key={d.id}
              href="/iit-workspace"
              className={cn(
                "flex items-center gap-2.5 rounded-xl border p-2.5 transition-colors hover:bg-accent",
                d.urgent ? "border-danger/30 bg-danger/5" : "border-border",
              )}
            >
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-lg",
                  d.urgent ? "bg-danger/12 text-danger" : "bg-muted text-muted-foreground",
                )}
              >
                {d.urgent ? <AlertTriangle className="size-3.5" /> : <CalendarCheck className="size-3.5" />}
              </span>
              <p className="min-w-0 flex-1 truncate text-xs font-medium">{d.title}</p>
              <span
                className={cn(
                  "shrink-0 text-xs font-medium",
                  d.urgent ? "text-danger" : "text-muted-foreground",
                )}
              >
                {d.due}
              </span>
            </Link>
          ))}
        </div>
      ),
    },
    {
      key: "pattern",
      label: "Pattern & Knowledge Risk",
      count: patternRisks.length,
      content: (
        <div className="space-y-1.5">
          {patternRisks.slice(0, 4).map((entry) => (
            <Link
              key={`${entry.entityType}-${entry.entityId}`}
              href={entry.recommendedAction.href}
              className="flex items-center gap-2 rounded-xl border border-border p-2.5 transition-colors hover:bg-accent"
            >
              <span className="min-w-0 flex-1 truncate text-xs font-medium">{entry.name}</span>
              <Badge variant={RISK_LEVEL_META[entry.riskLevel].badgeVariant}>
                {RISK_LEVEL_META[entry.riskLevel].label}
              </Badge>
            </Link>
          ))}
        </div>
      ),
    },
  ].filter((row) => row.count > 0);

  if (rows.length === 0) {
    return (
      <Section className="mb-5">
        <EmptyState
          icon={AlertTriangle}
          title="Nothing at risk"
          description="No overdue work, decaying recall, or at-risk assignments right now."
          benefit="Keep your streak going and this stays clear."
          className="border-none bg-transparent py-6"
        />
      </Section>
    );
  }

  return (
    <Section className="mb-5">
      <div className="surface-card rounded-2xl border-category-critical/20 p-4">
        <div className="mb-1 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className={cn("size-4.5", CATEGORY_TEXT.critical)} />
            <h2 className="text-section">Risk Alerts</h2>
          </div>
          {risks.entries.length > 0 && (
            <div className="flex items-center gap-2">
              <ProgressRing value={risks.overallRiskScore} size={28} stroke={4}>
                <span className="text-[9px] font-bold tabular">{risks.overallRiskScore}</span>
              </ProgressRing>
              <span className="text-xs text-muted-foreground">overall risk</span>
            </div>
          )}
        </div>
        <div className="divide-y divide-border">
          {rows.map((row) => (
            <Disclosure
              key={row.key}
              className="py-1"
              trigger={
                <span className="flex items-center gap-2">
                  {row.label}
                  <Badge variant="warning">{row.count}</Badge>
                </span>
              }
            >
              {row.content}
            </Disclosure>
          ))}
        </div>
      </div>
    </Section>
  );
}
