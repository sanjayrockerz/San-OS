export type JobStatus = "queued" | "running" | "completed" | "failed" | "cancelled";

export type JobPriority = "low" | "normal" | "high" | "critical";

export interface JobDefinition<I = unknown, O = unknown> {
  id: string;
  name: string;
  description?: string;
  handler: (input: I, ctx: JobContext) => Promise<O>;
  options?: JobOptions;
}

export interface Job<I = unknown> {
  id: string;
  type: string;
  input: I;
  userId: string;
  priority: JobPriority;
  status: JobStatus;
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  result?: unknown;
}

export interface JobContext {
  jobId: string;
  userId: string;
  attempt: number;
  abortSignal: AbortSignal;
}

export interface JobOptions {
  maxAttempts?: number;
  priority?: JobPriority;
  timeout?: number;
  retryDelayMs?: number;
  scheduleAt?: string;
}

export interface JobQueueStats {
  queued: number;
  running: number;
  completed: number;
  failed: number;
  total: number;
}

export const JOB_EVENTS = {
  JobQueued: "job.queued",
  JobStarted: "job.started",
  JobCompleted: "job.completed",
  JobFailed: "job.failed",
  JobCancelled: "job.cancelled",
} as const;
