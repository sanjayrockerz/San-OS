import type { Repositories } from "@/lib/repositories";
import type { Tables } from "@/types/database";

import { BaseService } from "./base.service";
import { gradePointFromCourse } from "./gpa-projection.service";

export type HealthCategory = "excellent" | "good" | "warning" | "critical";

export interface CourseHealth {
  courseId: string;
  code: string | null;
  name: string;
  /** 0-100 — assignment/lecture completion, lateness, and grade trend blended. */
  healthScore: number;
  category: HealthCategory;
  assignmentCompletionRate: number;
  lectureCompletionRate: number;
  lateAssignments: number;
  missedAssignments: number;
}

export type AssignmentRiskLevel = "low" | "medium" | "high" | "critical";

export interface AssignmentRisk {
  assignmentId: string;
  courseId: string | null;
  title: string;
  dueDate: string | null;
  status: Tables<"iit_assignments">["status"];
  /** 0-100, higher = more dangerous. */
  riskScore: number;
  riskLevel: AssignmentRiskLevel;
  reason: string;
}

export type CreditHealthStatus = "on_track" | "behind";

export interface CreditIntelligence {
  earnedCredits: number;
  inProgressCredits: number;
  plannedCredits: number;
  totalCredits: number;
  status: CreditHealthStatus;
}

function categorize(score: number): HealthCategory {
  if (score >= 80) return "excellent";
  if (score >= 60) return "good";
  if (score >= 40) return "warning";
  return "critical";
}

function levelFromScore(score: number): AssignmentRiskLevel {
  if (score >= 80) return "critical";
  if (score >= 60) return "high";
  if (score >= 35) return "medium";
  return "low";
}

function clampScore(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

/**
 * AcademicHealthService — measures academic readiness, not storage or
 * activity. Reads iit_courses/iit_assignments/iit_lectures directly and does
 * not duplicate HabitEngineService, which remains the source of truth for
 * streaks and missed-work consistency signals.
 */
export class AcademicHealthService extends BaseService {
  constructor(repos: Repositories) {
    super(repos);
  }

  async courseHealth(userId: string): Promise<CourseHealth[]> {
    const [courses, assignments, lectures] = await Promise.all([
      this.repos.iitCourses.findByUser(userId),
      this.repos.iitAssignments.findByUser(userId),
      this.repos.iitLectures.findByUser(userId),
    ]);

    return courses
      .filter((c) => c.status !== "dropped")
      .map((course) => this.scoreCourse(course, assignments, lectures));
  }

  async assignmentRisk(userId: string): Promise<AssignmentRisk[]> {
    const assignments = await this.repos.iitAssignments.findByUser(userId);
    const nowMs = Date.now();
    return assignments
      .filter((a) => a.status !== "graded")
      .map((a) => this.scoreAssignment(a, nowMs))
      .sort((a, b) => b.riskScore - a.riskScore);
  }

  async creditIntelligence(userId: string): Promise<CreditIntelligence> {
    const [courses, courseHealth] = await Promise.all([
      this.repos.iitCourses.findByUser(userId),
      this.courseHealth(userId),
    ]);

    let earned = 0;
    let inProgress = 0;
    let planned = 0;
    for (const c of courses) {
      const credits = c.credits ?? 0;
      if (c.status === "completed") earned += credits;
      else if (c.status === "in_progress") inProgress += credits;
      else if (c.status === "planned") planned += credits;
    }

    const anyInProgressCritical = courseHealth.some(
      (h) => h.category === "critical" && (h.assignmentCompletionRate < 1 || h.missedAssignments > 0),
    );

    return {
      earnedCredits: earned,
      inProgressCredits: inProgress,
      plannedCredits: planned,
      totalCredits: earned + inProgress + planned,
      status: anyInProgressCritical ? "behind" : "on_track",
    };
  }

  private scoreCourse(
    course: Tables<"iit_courses">,
    allAssignments: Tables<"iit_assignments">[],
    allLectures: Tables<"iit_lectures">[],
  ): CourseHealth {
    const assignments = allAssignments.filter((a) => a.course_id === course.id);
    const lectures = allLectures.filter((l) => l.course_id === course.id);

    const resolved = assignments.filter((a) => a.status === "submitted" || a.status === "graded");
    const lateOrMissed = assignments.filter((a) => a.status === "late" || a.status === "missed");
    const assignmentCompletionRate = assignments.length ? resolved.length / assignments.length : 1;
    const latenessPenalty = assignments.length ? lateOrMissed.length / assignments.length : 0;

    const watched = lectures.filter((l) => l.status === "completed");
    const lectureCompletionRate = lectures.length ? watched.length / lectures.length : 1;

    const gradePoint = gradePointFromCourse(course);
    const gradeComponent = ((gradePoint ?? assignmentCompletionRate * 10) / 10) * 20;

    const healthScore = clampScore(
      assignmentCompletionRate * 35 +
        lectureCompletionRate * 25 +
        (1 - latenessPenalty) * 20 +
        gradeComponent,
    );

    return {
      courseId: course.id,
      code: course.code,
      name: course.name,
      healthScore,
      category: categorize(healthScore),
      assignmentCompletionRate,
      lectureCompletionRate,
      lateAssignments: assignments.filter((a) => a.status === "late").length,
      missedAssignments: assignments.filter((a) => a.status === "missed").length,
    };
  }

  private scoreAssignment(a: Tables<"iit_assignments">, nowMs: number): AssignmentRisk {
    const dueMs = a.due_date ? new Date(a.due_date).getTime() : null;
    const daysUntil = dueMs !== null ? (dueMs - nowMs) / 86_400_000 : null;
    const isStarted = a.status === "in_progress" || a.status === "submitted";

    let riskScore: number;
    let reason: string;

    if (a.status === "missed") {
      riskScore = 100;
      reason = "Deadline passed with no submission.";
    } else if (a.status === "late") {
      riskScore = 85;
      reason = "Submitted late.";
    } else if (daysUntil === null) {
      riskScore = isStarted ? 20 : 35;
      reason = "No due date set.";
    } else if (daysUntil < 0) {
      riskScore = 95;
      reason = `Overdue by ${Math.abs(Math.round(daysUntil))} day(s).`;
    } else {
      const urgency = clamp01(1 - daysUntil / 7);
      const notStartedPenalty = isStarted ? 0 : 20;
      riskScore = urgency * 80 + notStartedPenalty;
      reason =
        daysUntil < 1
          ? "Due today and not yet started."
          : `Due in ${Math.ceil(daysUntil)} day(s)${isStarted ? "" : ", not started"}.`;
    }

    riskScore = clampScore(riskScore);
    return {
      assignmentId: a.id,
      courseId: a.course_id,
      title: a.title,
      dueDate: a.due_date,
      status: a.status,
      riskScore,
      riskLevel: levelFromScore(riskScore),
      reason,
    };
  }
}
