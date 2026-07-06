type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  trace?: string;
  duration?: number;
}

export class StructuredLogger {
  private readonly logs: LogEntry[] = [];
  private readonly maxLogs = 1000;
  private readonly enabled: boolean;

  constructor(enabled = true) {
    this.enabled = enabled;
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.write("debug", message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.write("info", message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.write("warn", message, context);
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.write("error", message, context);
  }

  perf(message: string, durationMs: number, context?: Record<string, unknown>): void {
    this.write("info", message, { ...context, durationMs, _type: "perf" });
  }

  getLogs(level?: LogLevel, limit = 50): LogEntry[] {
    let filtered = this.logs;
    if (level) filtered = filtered.filter((l) => l.level === level);
    return filtered.slice(-limit);
  }

  getErrors(limit = 20): LogEntry[] {
    return this.logs.filter((l) => l.level === "error").slice(-limit);
  }

  getSlowOperations(thresholdMs = 500, limit = 20): LogEntry[] {
    return this.logs
      .filter((l) => (l.duration ?? 0) > thresholdMs)
      .slice(-limit);
  }

  clear(): void {
    this.logs.length = 0;
  }

  private write(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    if (!this.enabled) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      trace: context?.traceId as string | undefined,
      duration: context?.durationMs as number | undefined,
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) this.logs.shift();

    if (typeof console !== "undefined") {
      const fn = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
      fn(`[${level.toUpperCase()}] ${message}`, context ?? "");
    }
  }
}

export const logger = new StructuredLogger(process.env.NODE_ENV !== "test");
