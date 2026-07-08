import type { Repositories } from "@/lib/repositories";
import { EntityResolutionEngine } from "@/lib/entity-resolution";
import { BaseService } from "./base.service";
import { parseBrainDump } from "@/lib/execution/brain-dump";
import type { CompletionInferenceService } from "./completion-inference.service";
import type { ExecutionEngineService } from "./execution-engine.service";
import type { DailyPlannerService } from "./daily-planner.service";
import type { ExecutionCoachService } from "./execution-coach.service";
import type { ExecutionLearningService } from "./execution-learning.service";

export interface InboxProcessingResult {
  kind: "planning" | "completion" | "clarification";
  message: string;
  confidence: number;
  detectedItems: number;
  clarification?: {
    prompt: string;
    choices: number[];
  };
  resolvedProject?: { id: string; name: string } | null;
  resolvedClient?: { id: string; name: string } | null;
}

export class NaturalLanguagePlanningService extends BaseService {
  private readonly entityResolver: EntityResolutionEngine;

  constructor(
    repos: Repositories,
    private readonly completionInference: CompletionInferenceService,
    private readonly executionEngine: ExecutionEngineService,
    private readonly dailyPlanner: DailyPlannerService,
    private readonly coach: ExecutionCoachService,
    private readonly learning: ExecutionLearningService,
  ) {
    super(repos);
    this.entityResolver = new EntityResolutionEngine(repos);
  }

  async processInboxEntry(
    userId: string,
    raw: string,
    options?: { minutes?: number | null; now?: Date },
  ): Promise<InboxProcessingResult> {
    const parsedItems = parseBrainDump(raw);
    const completion = this.completionInference.infer(raw);
    const hasPlanCues =
      parsedItems.length > 1 ||
      parsedItems.some((item) => item.scheduledTime) ||
      /\b(tomorrow|plan|schedule|available|morning|afternoon|evening|night)\b/i.test(raw);
    const now = options?.now ?? new Date();

    const [entityResult] = await Promise.all([
      this.entityResolver.resolve({ userId, text: raw }),
    ]);
    const resolvedProject = entityResult.matches.find(m => m.type === "project") ?? null;
    const resolvedClient = entityResult.matches.find(m => m.type === "client") ?? null;

    if (resolvedProject) {
      await this.repos.events.create({
        user_id: userId,
        event_type: "planner.entity_resolved",
        entity_type: "project",
        entity_id: resolvedProject.id,
        payload: { source: "inbox_entry", text: raw.slice(0, 300) },
      }).catch(() => {});
    }

    if (completion.completed && completion.confidence >= 0.5 && !hasPlanCues) {
      if (completion.durationMinutes == null && options?.minutes == null && completion.confidence < 0.75) {
        return {
          kind: "clarification",
          confidence: completion.confidence,
          detectedItems: parsedItems.length,
          message: `I detected a completion update for ${completion.task ?? "this work"}. How long did it take?`,
          clarification: {
            prompt: "How long?",
            choices: [30, 60, 120],
          },
          resolvedProject,
          resolvedClient,
        };
      }

      const result = await this.completionInference.record(userId, raw, { minutes: options?.minutes, now });
      const metrics = await this.executionEngine.getTodayMetrics(userId).catch(() => ({
        plannedMinutes: 0, actualMinutes: 0, deepWorkMinutes: 0, completedBlocks: 0, totalBlocks: 0,
        completionRate: 0, scheduleAccuracy: 0, focusSessions: 0, avgFocusScore: 0, longestStreak: 0,
      }));
      const learning = await this.learning.summarize(userId, now).catch(() => ({
        bestStudyDay: null, averageStudyMinutes: 0, averageExecutionRate: 0, trend: "stable" as const, topPattern: "No learning summary available yet.",
      }));

      return {
        kind: "completion",
        confidence: result.signal.confidence,
        detectedItems: parsedItems.length,
        message: this.coach.buildCoachMessage(metrics, learning, result.signal),
        resolvedProject,
        resolvedClient,
      };
    }

    if (parsedItems.length === 0) {
      return {
        kind: "clarification",
        confidence: completion.confidence,
        detectedItems: 0,
        message: "I couldn't find a task or completion signal in that text.",
        clarification: {
          prompt: "What should I do with it?",
          choices: [30, 60, 120],
        },
        resolvedProject,
        resolvedClient,
      };
    }

    const capture = await this.executionEngine.captureBrainDump(userId, raw);

    return {
      kind: "planning",
      confidence: 0.9,
      detectedItems: capture.created,
      message:
        capture.created > 0
          ? `I understood ${capture.created} item${capture.created === 1 ? "" : "s"} and saved them as captures. Open Daily Planner to preview and confirm the schedule.`
          : "I saved that as a capture, but I couldn't extract anything schedule-ready. Try adding clearer tasks, times, or deadlines.",
      resolvedProject,
      resolvedClient,
    };
  }
}
