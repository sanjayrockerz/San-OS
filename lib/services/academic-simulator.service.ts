import type { Repositories } from "@/lib/repositories";

import { AcademicPerformanceService } from "./academic-performance.service";
import { BaseService } from "./base.service";
import { gradePointFromCourse } from "./gpa-projection.service";
import type { WhatIfScenarioInput } from "@/lib/validators/academic";

export type RecoveryDifficulty = "trivial" | "easy" | "moderate" | "hard" | "severe";

export interface WhatIfResult {
  scenario: WhatIfScenarioInput;
  label: string;
  baselineCgpa: number | null;
  projectedCgpa: number | null;
  delta: number | null;
  creditsImpact: number;
  recoveryDifficulty: RecoveryDifficulty;
  explanation: string;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function difficultyFromDelta(delta: number): RecoveryDifficulty {
  if (delta >= 0) return "trivial";
  const magnitude = Math.abs(delta);
  if (magnitude < 0.05) return "easy";
  if (magnitude < 0.15) return "moderate";
  if (magnitude < 0.35) return "hard";
  return "severe";
}

/**
 * AcademicSimulatorService — the what-if engine. Every scenario re-runs the
 * exact same credit-weighted CGPA arithmetic as AcademicPerformanceService
 * with one hypothetical input changed, so the projected delta is always a
 * real recomputation, never an estimate.
 */
export class AcademicSimulatorService extends BaseService {
  private readonly performance: AcademicPerformanceService;

  constructor(repos: Repositories) {
    super(repos);
    this.performance = new AcademicPerformanceService(repos);
  }

  async simulate(userId: string, scenario: WhatIfScenarioInput): Promise<WhatIfResult> {
    const baseline = await this.performance.snapshot(userId);
    const baselineCgpa = baseline.currentCgpa;

    switch (scenario.type) {
      case "future_semester_gpa":
        return this.simulateFutureSemester(baseline, scenario, baselineCgpa);
      case "course_grade":
        return this.simulateCourseGrade(userId, scenario, baselineCgpa);
      case "repeat_course":
        return this.simulateCourseGrade(userId, scenario, baselineCgpa, "Repeating");
      case "backlog":
        return this.simulateBacklog(userId, scenario, baselineCgpa);
    }
  }

  private simulateFutureSemester(
    baseline: Awaited<ReturnType<AcademicPerformanceService["snapshot"]>>,
    scenario: WhatIfScenarioInput & { type: "future_semester_gpa" },
    baselineCgpa: number | null,
  ): WhatIfResult {
    const completed = baseline.semesters.filter((s) => s.status === "completed");
    const avgCredits = completed.length
      ? completed.reduce((sum, s) => sum + s.totalCredits, 0) / completed.length
      : 20;

    const earnedCredits = baseline.totalEarnedCredits;
    const earnedPoints = baselineCgpa !== null ? baselineCgpa * earnedCredits : 0;
    const projectedCgpa = round2(
      (earnedPoints + avgCredits * scenario.gpa) / (earnedCredits + avgCredits),
    );
    const delta = baselineCgpa !== null ? round2(projectedCgpa - baselineCgpa) : null;

    return {
      scenario,
      label: `If you score ${scenario.gpa.toFixed(1)} GPA next semester`,
      baselineCgpa,
      projectedCgpa,
      delta,
      creditsImpact: round2(avgCredits),
      recoveryDifficulty: delta !== null ? difficultyFromDelta(delta) : "easy",
      explanation:
        delta === null
          ? `Projects to ${projectedCgpa.toFixed(2)} CGPA over ≈${Math.round(avgCredits)} credits.`
          : delta >= 0
            ? `Your CGPA rises from ${baselineCgpa?.toFixed(2)} to ${projectedCgpa.toFixed(2)} (+${delta.toFixed(2)}).`
            : `Your CGPA falls from ${baselineCgpa?.toFixed(2)} to ${projectedCgpa.toFixed(2)} (${delta.toFixed(2)}).`,
    };
  }

  private async simulateCourseGrade(
    userId: string,
    scenario: (WhatIfScenarioInput & { type: "course_grade" }) | (WhatIfScenarioInput & { type: "repeat_course" }),
    baselineCgpa: number | null,
    verbPrefix = "Improving",
  ): Promise<WhatIfResult> {
    const course = await this.repos.iitCourses.findById(scenario.courseId);
    if (!course) {
      return {
        scenario,
        label: "Course not found",
        baselineCgpa,
        projectedCgpa: baselineCgpa,
        delta: 0,
        creditsImpact: 0,
        recoveryDifficulty: "trivial",
        explanation: "That course no longer exists.",
      };
    }

    const currentGradePoint = gradePointFromCourse(course) ?? 0;
    const credits = course.credits ?? 0;

    const allCourses = await this.repos.iitCourses.findByUser(userId);
    const graded = allCourses.filter((c) => c.status === "completed" && gradePointFromCourse(c) !== null);
    let creditSum = 0;
    let weightedSum = 0;
    for (const c of graded) {
      const gp = gradePointFromCourse(c) ?? 0;
      const cr = c.credits ?? 0;
      creditSum += cr;
      weightedSum += cr * gp;
    }

    // Swap this one course's contribution for the hypothetical grade point.
    const weightedWithout = weightedSum - credits * currentGradePoint;
    const projectedWeighted = weightedWithout + credits * scenario.gradePoint;
    const projectedCgpa = creditSum > 0 ? round2(projectedWeighted / creditSum) : null;
    const delta = baselineCgpa !== null && projectedCgpa !== null ? round2(projectedCgpa - baselineCgpa) : null;

    return {
      scenario,
      label: `${verbPrefix} ${course.name} to grade point ${scenario.gradePoint.toFixed(1)}`,
      baselineCgpa,
      projectedCgpa,
      delta,
      creditsImpact: credits,
      recoveryDifficulty: difficultyFromDelta(delta ?? 0),
      explanation:
        delta === null
          ? "Not enough graded courses yet to project a CGPA."
          : delta >= 0
            ? `${verbPrefix} ${course.name} from grade point ${currentGradePoint.toFixed(1)} to ${scenario.gradePoint.toFixed(1)} raises CGPA by ${delta.toFixed(2)}.`
            : `That change lowers CGPA by ${Math.abs(delta).toFixed(2)}.`,
    };
  }

  private async simulateBacklog(
    userId: string,
    scenario: WhatIfScenarioInput & { type: "backlog" },
    baselineCgpa: number | null,
  ): Promise<WhatIfResult> {
    const course = await this.repos.iitCourses.findById(scenario.courseId);
    if (!course) {
      return {
        scenario,
        label: "Course not found",
        baselineCgpa,
        projectedCgpa: baselineCgpa,
        delta: 0,
        creditsImpact: 0,
        recoveryDifficulty: "trivial",
        explanation: "That course no longer exists.",
      };
    }

    // A backlog (fail) means a grade point of 0 for that course's credits.
    const result = await this.simulateCourseGrade(
      userId,
      { type: "course_grade", courseId: scenario.courseId, gradePoint: 0 },
      baselineCgpa,
      "Failing",
    );

    return {
      ...result,
      scenario,
      label: `If you get a backlog in ${course.name}`,
      recoveryDifficulty: result.delta !== null && result.delta < -0.2 ? "severe" : "hard",
      explanation:
        result.delta === null
          ? result.explanation
          : `A backlog in ${course.name} (${course.credits ?? 0} credits) drops your CGPA by ${Math.abs(result.delta).toFixed(2)}. You'll need to clear it in a later semester to recover those credits.`,
    };
  }
}
