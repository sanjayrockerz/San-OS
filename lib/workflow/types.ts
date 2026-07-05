import type { DomainEvent } from "@/lib/event-bus";

export type WorkflowStatus = "idle" | "running" | "completed" | "failed" | "paused" | "cancelled";

export interface WorkflowStep<I = unknown, O = unknown> {
  id: string;
  name: string;
  execute: (input: I, ctx: WorkflowContext) => Promise<O>;
  rollback?: (input: I, ctx: WorkflowContext) => Promise<void>;
  timeout?: number;
  retryConfig?: {
    maxRetries: number;
    backoffMs: number;
  };
}

export interface WorkflowDefinition<I = unknown, O = unknown> {
  id: string;
  name: string;
  description?: string;
  version: string;
  trigger: WorkflowTrigger;
  steps: WorkflowStep[];
  onComplete?: (output: O, ctx: WorkflowContext) => Promise<void>;
  onError?: (error: Error, ctx: WorkflowContext) => Promise<void>;
  options?: WorkflowOptions;
}

export interface WorkflowTrigger {
  type: "event" | "schedule" | "manual";
  eventType?: string;
  schedule?: string;
  filter?: (event: DomainEvent) => boolean;
}

export interface WorkflowContext {
  workflowId: string;
  executionId: string;
  userId: string;
  startTime: string;
  state: Map<string, unknown>;
  timeline: WorkflowTimelineEntry[];
  metadata: Record<string, unknown>;
}

export interface WorkflowTimelineEntry {
  stepId: string;
  stepName: string;
  status: "running" | "completed" | "failed" | "skipped";
  startedAt: string;
  completedAt?: string;
  duration?: number;
  error?: string;
}

export interface WorkflowOptions {
  maxRetries?: number;
  timeout?: number;
  continueOnError?: boolean;
  preserveStateOnFailure?: boolean;
}

export interface WorkflowExecutionRecord {
  id: string;
  workflowId: string;
  userId: string;
  status: WorkflowStatus;
  trigger: string;
  input: unknown;
  output?: unknown;
  error?: string;
  startedAt: string;
  completedAt?: string;
  duration?: number;
  timeline: WorkflowTimelineEntry[];
  state: Record<string, unknown>;
}

export interface WorkflowStats {
  totalExecutions: number;
  completed: number;
  failed: number;
  running: number;
  avgDurationMs: number;
  registeredWorkflows: number;
}

export const WORKFLOW_EVENTS = {
  WorkflowStarted: "workflow.started",
  WorkflowStepCompleted: "workflow.step_completed",
  WorkflowStepFailed: "workflow.step_failed",
  WorkflowCompleted: "workflow.completed",
  WorkflowFailed: "workflow.failed",
  WorkflowPaused: "workflow.paused",
  WorkflowCancelled: "workflow.cancelled",
} as const;
