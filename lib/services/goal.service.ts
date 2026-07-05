import type { Repositories } from "@/lib/repositories";
import { BaseService } from "./base.service";
import type { Tables } from "@/types/database";

export type UserGoal = Tables<"user_goals">;
export type GoalHorizon = UserGoal["horizon"];
export type GoalDomain = UserGoal["domain"];

export interface GoalSummary {
  horizon: GoalHorizon;
  label: string;
  goals: UserGoal[];
  completionRate: number;
}

const HORIZON_ORDER: GoalHorizon[] = ["today", "week", "month", "quarter", "year", "life"];
const HORIZON_LABEL: Record<GoalHorizon, string> = {
  today: "Today",
  week: "This Week",
  month: "This Month",
  quarter: "This Quarter",
  year: "This Year",
  life: "Life Goals",
};

export class GoalService extends BaseService {
  constructor(repos: Repositories) {
    super(repos);
  }

  async getActiveSummary(userId: string): Promise<GoalSummary[]> {
    const goals = await this.repos.userGoals.findActive(userId);

    return HORIZON_ORDER.map((horizon) => {
      const horizonGoals = goals.filter((g) => g.horizon === horizon);
      const completed = horizonGoals.filter((g) => g.status === "completed" || g.progress >= 100).length;
      return {
        horizon,
        label: HORIZON_LABEL[horizon],
        goals: horizonGoals,
        completionRate: horizonGoals.length > 0 ? Math.round((completed / horizonGoals.length) * 100) : 0,
      };
    }).filter((s) => s.goals.length > 0);
  }

  async createGoal(
    userId: string,
    input: {
      title: string;
      description?: string;
      horizon: GoalHorizon;
      domain?: GoalDomain;
      target_date?: string;
    },
  ): Promise<UserGoal> {
    return this.repos.userGoals.create({
      user_id: userId,
      title: input.title,
      description: input.description ?? null,
      horizon: input.horizon,
      domain: input.domain ?? "personal",
      target_date: input.target_date ?? null,
    });
  }

  async updateProgress(goalId: string, progress: number): Promise<UserGoal> {
    return this.repos.userGoals.updateProgress(goalId, progress);
  }

  async archiveGoal(goalId: string): Promise<UserGoal> {
    return this.repos.userGoals.update(goalId, {
      status: "abandoned",
      updated_at: new Date().toISOString(),
    });
  }
}
