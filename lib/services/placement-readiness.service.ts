import type { Repositories } from "@/lib/repositories";

import { AcademicPerformanceService } from "./academic-performance.service";
import { BaseService } from "./base.service";

export type ReadinessLevel = "on_track" | "at_risk" | "needs_target";

export interface PlacementReadiness {
  dreamCompany: string | null;
  targetCgpa: number | null;
  currentCgpa: number | null;
  projectedGraduationCgpa: number | null;
  /** projectedGraduationCgpa - targetCgpa. Positive means ahead, negative means behind. */
  gap: number | null;
  readiness: ReadinessLevel;
  remainingSemesters: number;
  requiredGpaPerRemainingSemester: number | null;
  explanation: string;
}

/**
 * PlacementReadinessService — compares the CGPA engine's graduation
 * projection against the student's own stated target and dream company
 * (academic_goals). Deliberately does not hardcode per-company CGPA cutoffs:
 * those vary by year and are rarely public, so inventing numbers would be a
 * fake prediction. Instead it reads the student's own self-set bar and
 * reports the real, computed gap to it.
 */
export class PlacementReadinessService extends BaseService {
  private readonly performance: AcademicPerformanceService;

  constructor(repos: Repositories) {
    super(repos);
    this.performance = new AcademicPerformanceService(repos);
  }

  async readiness(userId: string): Promise<PlacementReadiness> {
    const [goals, projection] = await Promise.all([
      this.repos.academicGoals.getForUser(userId),
      this.performance.graduationProjection(userId),
    ]);

    const dreamCompany = goals?.dream_company ?? null;
    const targetCgpa = projection.targetCgpa;
    const gap =
      targetCgpa !== null && projection.projectedGraduationCgpa !== null
        ? Math.round((projection.projectedGraduationCgpa - targetCgpa) * 100) / 100
        : null;

    let readiness: ReadinessLevel;
    let explanation: string;
    if (targetCgpa === null) {
      readiness = "needs_target";
      explanation = dreamCompany
        ? `Set a target CGPA for ${dreamCompany} in the planner so readiness can be measured.`
        : "Set a dream company and target CGPA in the planner to track placement readiness.";
    } else if (gap !== null && gap >= 0) {
      readiness = "on_track";
      explanation = `Projected to graduate at ${projection.projectedGraduationCgpa?.toFixed(2)} CGPA — ${gap.toFixed(2)} above your ${targetCgpa.toFixed(2)} target${dreamCompany ? ` for ${dreamCompany}` : ""}.`;
    } else {
      readiness = "at_risk";
      explanation = `Projected to graduate at ${projection.projectedGraduationCgpa?.toFixed(2)} CGPA — ${Math.abs(gap ?? 0).toFixed(2)} below your ${targetCgpa.toFixed(2)} target${dreamCompany ? ` for ${dreamCompany}` : ""}. ${projection.explanation}`;
    }

    return {
      dreamCompany,
      targetCgpa,
      currentCgpa: projection.currentCgpa,
      projectedGraduationCgpa: projection.projectedGraduationCgpa,
      gap,
      readiness,
      remainingSemesters: projection.remainingSemesters,
      requiredGpaPerRemainingSemester: projection.requiredGpaPerRemainingSemester,
      explanation,
    };
  }
}
