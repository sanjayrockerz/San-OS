import Link from "next/link";
import { GraduationCap, AlertTriangle, Sparkles, LineChart, NotebookPen, ArrowUpRight } from "lucide-react";

import { Section } from "@/components/layout/page-transition";
import { SectionHeading } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { ProgressRing } from "@/components/charts/progress-ring";
import { cn } from "@/lib/utils";
import type { AcademicAction, AcademicInsight } from "@/lib/services/academic-coach.service";
import type { HealthCategory } from "@/lib/services/academic-health.service";
import type { AssignmentRiskLevel } from "@/lib/services/academic-health.service";
import type { CreditHealthStatus } from "@/lib/services/academic-health.service";
import { CATEGORY_TEXT, CATEGORY_TINT } from "@/lib/design/category";
import { HEALTH_CATEGORY_META, RISK_LEVEL_META } from "@/lib/design/status";
import { ActionRow } from "./action-row";

export interface CourseHealthView {
  courseId: string;
  code: string | null;
  name: string;
  healthScore: number;
  category: HealthCategory;
  assignmentCompletionRate: number;
  lectureCompletionRate: number;
  lateAssignments: number;
  missedAssignments: number;
}

export interface AssignmentRiskView {
  assignmentId: string;
  courseId: string | null;
  courseName: string;
  title: string;
  riskLevel: AssignmentRiskLevel;
  reason: string;
}

export interface GpaView {
  currentGpa: number | null;
  targetGpa: number | null;
  projectedGpa: number | null;
  helping: string[];
  hurting: string[];
}

export interface WeeklyReviewView {
  assignmentsCompleted: number;
  assignmentsMissed: number;
  strongestCourse: string | null;
  weakestCourse: string | null;
}

export interface CgpaView {
  currentCgpa: number | null;
  projectedGraduationCgpa: number | null;
  targetCgpa: number | null;
  requiredGpaPerRemainingSemester: number | null;
  remainingSemesters: number;
  explanation: string;
}

export interface AcademicCommandCenterData {
  creditStatus: CreditHealthStatus;
  courseHealth: CourseHealthView[];
  assignmentRisk: AssignmentRiskView[];
  gpa: GpaView;
  cgpa: CgpaView;
  actions: AcademicAction[];
  insights: AcademicInsight[];
  weeklyReview: WeeklyReviewView;
}

/**
 * Academic Command Center — the diagnosis surface for "what should I study
 * today / what's at risk / can I hit my GPA goal", mirroring
 * KnowledgeCommandCenter's role for the academic domain. /iit-workspace stays
 * the CRUD surface (courses, assignments, lectures); this page never writes,
 * only interprets AcademicHealthService/GpaProjectionService/AcademicCoachService.
 */
export function AcademicCommandCenter({ data }: { data: AcademicCommandCenterData }) {
  return (
    <div className="space-y-5">
      <HealthOverview courseHealth={data.courseHealth} creditStatus={data.creditStatus} />
      <AssignmentRiskCenter risks={data.assignmentRisk} />
      <RecommendedActions actions={data.actions} />
      <CgpaInsightsPanel insights={data.insights} />
      <CgpaEnginePanel cgpa={data.cgpa} />
      <GpaProjectionPanel gpa={data.gpa} />
      <CourseHealthGrid courses={data.courseHealth} />
      <WeeklyReview review={data.weeklyReview} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Academic Health Overview                                                    */
/* -------------------------------------------------------------------------- */

function HealthOverview({
  courseHealth,
  creditStatus,
}: {
  courseHealth: CourseHealthView[];
  creditStatus: CreditHealthStatus;
}) {
  const overallScore = courseHealth.length
    ? Math.round(courseHealth.reduce((sum, c) => sum + c.healthScore, 0) / courseHealth.length)
    : 0;
  const counts = {
    excellent: courseHealth.filter((c) => c.category === "excellent").length,
    good: courseHealth.filter((c) => c.category === "good").length,
    warning: courseHealth.filter((c) => c.category === "warning").length,
    critical: courseHealth.filter((c) => c.category === "critical").length,
  };

  return (
    <Section>
      <div className="surface-card rounded-2xl border-category-academic/25 p-5">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <GraduationCap className={cn("size-4.5", CATEGORY_TEXT.academic)} />
            <h2 className="text-section">Academic Health</h2>
          </div>
          <Badge variant={creditStatus === "on_track" ? "success" : "danger"}>
            {creditStatus === "on_track" ? "On Track" : "Behind"}
          </Badge>
        </div>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
          <ProgressRing value={overallScore} size={88} stroke={8}>
            <span className="text-lg font-bold tabular">{overallScore}</span>
            <span className="text-[10px] text-muted-foreground">health</span>
          </ProgressRing>
          <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
            {(["excellent", "good", "warning", "critical"] as HealthCategory[]).map((cat) => (
              <div key={cat} className="rounded-xl border border-border p-3 text-center">
                <p className="text-2xl font-bold tabular">{counts[cat]}</p>
                <p className="text-[11px] text-muted-foreground">{HEALTH_CATEGORY_META[cat].label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/* Assignment Risk Center                                                      */
/* -------------------------------------------------------------------------- */

function AssignmentRiskCenter({ risks }: { risks: AssignmentRiskView[] }) {
  if (risks.length === 0) {
    return (
      <Section>
        <div className="surface-card rounded-2xl p-5">
          <SectionHeading title="Assignment Risk Center" />
          <p className="text-xs text-muted-foreground py-2">
            No assignments at risk right now — nothing dangerous on the horizon.
          </p>
        </div>
      </Section>
    );
  }

  return (
    <Section>
      <div className="surface-card rounded-2xl p-5">
        <SectionHeading title="Assignment Risk Center" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {risks.slice(0, 9).map((risk) => {
            const meta = RISK_LEVEL_META[risk.riskLevel];
            const href = risk.courseId ? `/iit-workspace/${risk.courseId}` : "/iit-workspace";
            return (
              <Link
                key={risk.assignmentId}
                href={href}
                className="lift group flex flex-col gap-2 rounded-xl border border-border bg-card p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-lg",
                      CATEGORY_TINT.critical,
                    )}
                  >
                    <AlertTriangle className="size-3.5" />
                  </span>
                  <Badge variant={meta.badgeVariant}>{meta.label}</Badge>
                </div>
                <div>
                  <p className="text-sm font-semibold line-clamp-1">{risk.title}</p>
                  <p className="text-[11px] text-muted-foreground">{risk.courseName}</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground mt-0.5">{risk.reason}</p>
                </div>
                <span className="mt-auto flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  Open assignment <ArrowUpRight className="size-3" />
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
/* Recommended actions (Academic Coach)                                       */
/* -------------------------------------------------------------------------- */

function RecommendedActions({ actions }: { actions: AcademicAction[] }) {
  if (actions.length === 0) {
    return (
      <Section>
        <div className="surface-card rounded-2xl p-5">
          <div className="mb-1 flex items-center gap-2">
            <Sparkles className={cn("size-4.5", CATEGORY_TEXT.academic)} />
            <h2 className="text-section">Academic Coach</h2>
          </div>
          <p className="text-xs text-muted-foreground py-2">
            Nothing to act on right now — every course is healthy.
          </p>
        </div>
      </Section>
    );
  }

  return (
    <Section>
      <div className="surface-card rounded-2xl p-5">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className={cn("size-4.5", CATEGORY_TEXT.academic)} />
          <h2 className="text-section">Academic Coach</h2>
        </div>
        <div className="space-y-2">
          {actions.slice(0, 6).map((action) => (
            <ActionRow key={action.id} action={action} />
          ))}
        </div>
      </div>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/* CGPA Insights Panel — explainable, maths-derived grade recommendations    */
/* -------------------------------------------------------------------------- */

function CgpaInsightsPanel({ insights }: { insights: AcademicInsight[] }) {
  if (insights.length === 0) return null;

  return (
    <Section>
      <div className="surface-card rounded-2xl p-5">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className={cn("size-4.5", CATEGORY_TEXT.academic)} />
          <h2 className="text-section">CGPA Opportunity Map</h2>
        </div>
        <div className="space-y-2">
          {insights.map((insight) => (
            <Link
              key={insight.id}
              href={insight.href}
              className="lift group flex items-start gap-3 rounded-xl border border-border bg-card p-3"
            >
              <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", CATEGORY_TINT.academic)}>
                <GraduationCap className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium line-clamp-1">{insight.title}</p>
                <p className="line-clamp-2 text-xs text-muted-foreground mt-0.5">{insight.explanation}</p>
              </div>
              {insight.cgpaDelta !== null && insight.cgpaDelta > 0 && (
                <span className="shrink-0 self-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400">
                  +{insight.cgpaDelta.toFixed(2)} CGPA
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/* CGPA Engine Panel — cumulative across all semesters                        */
/* -------------------------------------------------------------------------- */

function CgpaEnginePanel({ cgpa }: { cgpa: CgpaView }) {
  return (
    <Section>
      <div className="surface-card rounded-2xl p-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <LineChart className={cn("size-4.5", CATEGORY_TEXT.academic)} />
            <h2 className="text-section">CGPA Engine</h2>
          </div>
          <div className="flex items-center gap-3 text-xs font-medium text-primary">
            <Link href="/academic/history" className="hover:underline">
              Academic History
            </Link>
            <Link href="/academic/planner" className="hover:underline">
              GPA Planner →
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-center">
          <div className="rounded-xl border border-border p-3">
            <p className="text-2xl font-bold tabular">{cgpa.currentCgpa?.toFixed(2) ?? "—"}</p>
            <p className="text-[11px] text-muted-foreground">Current CGPA</p>
          </div>
          <div className="rounded-xl border border-border p-3">
            <p className="text-2xl font-bold tabular">{cgpa.projectedGraduationCgpa?.toFixed(2) ?? "—"}</p>
            <p className="text-[11px] text-muted-foreground">Projected Graduation</p>
          </div>
          <div className="rounded-xl border border-border p-3">
            <p className="text-2xl font-bold tabular">{cgpa.targetCgpa?.toFixed(2) ?? "—"}</p>
            <p className="text-[11px] text-muted-foreground">Target CGPA</p>
          </div>
          <div className="rounded-xl border border-border p-3">
            <p className="text-2xl font-bold tabular">{cgpa.requiredGpaPerRemainingSemester?.toFixed(2) ?? "—"}</p>
            <p className="text-[11px] text-muted-foreground">Required / semester</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{cgpa.explanation}</p>
      </div>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/* GPA Projection Panel                                                        */
/* -------------------------------------------------------------------------- */

function GpaProjectionPanel({ gpa }: { gpa: GpaView }) {
  const delta =
    gpa.projectedGpa !== null && gpa.currentGpa !== null ? gpa.projectedGpa - gpa.currentGpa : null;

  return (
    <Section>
      <div className="surface-card rounded-2xl p-5">
        <div className="mb-3 flex items-center gap-2">
          <LineChart className={cn("size-4.5", CATEGORY_TEXT.academic)} />
          <h2 className="text-section">GPA Projection</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 text-center sm:grid-cols-3">
          <div className="rounded-xl border border-border p-3">
            <p className="text-2xl font-bold tabular">{gpa.currentGpa ?? "—"}</p>
            <p className="text-[11px] text-muted-foreground">Current GPA</p>
          </div>
          <div className="rounded-xl border border-border p-3">
            <p className="text-2xl font-bold tabular">{gpa.projectedGpa ?? "—"}</p>
            <p className="text-[11px] text-muted-foreground">
              Projected{delta !== null && (delta >= 0 ? " ↑" : " ↓")}
            </p>
          </div>
          <div className="rounded-xl border border-border p-3">
            <p className="text-2xl font-bold tabular">{gpa.targetGpa ?? "—"}</p>
            <p className="text-[11px] text-muted-foreground">Target GPA</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {gpa.currentGpa === null
            ? "No graded courses yet — projection will appear once a course has a grade."
            : delta === null
              ? "Projection assumes in-progress courses land at your current average."
              : delta >= 0
                ? `In-progress courses are projected to push your GPA up by ${delta.toFixed(1)}.`
                : `In-progress courses are projected to pull your GPA down by ${Math.abs(delta).toFixed(1)}.`}
        </p>
        {(gpa.helping.length > 0 || gpa.hurting.length > 0) && (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <p className="text-[11px] font-medium text-success mb-1.5">Helping</p>
              {gpa.helping.length === 0 ? (
                <p className="text-xs text-muted-foreground">None yet.</p>
              ) : (
                <ul className="space-y-1">
                  {gpa.helping.map((name) => (
                    <li key={name} className="text-xs text-muted-foreground">
                      {name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <p className="text-[11px] font-medium text-danger mb-1.5">Hurting</p>
              {gpa.hurting.length === 0 ? (
                <p className="text-xs text-muted-foreground">None yet.</p>
              ) : (
                <ul className="space-y-1">
                  {gpa.hurting.map((name) => (
                    <li key={name} className="text-xs text-muted-foreground">
                      {name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/* Course Health Grid                                                          */
/* -------------------------------------------------------------------------- */

function CourseHealthGrid({ courses }: { courses: CourseHealthView[] }) {
  if (courses.length === 0) {
    return (
      <Section>
        <div className="surface-card rounded-2xl p-5">
          <SectionHeading title="Course Health" />
          <p className="text-xs text-muted-foreground py-2">No active courses yet.</p>
        </div>
      </Section>
    );
  }

  return (
    <Section>
      <div className="surface-card rounded-2xl p-5">
        <SectionHeading title="Course Health" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => {
            const meta = HEALTH_CATEGORY_META[course.category];
            return (
              <Link
                key={course.courseId}
                href={`/iit-workspace/${course.courseId}`}
                className="lift group flex flex-col gap-2 rounded-xl border border-border bg-card p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-lg",
                      CATEGORY_TINT[meta.category],
                    )}
                  >
                    <GraduationCap className="size-3.5" />
                  </span>
                  <Badge variant={meta.badgeVariant}>{meta.label}</Badge>
                </div>
                <div>
                  <p className="text-sm font-semibold line-clamp-1">{course.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {Math.round(course.assignmentCompletionRate * 100)}% assignments ·{" "}
                    {Math.round(course.lectureCompletionRate * 100)}% lectures
                  </p>
                  {(course.lateAssignments > 0 || course.missedAssignments > 0) && (
                    <p className="text-[11px] text-danger mt-0.5">
                      {course.lateAssignments > 0 && `${course.lateAssignments} late`}
                      {course.lateAssignments > 0 && course.missedAssignments > 0 && ", "}
                      {course.missedAssignments > 0 && `${course.missedAssignments} missed`}
                    </p>
                  )}
                </div>
                <span className="mt-auto text-xs font-semibold tabular">{course.healthScore}/100</span>
              </Link>
            );
          })}
        </div>
      </div>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/* Weekly Academic Review                                                      */
/* -------------------------------------------------------------------------- */

function WeeklyReview({ review }: { review: WeeklyReviewView }) {
  return (
    <Section>
      <div className="surface-card rounded-2xl p-5">
        <div className="mb-3 flex items-center gap-2">
          <NotebookPen className={cn("size-4.5", CATEGORY_TEXT.academic)} />
          <h2 className="text-section">This Week, Reflected</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-border p-3 text-center">
            <p className="text-xl font-bold tabular text-success">{review.assignmentsCompleted}</p>
            <p className="text-[11px] text-muted-foreground">completed</p>
          </div>
          <div className="rounded-xl border border-border p-3 text-center">
            <p className="text-xl font-bold tabular text-danger">{review.assignmentsMissed}</p>
            <p className="text-[11px] text-muted-foreground">missed</p>
          </div>
          <div className="rounded-xl border border-border p-3 text-center">
            <p className="truncate text-sm font-semibold">{review.strongestCourse ?? "—"}</p>
            <p className="text-[11px] text-muted-foreground">strongest course</p>
          </div>
          <div className="rounded-xl border border-border p-3 text-center">
            <p className="truncate text-sm font-semibold">{review.weakestCourse ?? "—"}</p>
            <p className="text-[11px] text-muted-foreground">weakest course</p>
          </div>
        </div>
      </div>
    </Section>
  );
}
