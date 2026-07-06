import type { Repositories } from "@/lib/repositories";
import type { Tables, TablesInsert } from "@/types/database";

import { BaseService } from "./base.service";
import { EventBus } from "@/lib/event-bus";

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
}

/**
 * Records a solve attempt. Persists the attempt (+ optional reflection/code),
 * then emits a `problem.solved` domain event. Downstream side effects
 * (revision scheduling, roadmap fan-out, activity logging) are handled by
 * the WorkflowEngine via EventBus subscribers — this service no longer
 * orchestrates them directly.
 */
export class ProblemsService extends BaseService {
  private readonly eventBus: EventBus;

  constructor(repos: Repositories, eventBus: EventBus) {
    super(repos);
    this.eventBus = eventBus;
  }

  /** Lists catalog + own problems for a user. */
  list(userId: string): Promise<Tables<"problems">[]> {
    return this.repos.problems.listVisible(userId);
  }

  /** Creates a user-authored problem and emits `problem.created`. */
  async create(
    userId: string,
    values: Omit<TablesInsert<"problems">, "user_id">,
  ): Promise<Tables<"problems">> {
    const problem = await this.repos.problems.create({
      ...values,
      user_id: userId,
    });
    await this.eventBus.emit(userId, "problem.created", {
      title: problem.title,
    });
    return problem;
  }

  /**
   * Records a solve attempt and emits a `problem.solved` event. Downstream side
   * effects (revision, roadmaps, activity, notifications) are handled by the
   * WorkflowEngine's `problem-solved-workflow` via EventBus subscription.
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

    // Reflection and code version are part of the primary attempt — they stay
    // here rather than moving to a subscriber.
    const [reflection, codeVersion] = await Promise.all([
      input.reflection
        ? this.repos.reflections.create({
            user_id: userId,
            problem_id: input.problemId,
            attempt_id: attempt.id,
            my_explanation: input.reflection.myExplanation ?? null,
            algorithm_in_words: input.reflection.algorithmInWords ?? null,
            bug_that_stopped_me: input.reflection.bugThatStoppedMe ?? null,
            final_takeaway: input.reflection.finalTakeaway ?? null,
          })
        : Promise.resolve(null),
      input.code
        ? this.repos.codeVersions.create({
            user_id: userId,
            problem_id: input.problemId,
            attempt_id: attempt.id,
            language: input.code.language,
            code: input.code.code,
            is_final: input.code.isFinal ?? false,
          })
        : Promise.resolve(null),
    ]);

    // Emit the domain event. The EventBus both persists this event and
    // synchronously dispatches it to all subscribers, including the
    // WorkflowEngine's `problem-solved-workflow` which handles revision
    // scheduling, roadmap fan-out, activity logging, notifications, etc.
    await this.eventBus.emit(userId, "problem.solved", {
      problemId: input.problemId,
      attemptId: attempt.id,
      editorialUsed: input.editorialUsed ?? false,
      solveStatus: attempt.solve_status,
    });

    return { attempt, reflection, codeVersion };
  }
}
