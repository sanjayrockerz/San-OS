import type { Repositories } from "@/lib/repositories";
import type { Tables } from "@/types/database";

import { BaseService } from "./base.service";
import { gradePointFromCourse } from "./gpa-projection.service";

export type SemesterStatus = Tables<"academic_semesters">["status"];

export interface SemesterSummary {
  semesterId: string;
  semesterNumber: number;
  name: string;
  academicYear: string | null;
  status: SemesterStatus;
  isCurrent: boolean;
  totalCredits: number;
  earnedCredits: number;
  sgpa: number | null;
  backlogs: number;
  /** "courses" when SGPA/credits were derived from linked iit_courses rows (ground truth once the course tracker is in use); "manual" when this semester predates that and relies on the student's own entry. */
  source: "courses" | "manual";
}

export interface CgpaSnapshot {
  /** Credit-weighted average over `completed` semesters only — no projection. */
  currentCgpa: number | null;
  totalEarnedCredits: number;
  totalCredits: number;
  semesters: SemesterSummary[];
}

export type Confidence = "high" | "medium" | "low" | "infeasible";

export interface GraduationProjection {
  currentCgpa: number | null;
  /** Assumes remaining semesters land at the student's own demonstrated trend (average completed SGPA). */
  projectedGraduationCgpa: number | null;
  targetCgpa: number | null;
  remainingSemesters: number;
  remainingCredits: number;
  /** Average SGPA needed across every remaining semester to land on targetCgpa at graduation. Null if there's no target or no remaining semesters. */
  requiredGpaPerRemainingSemester: number | null;
  /** Best case: every remaining semester at a perfect 10 GPA. */
  maxPossibleCgpa: number | null;
  /** 10 minus the required GPA — how much slack exists above the bar. */
  marginForError: number | null;
  confidence: Confidence | null;
  explanation: string;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * AcademicPerformanceService — the CGPA engine. Turns permanent
 * academic_semesters records plus iit_courses grades into a credit-weighted
 * CGPA, and projects graduation outcome against the student's own stated
 * target (academic_goals). Every number here is a real weighted-average
 * computation — no heuristics, no fabricated probabilities.
 */
export class AcademicPerformanceService extends BaseService {
  constructor(repos: Repositories) {
    super(repos);
  }

  async semesters(userId: string): Promise<SemesterSummary[]> {
    const [semesters, courses] = await Promise.all([
      this.repos.academicSemesters.findOrdered(userId),
      this.repos.iitCourses.findByUser(userId),
    ]);

    return semesters.map((semester) => this.summarize(semester, courses));
  }

  async snapshot(userId: string): Promise<CgpaSnapshot> {
    const semesters = await this.semesters(userId);
    const completed = semesters.filter((s) => s.status === "completed");

    let creditSum = 0;
    let weightedSum = 0;
    let totalCredits = 0;
    for (const s of semesters) totalCredits += s.totalCredits;
    for (const s of completed) {
      if (s.sgpa === null || s.earnedCredits <= 0) continue;
      creditSum += s.earnedCredits;
      weightedSum += s.earnedCredits * s.sgpa;
    }

    return {
      currentCgpa: creditSum > 0 ? round2(weightedSum / creditSum) : null,
      totalEarnedCredits: creditSum,
      totalCredits,
      semesters,
    };
  }

  async graduationProjection(userId: string, targetCgpaOverride?: number | null): Promise<GraduationProjection> {
    const [snapshot, goals] = await Promise.all([
      this.snapshot(userId),
      this.repos.academicGoals.getForUser(userId),
    ]);

    const targetCgpa = targetCgpaOverride ?? goals?.target_cgpa ?? null;
    const totalSemesters = goals?.total_semesters ?? 8;

    const completed = snapshot.semesters.filter((s) => s.status === "completed");
    const highestSemesterNumber = snapshot.semesters.reduce(
      (max, s) => Math.max(max, s.semesterNumber),
      0,
    );
    const remainingSemesters = Math.max(0, totalSemesters - highestSemesterNumber);

    // Estimate remaining credits from the average credit load of completed
    // semesters (falls back to 20 — a typical full-time load — if there's no history yet).
    const avgCreditsPerSemester = completed.length
      ? completed.reduce((sum, s) => sum + s.totalCredits, 0) / completed.length
      : 20;
    const remainingCredits = round2(remainingSemesters * avgCreditsPerSemester);

    const earnedCredits = snapshot.totalEarnedCredits;
    const currentCgpa = snapshot.currentCgpa;
    const earnedPoints = currentCgpa !== null ? currentCgpa * earnedCredits : 0;

    // Trend projection: remaining semesters land at the student's own average completed SGPA.
    const trendSgpa = currentCgpa; // credit-weighted average IS the trend, by construction
    const projectedGraduationCgpa =
      remainingCredits > 0 && trendSgpa !== null
        ? round2((earnedPoints + remainingCredits * trendSgpa) / (earnedCredits + remainingCredits))
        : currentCgpa;

    const maxPossibleCgpa =
      remainingCredits > 0
        ? round2((earnedPoints + remainingCredits * 10) / (earnedCredits + remainingCredits))
        : currentCgpa;

    let requiredGpaPerRemainingSemester: number | null = null;
    let marginForError: number | null = null;
    let confidence: Confidence | null = null;
    let explanation: string;

    if (targetCgpa === null) {
      explanation = "Set a target CGPA in the planner to see the GPA you need each remaining semester.";
    } else if (remainingSemesters <= 0) {
      explanation = "No remaining semesters left in the programme length you set.";
    } else {
      const requiredTotalPoints = targetCgpa * (earnedCredits + remainingCredits);
      const requiredPoints = requiredTotalPoints - earnedPoints;
      const required = remainingCredits > 0 ? requiredPoints / remainingCredits : 0;
      requiredGpaPerRemainingSemester = round2(Math.max(0, required));
      marginForError = round2(10 - requiredGpaPerRemainingSemester);

      if (required > 10) {
        confidence = "infeasible";
        explanation = `Even a perfect 10 GPA every remaining semester only reaches ${maxPossibleCgpa?.toFixed(2)} CGPA — ${targetCgpa.toFixed(2)} is out of reach with ${remainingSemesters} semester(s) left.`;
      } else {
        const trendGap = trendSgpa !== null ? requiredGpaPerRemainingSemester - trendSgpa : null;
        if (trendGap === null || trendGap <= 0) {
          confidence = "high";
        } else if (trendGap <= 0.5) {
          confidence = "medium";
        } else {
          confidence = "low";
        }
        explanation = `Maintain ${requiredGpaPerRemainingSemester.toFixed(2)} GPA across the remaining ${remainingSemesters} semester(s) (≈${Math.round(remainingCredits)} credits) to graduate at ${targetCgpa.toFixed(2)} CGPA.`;
      }
    }

    return {
      currentCgpa,
      projectedGraduationCgpa,
      targetCgpa,
      remainingSemesters,
      remainingCredits,
      requiredGpaPerRemainingSemester,
      maxPossibleCgpa,
      marginForError,
      confidence,
      explanation,
    };
  }

  private summarize(
    semester: Tables<"academic_semesters">,
    allCourses: Tables<"iit_courses">[],
  ): SemesterSummary {
    const courses = allCourses.filter((c) => c.semester_id === semester.id && c.status !== "dropped");
    const graded = courses
      .map((c) => ({ course: c, gradePoint: gradePointFromCourse(c) }))
      .filter((c) => c.gradePoint !== null);

    if (graded.length > 0) {
      let creditSum = 0;
      let weightedSum = 0;
      for (const { course, gradePoint } of graded) {
        const credits = course.credits ?? 0;
        creditSum += credits;
        weightedSum += credits * (gradePoint ?? 0);
      }
      return {
        semesterId: semester.id,
        semesterNumber: semester.semester_number,
        name: semester.name,
        academicYear: semester.academic_year,
        status: semester.status,
        isCurrent: semester.is_current,
        totalCredits: courses.reduce((sum, c) => sum + (c.credits ?? 0), 0),
        earnedCredits: creditSum,
        sgpa: creditSum > 0 ? round2(weightedSum / creditSum) : (semester.sgpa ?? null),
        backlogs: semester.backlogs ?? 0,
        source: "courses",
      };
    }

    return {
      semesterId: semester.id,
      semesterNumber: semester.semester_number,
      name: semester.name,
      academicYear: semester.academic_year,
      status: semester.status,
      isCurrent: semester.is_current,
      totalCredits: semester.total_credits ?? 0,
      earnedCredits: semester.earned_credits ?? 0,
      sgpa: semester.sgpa ?? null,
      backlogs: semester.backlogs ?? 0,
      source: "manual",
    };
  }
}
