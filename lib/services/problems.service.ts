import type { Repositories } from "@/lib/repositories";
import type { Tables, TablesInsert } from "@/types/database";

import { ActivityService } from "./activity.service";
import { BaseService } from "./base.service";
import { RevisionService } from "./revision.service";

type Attempt = Tables<"problem_attempts">;

/** The learning-journey flags captured per attempt. */
export interface SolveJourney {
  understoodStatement?: boolean;
  identifiedPattern?: boolean;
  derivedAlgorithm?: boolean;
  wrotePseudocode?: boolean;
  codedIndependently?: boolean;
  runtimeError?: boolean;
  syntaxError?: boolean;
  logicError?: boolean;
}

export interface RecordSolveInput {
  problemId: string;
  language?: string | null;
  timeTakenSeconds?: number | null;
  solveStatus?: Attempt["solve_status"];
  confidence?: number | null;
  journey?: SolveJourney;
  editorialUsed?: boolean;
  /** Optional reflection captured alongside the attempt. */
  reflection?: {
    myExplanation?: string | null;
    algorithmInWords?: string | null;
    bugThatStoppedMe?: string | null;
    finalTakeaway?: string | null;
  };
  /** Optional code draft saved with the attempt. */
  code?: { language: string; code: string; isFinal?: boolean };
}

export interface RecordSolveResult {
  attempt: Tables<"problem_attempts">;
  reflection: Tables<"problem_reflections"> | null;
  codeVersion: Tables<"problem_code_versions"> | null;
  revision: Tables<"revision_queue">;
  roadmapItemsUpdated: number;
}

/**
 * Orchestrates the highest-priority workflow: recording a solve attempt. One
 * call persists the attempt (+ optional reflection/code), schedules revision,
 * fans the result out to every linked roadmap, and logs activity — keeping the
 * cross-domain rules in a single place.
 */
export class ProblemsService extends BaseService {
  private readonly activity: ActivityService;
  private readonly revision: RevisionService;

  constructor(repos: Repositories) {
    super(repos);
    this.activity = new ActivityService(repos);
    this.revision = new RevisionService(repos);
  }

  /** Lists catalog + own problems for a user. */
  list(userId: string): Promise<Tables<"problems">[]> {
    return this.repos.problems.listVisible(userId);
  }

  /** Creates a user-authored problem. */
  create(
    userId: string,
    values: Omit<TablesInsert<"problems">, "user_id">,
  ): Promise<Tables<"problems">> {
    return this.repos.problems.create({ ...values, user_id: userId });
  }

  /**
   * Records a solve attempt and all of its side effects in one workflow.
   */
  async recordSolve(
    userId: string,
    input: RecordSolveInput,
  ): Promise<RecordSolveResult> {
    const j = input.journey ?? {};

    const attempt = await this.repos.attempts.create({
      user_id: userId,
      problem_id: input.problemId,
      language: input.language ?? null,
      time_taken_seconds: input.timeTakenSeconds ?? null,
      solve_status: input.solveStatus ?? null,
      confidence: input.confidence ?? null,
      understood_statement: j.understoodStatement ?? false,
      identified_pattern: j.identifiedPattern ?? false,
      derived_algorithm: j.derivedAlgorithm ?? false,
      wrote_pseudocode: j.wrotePseudocode ?? false,
      coded_independently: j.codedIndependently ?? false,
      runtime_error: j.runtimeError ?? false,
      syntax_error: j.syntaxError ?? false,
      logic_error: j.logicError ?? false,
    });

    let reflection: Tables<"problem_reflections"> | null = null;
    if (input.reflection) {
      const r = input.reflection;
      reflection = await this.repos.reflections.create({
        user_id: userId,
        problem_id: input.problemId,
        attempt_id: attempt.id,
        my_explanation: r.myExplanation ?? null,
        algorithm_in_words: r.algorithmInWords ?? null,
        bug_that_stopped_me: r.bugThatStoppedMe ?? null,
        final_takeaway: r.finalTakeaway ?? null,
      });
    }

    let codeVersion: Tables<"problem_code_versions"> | null = null;
    if (input.code) {
      codeVersion = await this.repos.codeVersions.create({
        user_id: userId,
        problem_id: input.problemId,
        attempt_id: attempt.id,
        language: input.code.language,
        code: input.code.code,
        is_final: input.code.isFinal ?? false,
      });
    }

    const revision = await this.revision.scheduleAfterSolve(
      userId,
      input.problemId,
      input.editorialUsed ?? false,
    );

    const roadmapItemsUpdated = await this.fanOutToRoadmaps(
      userId,
      input.problemId,
    );

    await this.activity.log(userId, {
      type: "problem_solved",
      title: "Solved a problem",
      entityType: "problem",
      entityId: input.problemId,
      metadata: { attemptId: attempt.id, solveStatus: attempt.solve_status },
    });
    await this.activity.bumpDailyCounters(userId, { problems_solved: 1 });

    return { attempt, reflection, codeVersion, revision, roadmapItemsUpdated };
  }

  /**
   * Marks every roadmap item linked to this problem as completed for the user.
   * A problem solved once thus updates every linked roadmap.
   */
  private async fanOutToRoadmaps(
    userId: string,
    problemId: string,
  ): Promise<number> {
    const items = await this.repos.roadmapItems.findByProblem(problemId);
    let updated = 0;
    for (const item of items) {
      const existing = await this.repos.roadmapProgress.findByItem(
        userId,
        item.id,
      );
      const now = new Date().toISOString();
      if (existing) {
        if (existing.status !== "completed") {
          await this.repos.roadmapProgress.update(existing.id, {
            status: "completed",
            completed_at: now,
          });
          updated++;
        }
      } else {
        await this.repos.roadmapProgress.create({
          user_id: userId,
          roadmap_id: item.roadmap_id,
          item_id: item.id,
          status: "completed",
          completed_at: now,
        });
        updated++;
      }
    }
    return updated;
  }
}
