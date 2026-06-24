import type { Repositories } from "@/lib/repositories";
import type { Tables } from "@/types/database";

import { BaseService } from "./base.service";

/** 10-point scale grade-point map (IIT convention: O=10 down to F=0). */
export const GRADE_POINTS: Record<string, number> = {
  O: 10,
  "A+": 9,
  A: 8,
  "B+": 7,
  B: 6,
  "C+": 5,
  C: 4,
  D: 3,
  P: 2,
  F: 0,
};

export function gradePointFromLetter(grade: string | null): number | null {
  if (!grade) return null;
  const points = GRADE_POINTS[grade.trim().toUpperCase()];
  return points ?? null;
}

/** Falls back to marks/max_marks (scaled to /10) when no letter grade is recorded yet. */
export function gradePointFromCourse(course: Tables<"iit_courses">): number | null {
  const fromLetter = gradePointFromLetter(course.grade);
  if (fromLetter !== null) return fromLetter;
  if (course.marks != null && course.max_marks) {
    return clampGradePoint((course.marks / course.max_marks) * 10);
  }
  return null;
}

function clampGradePoint(n: number): number {
  return Math.max(0, Math.min(10, n));
}

export interface CourseGpaContribution {
  courseId: string;
  name: string;
  credits: number;
  gradePoint: number | null;
  /** credits * gradePoint, null while the course is ungraded. */
  weighted: number | null;
}

export interface GpaProjection {
  /** Credit-weighted average over completed, graded courses only. */
  currentGpa: number | null;
  /** Caller-supplied aspiration — this service has no persisted target. */
  targetGpa: number | null;
  /** currentGpa plus in-progress courses projected at the student's current trend. */
  projectedGpa: number | null;
  /** Course names scoring above the current average. */
  helping: string[];
  /** Course names scoring below the current average. */
  hurting: string[];
  contributions: CourseGpaContribution[];
}

/**
 * GpaProjectionService — turns iit_courses.grade/marks into a credit-weighted
 * GPA on the 10-point IIT scale, and projects a final GPA assuming in-progress
 * courses land at the student's current average. Read-only: it never writes
 * grades, only interprets what IitService already stores.
 */
export class GpaProjectionService extends BaseService {
  constructor(repos: Repositories) {
    super(repos);
  }

  async currentGpa(userId: string): Promise<number | null> {
    const courses = await this.repos.iitCourses.findByUser(userId);
    return this.weightedAverage(courses.filter((c) => c.status === "completed"));
  }

  async projection(userId: string, targetGpa?: number | null): Promise<GpaProjection> {
    const courses = (await this.repos.iitCourses.findByUser(userId)).filter(
      (c) => c.status !== "dropped",
    );
    const inProgressIds = new Set(
      courses.filter((c) => c.status === "in_progress").map((c) => c.id),
    );

    const contributions: CourseGpaContribution[] = courses.map((c) => {
      const gradePoint = gradePointFromCourse(c);
      const credits = c.credits ?? 0;
      return {
        courseId: c.id,
        name: c.name,
        credits,
        gradePoint,
        weighted: gradePoint !== null ? credits * gradePoint : null,
      };
    });

    const currentGpa = this.weightedAverageFromContributions(contributions);

    // Project ungraded in-progress courses at the student's current average —
    // their demonstrated trend — since no result exists yet to do better.
    const trendGradePoint = currentGpa;
    const projectedContributions = contributions.map((c) => {
      if (c.gradePoint !== null || !inProgressIds.has(c.courseId) || trendGradePoint === null) {
        return c;
      }
      return { ...c, gradePoint: trendGradePoint, weighted: c.credits * trendGradePoint };
    });
    const projectedGpa = this.weightedAverageFromContributions(projectedContributions);

    const graded = contributions.filter((c) => c.gradePoint !== null);
    const avg = currentGpa ?? 0;
    const helping = graded.filter((c) => (c.gradePoint ?? 0) > avg).map((c) => c.name);
    const hurting = graded.filter((c) => (c.gradePoint ?? 0) < avg).map((c) => c.name);

    return {
      currentGpa,
      targetGpa: targetGpa ?? null,
      projectedGpa,
      helping,
      hurting,
      contributions,
    };
  }

  private weightedAverage(courses: Tables<"iit_courses">[]): number | null {
    let creditSum = 0;
    let weightedSum = 0;
    for (const c of courses) {
      const gp = gradePointFromCourse(c);
      if (gp === null) continue;
      const credits = c.credits ?? 0;
      creditSum += credits;
      weightedSum += credits * gp;
    }
    return creditSum > 0 ? round1(weightedSum / creditSum) : null;
  }

  private weightedAverageFromContributions(
    contributions: CourseGpaContribution[],
  ): number | null {
    let creditSum = 0;
    let weightedSum = 0;
    for (const c of contributions) {
      if (c.gradePoint === null) continue;
      creditSum += c.credits;
      weightedSum += c.weighted ?? c.credits * c.gradePoint;
    }
    return creditSum > 0 ? round1(weightedSum / creditSum) : null;
  }
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
