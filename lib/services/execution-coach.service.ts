import type { Repositories } from "@/lib/repositories";
import { BaseService } from "./base.service";
import type { ExecutionMetrics } from "./execution-engine.service";
import type { CompletionSignal } from "@/lib/execution/completion-inference";
import type { ExecutionLearningSummary } from "./execution-learning.service";

export class ExecutionCoachService extends BaseService {
  constructor(repos: Repositories) {
    super(repos);
  }

  buildCoachMessage(
    metrics: ExecutionMetrics,
    learning: ExecutionLearningSummary,
    signal?: CompletionSignal | null,
  ): string {
    const completionLine = metrics.completionRate >= 80
      ? `Strong execution: ${metrics.completionRate}% completion.`
      : metrics.completionRate >= 50
        ? `Execution is decent at ${metrics.completionRate}%, but tighten the plan.`
        : `Execution is drifting at ${metrics.completionRate}%. Cut scope and finish one important task.`;

    const learningLine = learning.trend === "improving"
      ? `Learning is improving; average study time is ${learning.averageStudyMinutes}m.`
      : learning.trend === "declining"
        ? `Learning is slipping; average study time is ${learning.averageStudyMinutes}m.`
        : `Learning is stable at ${learning.averageStudyMinutes}m on average.`;

    const signalLine = signal?.task
      ? `I logged the completion signal for ${signal.task}${signal.durationMinutes ? ` (${signal.durationMinutes}m)` : ""}.`
      : null;

    return [completionLine, learningLine, signalLine].filter(Boolean).join(" ");
  }
}
