import type { Repositories } from "@/lib/repositories";
import { BaseService, isoDate } from "./base.service";

export interface ExecutionLearningSummary {
  bestStudyDay: string | null;
  averageStudyMinutes: number;
  averageExecutionRate: number;
  trend: "improving" | "stable" | "declining";
  topPattern: string;
}

export class ExecutionLearningService extends BaseService {
  constructor(repos: Repositories) {
    super(repos);
  }

  async summarize(userId: string, now: Date = new Date()): Promise<ExecutionLearningSummary> {
    const today = isoDate(now);
    const from = isoDate(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000));
    const [logs, blocks] = await Promise.all([
      this.repos.dailyLogs.between(userId, from, today),
      this.repos.timeBlocks.findByDateRange(userId, from, today),
    ]);

    const studyMinutes = logs.map((log) => log.minutes_studied ?? 0);
    const averageStudyMinutes = studyMinutes.length > 0
      ? Math.round(studyMinutes.reduce((sum, value) => sum + value, 0) / studyMinutes.length)
      : 0;

    const completionRates = logs.map((log) => {
      const total = (log.problems_solved ?? 0) + (log.revisions_done ?? 0) + (log.minutes_studied ?? 0);
      return total > 0 ? Math.min(100, Math.round(((log.minutes_studied ?? 0) / total) * 100)) : 0;
    });
    const averageExecutionRate = completionRates.length > 0
      ? Math.round(completionRates.reduce((sum, value) => sum + value, 0) / completionRates.length)
      : 0;

    const recent = completionRates.slice(-3).reduce((sum, value) => sum + value, 0);
    const older = completionRates.slice(0, 3).reduce((sum, value) => sum + value, 0);
    const trend = recent > older + 6 ? "improving" : recent < older - 6 ? "declining" : "stable";

    const bestStudyDay = logs
      .slice()
      .sort((a, b) => (b.minutes_studied ?? 0) - (a.minutes_studied ?? 0))[0]?.log_date ?? null;

    const topPattern = blocks.length > 0
      ? `Tracked ${blocks.length} scheduled blocks with ${blocks.filter((block) => block.status === "completed").length} completed.`
      : "No execution blocks yet. Capture a plan to start learning patterns.";

    return {
      bestStudyDay,
      averageStudyMinutes,
      averageExecutionRate,
      trend,
      topPattern,
    };
  }
}
