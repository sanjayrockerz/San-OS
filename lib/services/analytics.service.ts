import type { Repositories } from "@/lib/repositories";

import { BaseService } from "./base.service";

/** The six-stage cognitive funnel, as raw counts across all attempts. */
export interface CognitiveFunnel {
  questionUnderstanding: number;
  patternRecognition: number;
  algorithmFormation: number;
  pseudocodeWriting: number;
  coding: number;
  debugging: number;
}

export interface GrowthMetrics {
  totalAttempts: number;
  totalSolved: number;
  uniqueProblemsSolved: number;
  independentSolveRate: number; // 0..1
  averageSolveSeconds: number | null;
  editorialDependencyRate: number; // 0..1 over scheduled problems
  funnel: CognitiveFunnel;
}

const SOLVED_STATUSES = new Set(["solved", "solved_with_help", "partial"]);

/**
 * Derives all growth analytics live from the database — no precomputed numbers.
 * Reads attempts and the revision queue and reduces them into the metrics the
 * Analytics & Growth Engine renders (funnel, independent-solve rate, etc.).
 */
export class AnalyticsService extends BaseService {
  constructor(repos: Repositories) {
    super(repos);
  }

  async growthMetrics(userId: string): Promise<GrowthMetrics> {
    const attempts = await this.repos.attempts.findByUser(userId);
    const revisions = await this.repos.revision.findByUser(userId);

    const totalAttempts = attempts.length;

    const solvedAttempts = attempts.filter(
      (a) => a.solve_status && SOLVED_STATUSES.has(a.solve_status),
    );
    const uniqueSolved = new Set(solvedAttempts.map((a) => a.problem_id));

    const independent = attempts.filter((a) => a.coded_independently).length;

    const timed = attempts.filter(
      (a) => typeof a.time_taken_seconds === "number",
    );
    const averageSolveSeconds = timed.length
      ? Math.round(
          timed.reduce((s, a) => s + (a.time_taken_seconds ?? 0), 0) /
            timed.length,
        )
      : null;

    const editorialDependent = revisions.filter(
      (r) => r.editorial_dependency,
    ).length;

    const funnel: CognitiveFunnel = {
      questionUnderstanding: attempts.filter((a) => a.understood_statement)
        .length,
      patternRecognition: attempts.filter((a) => a.identified_pattern).length,
      algorithmFormation: attempts.filter((a) => a.derived_algorithm).length,
      pseudocodeWriting: attempts.filter((a) => a.wrote_pseudocode).length,
      coding: attempts.filter((a) => a.coded_independently).length,
      debugging: attempts.filter(
        (a) => a.runtime_error || a.syntax_error || a.logic_error,
      ).length,
    };

    return {
      totalAttempts,
      totalSolved: solvedAttempts.length,
      uniqueProblemsSolved: uniqueSolved.size,
      independentSolveRate: totalAttempts ? independent / totalAttempts : 0,
      averageSolveSeconds,
      editorialDependencyRate: revisions.length
        ? editorialDependent / revisions.length
        : 0,
      funnel,
    };
  }
}
