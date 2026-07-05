import type { Repositories } from "@/lib/repositories";
import { EventBus } from "@/lib/event-bus";
import { captureException, captureEvent } from "@/lib/observability/logger";
import type { AutomationExecution, AutomationTask, AutomationEngineConfig } from "./types";
import { DEFAULT_AUTOMATION_CONFIG } from "./types";

export class AutomationEngine {
  private readonly tasks = new Map<string, AutomationTask>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;
  private config: AutomationEngineConfig;

  constructor(
    private readonly repos: Repositories,
    private readonly eventBus: EventBus,
    config?: Partial<AutomationEngineConfig>,
  ) {
    this.config = { ...DEFAULT_AUTOMATION_CONFIG, ...config };
  }

  register(task: AutomationTask): void {
    if (this.tasks.has(task.id)) {
      captureEvent("automation.duplicate", { taskId: task.id });
      return;
    }
    this.tasks.set(task.id, task);
    captureEvent("automation.registered", { taskId: task.id, schedule: JSON.stringify(task.schedule) });
  }

  registerTasks(tasks: AutomationTask[]): void {
    for (const task of tasks) this.register(task);
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.timer = setInterval(() => this.tick(), this.config.checkIntervalMs);
    captureEvent("automation.started", { checkInterval: this.config.checkIntervalMs });
  }

  stop(): void {
    this.running = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    captureEvent("automation.stopped", {});
  }

  async executeNow(taskId: string, userId: string): Promise<AutomationExecution | null> {
    const task = this.tasks.get(taskId);
    if (!task) return null;

    return this.runTask(task, userId);
  }

  async executeAll(userId: string): Promise<AutomationExecution[]> {
    const results: AutomationExecution[] = [];
    for (const task of this.tasks.values()) {
      if (task.enabled) {
        const result = await this.runTask(task, userId);
        if (result) results.push(result);
      }
    }
    return results;
  }

  getTasks(): AutomationTask[] {
    return [...this.tasks.values()];
  }

  getEnabledTasks(): AutomationTask[] {
    return [...this.tasks.values()].filter((t) => t.enabled);
  }

  enable(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (task) task.enabled = true;
  }

  disable(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (task) task.enabled = false;
  }

  isRunning(): boolean {
    return this.running;
  }

  getConfig(): AutomationEngineConfig {
    return { ...this.config };
  }

  private async tick(): Promise<void> {
    const now = new Date();
    for (const task of this.tasks.values()) {
      if (!task.enabled) continue;
      if (this.isDue(task.schedule, now)) {
        captureEvent("automation.triggered", { taskId: task.id, time: now.toISOString() });
      }
    }
  }

  private isDue(schedule: AutomationTask["schedule"], now: Date): boolean {
    const h = now.getHours();
    const m = now.getMinutes();
    const d = now.getDay();
    const date = now.getDate();
    const month = now.getMonth() + 1;

    switch (schedule.type) {
      case "daily":
        return h === schedule.hour && m === schedule.minute;
      case "weekly":
        return d === schedule.day && h === schedule.hour && m === schedule.minute;
      case "monthly":
        return date === schedule.day && h === schedule.hour && m === schedule.minute;
      case "quarterly":
        return month === schedule.month && date === schedule.day && h === schedule.hour && m === schedule.minute;
      case "interval":
        return m % schedule.minutes === 0;
      case "time":
        return h === schedule.hour && m === schedule.minute;
      case "cron":
        return false;
      default:
        return false;
    }
  }

  private async runTask(task: AutomationTask, userId: string): Promise<AutomationExecution> {
    const execution: AutomationExecution = {
      id: crypto.randomUUID(),
      taskId: task.id,
      userId,
      status: "running",
      startedAt: new Date().toISOString(),
    };

    try {
      await this.eventBus.emit(userId, "automation.started", {
        taskId: task.id,
        executionId: execution.id,
      });

      await task.execute(userId);

      execution.status = "completed";
      execution.completedAt = new Date().toISOString();
      execution.duration =
        new Date(execution.completedAt).getTime() - new Date(execution.startedAt).getTime();

      await this.eventBus.emit(userId, "automation.completed", {
        taskId: task.id,
        executionId: execution.id,
        duration: execution.duration,
      });
    } catch (error) {
      execution.status = "failed";
      execution.error = error instanceof Error ? error.message : String(error);
      execution.completedAt = new Date().toISOString();

      await this.eventBus.emit(userId, "automation.failed", {
        taskId: task.id,
        executionId: execution.id,
        error: execution.error,
      });

      captureException(error, { context: "AutomationEngine.runTask", taskId: task.id });
    }

    return execution;
  }
}
