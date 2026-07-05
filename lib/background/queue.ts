import { EventBus } from "@/lib/event-bus";
import { captureException, captureEvent } from "@/lib/observability/logger";
import type { Job, JobContext, JobDefinition, JobOptions, JobPriority, JobQueueStats } from "./types";
import { JOB_EVENTS } from "./types";

export class BackgroundJobQueue {
  private readonly definitions = new Map<string, JobDefinition>();
  private readonly queue: Job[] = [];
  private readonly active = new Map<string, AbortController>();
  private running = false;
  private concurrency: number;
  private processing = false;

  constructor(
    private readonly eventBus: EventBus,
    concurrency = 4,
  ) {
    this.concurrency = concurrency;
  }

  register<I, O>(definition: JobDefinition<I, O>): void {
    if (this.definitions.has(definition.id)) return;
    this.definitions.set(definition.id, definition as JobDefinition);
    captureEvent("job.registered", { jobId: definition.id });
  }

  async enqueue<I>(
    type: string,
    userId: string,
    input: I,
    options?: JobOptions,
  ): Promise<Job<I>> {
    const job: Job<I> = {
      id: crypto.randomUUID(),
      type,
      input,
      userId,
      priority: options?.priority ?? "normal",
      status: "queued",
      attempts: 0,
      maxAttempts: options?.maxAttempts ?? 3,
      createdAt: new Date().toISOString(),
      scheduledAt: options?.scheduleAt,
    };

    this.queue.push(job as Job);
    this.queue.sort((a, b) => priorityWeight(b.priority) - priorityWeight(a.priority));

    await this.eventBus.emit(userId, JOB_EVENTS.JobQueued, {
      jobId: job.id,
      type,
      priority: job.priority,
    });

    if (this.running) this.processNext();
    return job;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.processNext();
    captureEvent("job_queue.started", { concurrency: this.concurrency });
  }

  stop(): void {
    this.running = false;
    captureEvent("job_queue.stopped", { activeJobs: this.active.size });
  }

  async cancel(jobId: string): Promise<boolean> {
    const abort = this.active.get(jobId);
    if (abort) {
      abort.abort();
      this.active.delete(jobId);
      return true;
    }

    const idx = this.queue.findIndex((j) => j.id === jobId);
    if (idx >= 0) {
      this.queue.splice(idx, 1);
      return true;
    }

    return false;
  }

  getStats(): JobQueueStats {
    return {
      queued: this.queue.filter((j) => j.status === "queued").length,
      running: this.active.size,
      completed: this.queue.filter((j) => j.status === "completed").length,
      failed: this.queue.filter((j) => j.status === "failed").length,
      total: this.queue.length,
    };
  }

  getJobs(status?: Job["status"]): Job[] {
    if (status) return this.queue.filter((j) => j.status === status);
    return [...this.queue];
  }

  private async processNext(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    while (this.running && this.active.size < this.concurrency) {
      const job = this.queue.find(
        (j) => j.status === "queued" && (!j.scheduledAt || new Date(j.scheduledAt) <= new Date()),
      );

      if (!job) break;

      job.status = "running";
      job.startedAt = new Date().toISOString();
      job.attempts++;

      const abort = new AbortController();
      this.active.set(job.id, abort);

      this.executeJob(job, abort.signal).finally(() => {
        this.active.delete(job.id);
        if (this.running) this.processNext();
      });
    }

    this.processing = false;
  }

  private async executeJob(job: Job, signal: AbortSignal): Promise<void> {
    const definition = this.definitions.get(job.type);
    if (!definition) {
      job.status = "failed";
      job.error = `No handler registered for job type: ${job.type}`;
      await this.eventBus.emit(job.userId, JOB_EVENTS.JobFailed, {
        jobId: job.id,
        type: job.type,
        error: job.error,
      });
      return;
    }

    const ctx: JobContext = {
      jobId: job.id,
      userId: job.userId,
      attempt: job.attempts,
      abortSignal: signal,
    };

    await this.eventBus.emit(job.userId, JOB_EVENTS.JobStarted, {
      jobId: job.id,
      type: job.type,
      attempt: job.attempts,
    });

    try {
      const result = await definition.handler(job.input, ctx);
      job.status = "completed";
      job.result = result;
      job.completedAt = new Date().toISOString();

      await this.eventBus.emit(job.userId, JOB_EVENTS.JobCompleted, {
        jobId: job.id,
        type: job.type,
      });
    } catch (error) {
      if (signal.aborted) {
        job.status = "cancelled";
        return;
      }

      if (job.attempts < job.maxAttempts) {
        job.status = "queued";
        const delay = definition.options?.retryDelayMs ?? 5000;
        job.scheduledAt = new Date(Date.now() + delay).toISOString();
        captureEvent("job.retrying", { jobId: job.id, type: job.type, attempt: job.attempts });
      } else {
        job.status = "failed";
        job.error = error instanceof Error ? error.message : String(error);
        job.completedAt = new Date().toISOString();

        await this.eventBus.emit(job.userId, JOB_EVENTS.JobFailed, {
          jobId: job.id,
          type: job.type,
          error: job.error,
        });

        captureException(error, { context: "BackgroundJobQueue.execute", jobId: job.id, type: job.type });
      }
    }
  }
}

function priorityWeight(p: JobPriority): number {
  switch (p) {
    case "critical": return 4;
    case "high": return 3;
    case "normal": return 2;
    case "low": return 1;
  }
}
