import type { Repositories } from "@/lib/repositories";
import type { Tables } from "@/types/database";

import { ActivityService, type HeatmapCell } from "./activity.service";
import { AnalyticsService, type GrowthMetrics } from "./analytics.service";
import { BaseService } from "./base.service";
import { RevisionService } from "./revision.service";

/** Everything the dashboard/overview needs, assembled from real data. */
export interface DashboardSnapshot {
  metrics: GrowthMetrics;
  dueCount: number;
  weakCount: number;
  recentActivity: Tables<"activity_logs">[];
  heatmap: HeatmapCell[];
  activeInsights: Tables<"ai_insights">[];
}

/**
 * Read-only aggregator for the dashboard. Composes the analytics, revision and
 * activity services so a single call hydrates the overview with live data.
 */
export class DashboardService extends BaseService {
  private readonly analytics: AnalyticsService;
  private readonly revision: RevisionService;
  private readonly activity: ActivityService;

  constructor(repos: Repositories) {
    super(repos);
    this.analytics = new AnalyticsService(repos);
    this.revision = new RevisionService(repos);
    this.activity = new ActivityService(repos);
  }

  async snapshot(userId: string): Promise<DashboardSnapshot> {
    const [metrics, due, weak, recentActivity, heatmap, activeInsights] =
      await Promise.all([
        this.analytics.growthMetrics(userId),
        this.revision.dueQueue(userId),
        this.revision.weakQueue(userId),
        this.activity.timeline(userId, 20),
        this.activity.heatmap(userId, 182),
        this.repos.aiInsights.active(userId),
      ]);

    return {
      metrics,
      dueCount: due.length,
      weakCount: weak.length,
      recentActivity,
      heatmap,
      activeInsights,
    };
  }
}
