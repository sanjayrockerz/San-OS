import type { Repositories } from "@/lib/repositories";

import {
  AcademicHealthService,
  type CourseHealth,
} from "./academic-health.service";
import { AcademicPerformanceService } from "./academic-performance.service";
import { BaseService } from "./base.service";
import { gradePointFromCourse } from "./gpa-projection.service";
import { scoreAction } from "./student-action-scoring";
import type { RiskEntry, RiskLevel, StudentAction } from "./student-intelligence-core.service";

export interface AcademicAction extends StudentAction {
  source: "iit";
}

/** An explainable, mathematically-derived recommendation — never "study more." */
export interface AcademicInsight {
  id: string;
  title: string;
  /** e.g. "Improving Operating Systems from B to A raises projected CGPA to 8.96." */
  explanation: string;
  cgpaDelta: number | null;
  estimatedStudyHours: number | null;
  priority: number;
  href: string;
}

const HEALTH_RISK_LEVEL: Record<CourseHealth["category"], RiskLevel | null> = {
  excellent: null,
  good: null,
  warning: "medium",
  critical: "high",
};

/**
 * AcademicCoachService — the decision engine for the academic domain. Mirrors
 * KnowledgeCoachService: maps AcademicHealthService signals 1:1 onto
 * StudentAction/RiskEntry using the shared scoring rubric so they plug
 * straight into StudentIntelligenceCoreService's existing ranked action list
 * and risk register, instead of a parallel academic dashboard.
 *
 * Assignment risk is only surfaced here for not-yet-overdue assignments —
 * once an assignment is overdue/late/missed, HabitEngineService's
 * missed-work queue already owns that signal (entityType "habit"), so this
 * service deliberately excludes it to avoid two risk entries for one
 * problem.
 */
export class AcademicCoachService extends BaseService {
  private readonly health: AcademicHealthService;
  private readonly performance: AcademicPerformanceService;

  constructor(repos: Repositories) {
    super(repos);
    this.health = new AcademicHealthService(repos);
    this.performance = new AcademicPerformanceService(repos);
  }

  /** Course-health actions only — assignment due-date actions already come from StudentIntelligenceCore's own upcoming-assignments signal. */
  async actions(userId: string): Promise<AcademicAction[]> {
    const courseHealth = await this.health.courseHealth(userId);

    return courseHealth
      .filter((c) => c.category === "critical" || c.category === "warning")
      .map((course) => {
        const urgency = course.category === "critical" ? 0.7 : 0.45;
        const impact = 0.65;
        const momentum = 0.2;
        return {
          id: `review_course-${course.courseId}`,
          kind: "review_course" as const,
          source: "iit" as const,
          title: `${course.name} health is ${course.category}`,
          detail: courseHealthReason(course),
          href: `/iit-workspace/${course.courseId}`,
          entityId: course.courseId,
          estimatedMinutes: 15,
          urgency,
          impact,
          momentum,
          score: scoreAction({ urgency, impact, momentum }),
          lastTouchedAt: null,
        };
      })
      .sort((a, b) => b.score - a.score);
  }

  async risks(userId: string): Promise<RiskEntry[]> {
    const [courseHealth, assignmentRisk] = await Promise.all([
      this.health.courseHealth(userId),
      this.health.assignmentRisk(userId),
    ]);

    const entries: RiskEntry[] = [];

    for (const course of courseHealth) {
      const riskLevel = HEALTH_RISK_LEVEL[course.category];
      if (!riskLevel) continue;
      entries.push({
        entityType: "course",
        entityId: course.courseId,
        name: course.name,
        riskLevel,
        reason: courseHealthReason(course),
        recommendedAction: {
          label: `Review ${course.name}`,
          href: `/iit-workspace/${course.courseId}`,
          entityId: course.courseId,
        },
      });
    }

    const nowMs = Date.now();
    for (const risk of assignmentRisk) {
      if (risk.status === "missed" || risk.status === "late") continue;
      const daysUntil = risk.dueDate ? (new Date(risk.dueDate).getTime() - nowMs) / 86_400_000 : null;
      if (daysUntil !== null && daysUntil < 0) continue;
      if (risk.riskLevel !== "high" && risk.riskLevel !== "critical") continue;

      entries.push({
        entityType: "assignment",
        entityId: risk.assignmentId,
        name: risk.title,
        riskLevel: risk.riskLevel,
        reason: risk.reason,
        recommendedAction: {
          label: `Open ${risk.title}`,
          href: "/iit-workspace",
          entityId: risk.assignmentId,
        },
      });
    }

    const projection = await this.performance.graduationProjection(userId);
    if (projection.targetCgpa !== null && projection.confidence) {
      const riskLevel: RiskLevel | null =
        projection.confidence === "infeasible"
          ? "critical"
          : projection.confidence === "low"
            ? "high"
            : projection.confidence === "medium"
              ? "medium"
              : null;
      if (riskLevel) {
        entries.push({
          entityType: "cgpa",
          entityId: userId,
          name: `${projection.targetCgpa.toFixed(2)} CGPA target`,
          riskLevel,
          reason: projection.explanation,
          recommendedAction: {
            label: "Open GPA Planner",
            href: "/academic/planner",
            entityId: userId,
          },
        });
      }
    }

    return entries;
  }

  /**
   * Explainable, mathematically-derived recommendations: for every graded,
   * completed course this tests "what if this course's grade point were one
   * step higher" via the real CGPA arithmetic and surfaces the highest-impact
   * ones — never a generic "study more."
   */
  async insights(userId: string): Promise<AcademicInsight[]> {
    const [courses, snapshot] = await Promise.all([
      this.repos.iitCourses.findByUser(userId),
      this.performance.snapshot(userId),
    ]);

    const baselineCgpa = snapshot.currentCgpa;
    if (baselineCgpa === null) return [];

    const completed = courses.filter((c) => c.status === "completed" && c.grade !== null);
    const graded = completed
      .map((c) => ({ course: c, gradePoint: gradePointFromCourse(c) }))
      .filter((c): c is { course: typeof completed[number]; gradePoint: number } => c.gradePoint !== null && c.gradePoint < 10);

    let creditSum = 0;
    let weightedSum = 0;
    for (const c of completed) {
      const gp = gradePointFromCourse(c);
      if (gp === null) continue;
      const credits = c.credits ?? 0;
      creditSum += credits;
      weightedSum += credits * gp;
    }
    if (creditSum === 0) return [];

    const insights: AcademicInsight[] = graded
      .map(({ course, gradePoint }) => {
        const nextStep = Math.min(10, gradePoint + 1);
        const credits = course.credits ?? 0;
        const projectedWeighted = weightedSum - credits * gradePoint + credits * nextStep;
        const projectedCgpa = Math.round((projectedWeighted / creditSum) * 100) / 100;
        const cgpaDelta = Math.round((projectedCgpa - baselineCgpa) * 100) / 100;
        const estimatedStudyHours = Math.round(credits * 5); // one extra grade step ≈ 5h/credit of focused work
        return {
          id: `insight-${course.id}`,
          title: `${course.name}: one grade step up`,
          explanation: `Raising ${course.name} from grade point ${gradePoint.toFixed(1)} to ${nextStep.toFixed(1)} lifts your projected CGPA from ${baselineCgpa.toFixed(2)} to ${projectedCgpa.toFixed(2)}.`,
          cgpaDelta,
          estimatedStudyHours,
          priority: cgpaDelta,
          href: `/iit-workspace/${course.id}`,
        };
      })
      .filter((i) => i.cgpaDelta > 0)
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 5);

    return insights;
  }
}

function courseHealthReason(course: CourseHealth): string {
  const parts = [
    `${Math.round(course.assignmentCompletionRate * 100)}% assignments complete`,
    `${Math.round(course.lectureCompletionRate * 100)}% lectures watched`,
  ];
  if (course.lateAssignments > 0) parts.push(`${course.lateAssignments} late`);
  if (course.missedAssignments > 0) parts.push(`${course.missedAssignments} missed`);
  return `${parts.join(", ")}.`;
}
