import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  Compass,
} from "lucide-react";

import { Section } from "@/components/layout/page-transition";
import { SectionHeading } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { ProgressRing } from "@/components/charts/progress-ring";
import { MissedWorkPanel } from "./missed-work-panel";
import { cn } from "@/lib/utils";
import type { Mission, MissedWorkItem, RiskRegister, StudentAction } from "@/lib/services";
import { ACTION_LABEL_BY_KIND } from "@/lib/services";
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

export function MissionControlPanel({
  missions,
  priorities,
  risks,
  memoryHealth,
  forgettingForecast,
  missedWork,
  upcomingAssignments,
}: {
  missions: Mission[];
  priorities: StudentAction[];
  risks: RiskRegister;
  memoryHealth: OverviewMemoryHealth;
  forgettingForecast: OverviewForgettingForecast;
  missedWork: MissedWorkItem[];
  upcomingAssignments: OverviewAssignment[];
}) {
  return (
    <div className="mt-5 space-y-5">
      <TodaysMission missions={missions} />
      <PriorityStack priorities={priorities} />
      <RiskCenter
        risks={risks}
        memoryHealth={memoryHealth}
        forgettingForecast={forgettingForecast}
        missedWork={missedWork}
        upcomingAssignments={upcomingAssignments}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Today's Mission                                                             */
/* -------------------------------------------------------------------------- */

function TodaysMission({ missions }: { missions: Mission[] }) {
  const mission = missions[0];

  return (
    <Section>
      <div className="surface-card rounded-2xl border-category-mission/25 p-5">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Compass className={cn("size-4.5", CATEGORY_TEXT.mission)} />
            <h2 className="text-section">
              {mission ? `Today's Mission: ${mission.title}` : "Today's Mission"}
            </h2>
          </div>
          {mission && (
            <Badge variant="default">~{mission.estimatedMinutes} min</Badge>
          )}
        </div>

        {!mission ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <CheckCircle2 className="size-6 text-success" />
            <p className="mt-2 text-sm font-medium">Nothing urgent right now.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Good time to get ahead —{" "}
              <Link href="/problems" className="text-primary hover:underline">
                solve a new problem
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {mission.actions.slice(0, 4).map((action) => (
              <ActionRow key={action.id} action={action} />
            ))}
          </div>
        )}
      </div>
    </Section>
  );
}

function ActionRow({ action }: { action: StudentAction }) {
  const meta = STUDENT_ACTION_SOURCE_META[action.source];
  const Icon = meta.icon;
  const ctaLabel = ACTION_LABEL_BY_KIND[action.kind] ?? "Open";

  return (
    <Link
      href={action.href}
      className="lift group flex items-start gap-3 rounded-xl border border-border bg-card p-3"
    >
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-lg",
          CATEGORY_TINT[meta.category],
        )}
      >
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium line-clamp-1">{action.title}</p>
        <p className="line-clamp-1 text-xs text-muted-foreground mt-0.5">{action.detail}</p>
      </div>
      <span className="flex shrink-0 items-center gap-1 self-center text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
        {ctaLabel} <ArrowRight className="size-3" />
      </span>
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/* Priority Stack                                                              */
/* -------------------------------------------------------------------------- */

function PriorityStack({ priorities }: { priorities: StudentAction[] }) {
  const top = priorities.slice(0, 5);
  if (top.length === 0) return null;

  return (
    <Section>
      <div className="surface-card rounded-2xl p-5">
        <SectionHeading title="Top Priorities" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {top.map((action) => {
            const level = scoreToRiskLevel(action.score);
            const meta = STUDENT_ACTION_SOURCE_META[action.source];
            const Icon = meta.icon;
            const ctaLabel = ACTION_LABEL_BY_KIND[action.kind] ?? "Open";
            return (
              <Link
                key={action.id}
                href={action.href}
                className="lift group flex flex-col gap-2 rounded-xl border border-border bg-card p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-lg",
                      CATEGORY_TINT[meta.category],
                    )}
                  >
                    <Icon className="size-3.5" />
                  </span>
                  <Badge variant={RISK_LEVEL_META[level].badgeVariant}>
                    {RISK_LEVEL_META[level].label}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-semibold line-clamp-1">{action.title}</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground mt-0.5">
                    {action.detail}
                  </p>
                </div>
                <span className="mt-auto flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  {ctaLabel} <ArrowRight className="size-3" />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/* Risk Center                                                                 */
/* -------------------------------------------------------------------------- */

function RiskCenter({
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
  const patternRisks = risks.entries.filter((e) => e.entityType === "pattern");

  const nothingAtRisk =
    memoryHealth.atRisk.length === 0 &&
    memoryHealth.neglected.length === 0 &&
    forgettingForecast.likelyForgotten.length === 0 &&
    missedWork.length === 0 &&
    upcomingAssignments.length === 0 &&
    patternRisks.length === 0;

  if (nothingAtRisk) return null;

  return (
    <Section>
      <div className="surface-card rounded-2xl border-category-critical/20 p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className={cn("size-4.5", CATEGORY_TEXT.critical)} />
            <h2 className="text-section">Risk Center</h2>
          </div>
          {risks.entries.length > 0 && (
            <div className="flex items-center gap-2">
              <ProgressRing value={risks.overallRiskScore} size={32} stroke={4}>
                <span className="text-[9px] font-bold tabular">{risks.overallRiskScore}</span>
              </ProgressRing>
              <span className="text-xs text-muted-foreground">overall risk</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          {/* Memory at risk */}
          <div>
            <p className="text-caption text-muted-foreground mb-2">Memory at Risk</p>
            {forgettingForecast.likelyForgotten.length === 0 &&
            memoryHealth.atRisk.length === 0 &&
            memoryHealth.neglected.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">Recall looks solid.</p>
            ) : (
              <div className="space-y-1.5">
                {forgettingForecast.likelyForgotten.slice(0, 2).map((item) => (
                  <Link
                    key={item.problemId}
                    href={`/problems/${item.problemId}`}
                    className="flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/5 p-2.5 transition-colors hover:bg-danger/10"
                  >
                    <AlertTriangle className="size-3.5 shrink-0 text-danger" />
                    <span className="min-w-0 flex-1 truncate text-xs font-medium">
                      {item.title}
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-danger">
                      {item.score}%
                    </span>
                  </Link>
                ))}
                {memoryHealth.atRisk.slice(0, 2).map((topic) => (
                  <Link
                    key={topic.id}
                    href={`/concepts/${topic.id}`}
                    className="flex items-center gap-2 rounded-xl border border-border p-2.5 transition-colors hover:bg-accent"
                  >
                    <span className="min-w-0 flex-1 truncate text-xs font-medium">
                      {topic.name}
                    </span>
                    <Badge variant="warning">at risk</Badge>
                  </Link>
                ))}
                {memoryHealth.neglected.slice(0, 2).map((topic) => (
                  <Link
                    key={topic.id}
                    href={`/concepts/${topic.id}`}
                    className="flex items-center gap-2 rounded-xl border border-border p-2.5 transition-colors hover:bg-accent"
                  >
                    <span className="min-w-0 flex-1 truncate text-xs font-medium">
                      {topic.name}
                    </span>
                    <Badge variant="default">neglected</Badge>
                  </Link>
                ))}
              </div>
            )}
            <div className="mt-2 flex items-center gap-3">
              <ProgressRing value={memoryHealth.overallScore} size={40} stroke={5}>
                <span className="text-[10px] font-bold tabular">
                  {memoryHealth.overallScore}
                </span>
              </ProgressRing>
              <span className="text-xs text-muted-foreground">overall recall score</span>
            </div>
          </div>

          {/* Missed work */}
          <div>
            <p className="text-caption text-muted-foreground mb-2">While You Were Away</p>
            {missedWork.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">Nothing missed. Nice.</p>
            ) : (
              <MissedWorkPanel items={missedWork} bare />
            )}
          </div>

          {/* Academic commitments */}
          <div>
            <p className="text-caption text-muted-foreground mb-2">Academic Commitments</p>
            {upcomingAssignments.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">No upcoming assignments.</p>
            ) : (
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
                      {d.urgent ? (
                        <AlertTriangle className="size-3.5" />
                      ) : (
                        <CalendarCheck className="size-3.5" />
                      )}
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
            )}
          </div>

          {/* Pattern risk — previously never surfaced anywhere */}
          {patternRisks.length > 0 && (
            <div>
              <p className="text-caption text-muted-foreground mb-2">Pattern Risk</p>
              <div className="space-y-1.5">
                {patternRisks.slice(0, 4).map((entry) => (
                  <Link
                    key={`${entry.entityType}-${entry.entityId}`}
                    href={entry.recommendedAction.href}
                    className="flex items-center gap-2 rounded-xl border border-border p-2.5 transition-colors hover:bg-accent"
                  >
                    <span className="min-w-0 flex-1 truncate text-xs font-medium">
                      {entry.name}
                    </span>
                    <Badge variant={RISK_LEVEL_META[entry.riskLevel].badgeVariant}>
                      {RISK_LEVEL_META[entry.riskLevel].label}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}
