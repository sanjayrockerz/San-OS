import type { Repositories } from "@/lib/repositories";

import {
  AcademicHealthService,
  type CourseHealth,
} from "./academic-health.service";
import { BaseService } from "./base.service";
import { scoreAction } from "./student-action-scoring";
import type { RiskEntry, RiskLevel, StudentAction } from "./student-intelligence-core.service";

export interface AcademicAction extends StudentAction {
  source: "iit";
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

  constructor(repos: Repositories) {
    super(repos);
    this.health = new AcademicHealthService(repos);
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

    return entries;
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
