export type AutomationSchedule =
  | { type: "cron"; expression: string }
  | { type: "interval"; minutes: number }
  | { type: "time"; hour: number; minute: number; timezone?: string }
  | { type: "daily"; hour: number; minute: number }
  | { type: "weekly"; day: 0 | 1 | 2 | 3 | 4 | 5 | 6; hour: number; minute: number }
  | { type: "monthly"; day: number; hour: number; minute: number }
  | { type: "quarterly"; month: number; day: number; hour: number; minute: number };

export interface AutomationTask {
  id: string;
  name: string;
  description?: string;
  schedule: AutomationSchedule;
  execute: (userId: string) => Promise<void>;
  enabled: boolean;
  domain: string;
  maxRetries?: number;
  timeout?: number;
}

export interface AutomationExecution {
  id: string;
  taskId: string;
  userId: string;
  status: "running" | "completed" | "failed";
  startedAt: string;
  completedAt?: string;
  duration?: number;
  error?: string;
}

export interface AutomationEngineConfig {
  checkIntervalMs: number;
  timezone: string;
}

export const DEFAULT_AUTOMATION_CONFIG: AutomationEngineConfig = {
  checkIntervalMs: 60_000,
  timezone: "UTC",
};

export const BUILT_IN_AUTOMATIONS: Omit<AutomationTask, "execute">[] = [
  { id: "nightly-plan", name: "Generate Tomorrow's Plan", description: "Nightly plan generation for the next day", schedule: { type: "daily", hour: 22, minute: 0 }, enabled: true, domain: "execution" },
  { id: "morning-brief", name: "Morning Brief", description: "Generate morning brief with today's priorities", schedule: { type: "daily", hour: 7, minute: 0 }, enabled: true, domain: "execution" },
  { id: "evening-review", name: "Evening Review", description: "Daily review and reflection", schedule: { type: "daily", hour: 21, minute: 0 }, enabled: true, domain: "execution" },
  { id: "weekly-review", name: "Weekly Review", description: "Weekly performance review", schedule: { type: "weekly", day: 0, hour: 10, minute: 0 }, enabled: true, domain: "execution" },
  { id: "monthly-finance", name: "Monthly Finance Report", description: "Generate monthly finance report", schedule: { type: "monthly", day: 1, hour: 9, minute: 0 }, enabled: true, domain: "finance" },
  { id: "quarterly-placement", name: "Quarterly Placement Review", description: "Quarterly placement readiness review", schedule: { type: "quarterly", month: 1, day: 1, hour: 10, minute: 0 }, enabled: true, domain: "placement" },
];
