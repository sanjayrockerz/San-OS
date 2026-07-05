import type { Repositories } from "@/lib/repositories";
import { captureException, captureEvent } from "@/lib/observability/logger";
import { EventBus } from "@/lib/event-bus";
import { v4 as uuid } from "uuid";
import type {
  WorkflowDefinition,
  WorkflowContext,
  WorkflowExecutionRecord,
  WorkflowStatus,
  WorkflowStep,
  WorkflowTimelineEntry,
  WorkflowStats,
} from "./types";
import { WORKFLOW_EVENTS } from "./types";

export class WorkflowEngine {
  private readonly registry = new Map<string, WorkflowDefinition>();
  private readonly activeExecutions = new Map<string, AbortController>();
  private running = false;

  constructor(
    private readonly repos: Repositories,
    private readonly eventBus: EventBus,
  ) {}

  register<I, O>(definition: WorkflowDefinition<I, O>): void {
    if (this.registry.has(definition.id)) {
      captureEvent("workflow.duplicate_registration", { workflowId: definition.id });
      return;
    }
    this.registry.set(definition.id, definition as WorkflowDefinition);
    captureEvent("workflow.registered", { workflowId: definition.id, version: definition.version });

    if (definition.trigger.type === "event" && definition.trigger.eventType) {
      this.eventBus.on(
        definition.trigger.eventType,
        async (event) => {
          if (definition.trigger.filter && !definition.trigger.filter(event)) return;
          await this.start(definition.id, event.userId, event.payload);
        },
        { async: true },
      );
    }
  }

  async start<I>(
    workflowId: string,
    userId: string,
    input: I,
  ): Promise<WorkflowExecutionRecord | null> {
    const definition = this.registry.get(workflowId);
    if (!definition) {
      captureException(new Error(`Workflow ${workflowId} not found`), { userId });
      return null;
    }

    const executionId = uuid();
    const ctx: WorkflowContext = {
      workflowId,
      executionId,
      userId,
      startTime: new Date().toISOString(),
      state: new Map(),
      timeline: [],
      metadata: {},
    };

    const record: WorkflowExecutionRecord = {
      id: executionId,
      workflowId,
      userId,
      status: "running",
      trigger: definition.trigger.type,
      input: input as Record<string, unknown>,
      startedAt: ctx.startTime,
      timeline: [],
      state: {},
    };

    const abort = new AbortController();
    this.activeExecutions.set(executionId, abort);

    await this.eventBus.emit(userId, WORKFLOW_EVENTS.WorkflowStarted, {
      workflowId,
      executionId,
      trigger: definition.trigger.type,
    });

    try {
      let stepOutput: unknown = input;

      for (const step of definition.steps) {
        if (abort.signal.aborted) {
          record.status = "cancelled";
          break;
        }

        const entry = await this.executeStep(step, stepOutput, ctx, definition);
        record.timeline.push(entry);

        if (entry.status === "failed" && !definition.options?.continueOnError) {
          record.status = "failed";
          record.error = entry.error;
          await this.eventBus.emit(userId, WORKFLOW_EVENTS.WorkflowStepFailed, {
            workflowId,
            executionId,
            stepId: step.id,
            error: entry.error,
          });
          break;
        }

        stepOutput = entry.status === "completed" ? ctx.state.get(`${step.id}_output`) : undefined;
      }

      if (record.status === "running") {
        record.status = "completed";
        record.output = stepOutput as Record<string, unknown>;

        await definition.onComplete?.(stepOutput, ctx);
        await this.eventBus.emit(userId, WORKFLOW_EVENTS.WorkflowCompleted, {
          workflowId,
          executionId,
        });
      }
    } catch (error) {
      record.status = "failed";
      record.error = error instanceof Error ? error.message : String(error);

      await definition.onError?.(error as Error, ctx);
      await this.eventBus.emit(userId, WORKFLOW_EVENTS.WorkflowFailed, {
        workflowId,
        executionId,
        error: record.error,
      });

      captureException(error, { context: "WorkflowEngine.execute", workflowId, executionId });
    }

    record.completedAt = new Date().toISOString();
    record.duration = new Date(record.completedAt).getTime() - new Date(record.startedAt).getTime();
    record.state = Object.fromEntries(ctx.state);

    this.activeExecutions.delete(executionId);
    this.persistRecord(record);

    return record;
  }

  async cancel(executionId: string): Promise<boolean> {
    const abort = this.activeExecutions.get(executionId);
    if (!abort) return false;
    abort.abort();
    this.activeExecutions.delete(executionId);
    return true;
  }

  getDefinition(workflowId: string): WorkflowDefinition | undefined {
    return this.registry.get(workflowId);
  }

  listDefinitions(): WorkflowDefinition[] {
    return [...this.registry.values()];
  }

  getActiveExecutions(): number {
    return this.activeExecutions.size;
  }

  isRunning(): boolean {
    return this.running;
  }

  getStats(): WorkflowStats {
    const completed = [...this.activeExecutions.values()].filter(
      () => false,
    ).length;
    return {
      totalExecutions: completed,
      completed: 0,
      failed: 0,
      running: this.activeExecutions.size,
      avgDurationMs: 0,
      registeredWorkflows: this.registry.size,
    };
  }

  private async executeStep<I, O>(
    step: WorkflowStep<I, O>,
    input: I,
    ctx: WorkflowContext,
    definition: WorkflowDefinition,
  ): Promise<WorkflowTimelineEntry> {
    const entry: WorkflowTimelineEntry = {
      stepId: step.id,
      stepName: step.name,
      status: "running",
      startedAt: new Date().toISOString(),
    };

    try {
      const output = await step.execute(input, ctx);
      ctx.state.set(`${step.id}_output`, output);
      entry.status = "completed";
      entry.completedAt = new Date().toISOString();
      entry.duration =
        new Date(entry.completedAt).getTime() - new Date(entry.startedAt).getTime();

      await this.eventBus.emit(ctx.userId, WORKFLOW_EVENTS.WorkflowStepCompleted, {
        workflowId: definition.id,
        executionId: ctx.executionId,
        stepId: step.id,
        duration: entry.duration,
      });
    } catch (error) {
      entry.status = "failed";
      entry.error = error instanceof Error ? error.message : String(error);
      entry.completedAt = new Date().toISOString();

      if (step.rollback) {
        try {
          await step.rollback(input, ctx);
        } catch (rollbackError) {
          captureException(rollbackError, {
            context: "WorkflowEngine.rollback",
            stepId: step.id,
          });
        }
      }
    }

    ctx.timeline.push(entry);
    return entry;
  }

  private async persistRecord(record: WorkflowExecutionRecord): Promise<void> {
    try {
      await this.repos.events.create({
        user_id: record.userId,
        event_type: `workflow.${record.status}`,
        entity_type: "workflow_execution",
        entity_id: record.id,
        payload: {
          workflowId: record.workflowId,
          status: record.status,
          duration: record.duration,
        } as any,
      });
    } catch (error) {
      captureException(error, { context: "WorkflowEngine.persistRecord", workflowId: record.workflowId });
    }
  }
}
