import type { Repositories } from "@/lib/repositories";
import type { Json, Tables } from "@/types/database";

import { AnalyticsService } from "./analytics.service";
import { BaseService, isoDate } from "./base.service";
import { RevisionService } from "./revision.service";

/** One actionable step in the Daily Battle Plan. */
export interface BattlePlanStep {
  kind: "revise" | "strengthen" | "learn" | "academic";
  title: string;
  detail: string;
  entityId?: string;
}

/**
 * AI Mentor Engine — analytical, not a chatbot. It reads the user's learning
 * history (revision queue, weak items, forgotten concepts, growth metrics) and
 * synthesises a Daily Battle Plan plus structured insights. It never generates
 * DSA solutions. The logic here is deterministic; a later phase can swap in an
 * LLM to phrase the same derived signals more richly.
 */
export class AiService extends BaseService {
  private readonly analytics: AnalyticsService;
  private readonly revision: RevisionService;

  constructor(repos: Repositories) {
    super(repos);
    this.analytics = new AnalyticsService(repos);
    this.revision = new RevisionService(repos);
  }

  /**
   * Generates (and upserts) today's brief and refreshes derived insights.
   * Returns the persisted brief.
   */
  /**
   * Read-only Daily Battle Plan — the prioritised next actions derived from the
   * revision queue and forgotten concepts. Pure (no writes), so the dashboard
   * aggregator and any UI can call it freely without persisting a brief.
   */
  async battlePlan(userId: string): Promise<BattlePlanStep[]> {
    const [due, weak, forgottenConcepts] = await Promise.all([
      this.revision.dueQueue(userId),
      this.revision.weakQueue(userId),
      this.repos.concepts.findByStatus(userId, "forgotten"),
    ]);

    const steps: BattlePlanStep[] = [];
    for (const item of due.slice(0, 5)) {
      steps.push({
        kind: "revise",
        title: "Revise a due problem",
        detail: "This problem is due for spaced revision today.",
        entityId: item.problem_id,
      });
    }
    for (const item of weak.slice(0, 3)) {
      steps.push({
        kind: "strengthen",
        title: "Strengthen a weak problem",
        detail: "You have struggled with this — attempt it again from scratch.",
        entityId: item.problem_id,
      });
    }
    for (const c of forgottenConcepts.slice(0, 3)) {
      steps.push({
        kind: "learn",
        title: `Re-learn: ${c.title}`,
        detail: "This concept is marked forgotten in your vault.",
        entityId: c.id,
      });
    }
    return steps;
  }

  async generateDailyBrief(
    userId: string,
    date = isoDate(),
  ): Promise<Tables<"ai_daily_briefs">> {
    const due = await this.revision.dueQueue(userId);
    const weak = await this.revision.weakQueue(userId);
    const forgottenConcepts = await this.repos.concepts.findByStatus(
      userId,
      "forgotten",
    );
    const metrics = await this.analytics.growthMetrics(userId);

    const steps = await this.battlePlan(userId);

    const focusAreas: string[] = [];
    if (metrics.independentSolveRate < 0.5)
      focusAreas.push("Independent solving");
    if (metrics.editorialDependencyRate > 0.4)
      focusAreas.push("Editorial dependency");
    if (metrics.funnel.patternRecognition < metrics.funnel.questionUnderstanding)
      focusAreas.push("Pattern recognition");

    const summary =
      steps.length === 0
        ? "Nothing due today — pick a new problem in a weak topic to keep momentum."
        : `${due.length} due for revision, ${weak.length} weak, ${forgottenConcepts.length} forgotten concept(s). Focus on closing these before new problems.`;

    const recommendedProblemIds = Array.from(
      new Set([
        ...due.map((d) => d.problem_id),
        ...weak.map((w) => w.problem_id),
      ]),
    ).slice(0, 10);

    const existing = await this.repos.aiBriefs.findByDate(userId, date);
    const payload = {
      summary,
      battle_plan: steps as unknown as Json,
      focus_areas: focusAreas,
      recommended_problem_ids: recommendedProblemIds,
      model: "rule-based-v1",
      generated_at: new Date().toISOString(),
    };

    const brief = existing
      ? await this.repos.aiBriefs.update(existing.id, payload)
      : await this.repos.aiBriefs.create({
          user_id: userId,
          brief_date: date,
          ...payload,
        });

    await this.refreshInsights(userId, metrics, weak, forgottenConcepts);
    return brief;
  }

  /** Active insights for the mentor panel. */
  insights(userId: string): Promise<Tables<"ai_insights">[]> {
    return this.repos.aiInsights.active(userId);
  }

  /**
   * Recomputes derived insights. Clears prior non-dismissed insights and writes
   * a fresh set so the panel always reflects current state.
   */
  private async refreshInsights(
    userId: string,
    metrics: Awaited<ReturnType<AnalyticsService["growthMetrics"]>>,
    weak: Tables<"revision_queue">[],
    forgottenConcepts: Tables<"concept_notes">[],
  ): Promise<void> {
    const current = await this.repos.aiInsights.active(userId);
    for (const i of current) await this.repos.aiInsights.delete(i.id);

    if (metrics.editorialDependencyRate > 0.4) {
      await this.repos.aiInsights.create({
        user_id: userId,
        type: "weakness",
        title: "High editorial dependency",
        detail: `You relied on editorials for ${Math.round(
          metrics.editorialDependencyRate * 100,
        )}% of scheduled problems. Try first attempts without help.`,
        severity: 4,
      });
    }
    if (weak.length > 0) {
      await this.repos.aiInsights.create({
        user_id: userId,
        type: "warning",
        title: `${weak.length} weak problem(s) need attention`,
        detail: "These are in the struggling state in your revision queue.",
        severity: 3,
      });
    }
    for (const c of forgottenConcepts.slice(0, 5)) {
      await this.repos.aiInsights.create({
        user_id: userId,
        type: "forgotten_topic",
        title: `Forgotten: ${c.title}`,
        detail: "Marked forgotten — schedule a re-learn session.",
        severity: 2,
        entity_type: "concept",
        entity_id: c.id,
      });
    }
    if (metrics.independentSolveRate >= 0.7 && metrics.totalAttempts >= 10) {
      await this.repos.aiInsights.create({
        user_id: userId,
        type: "strength",
        title: "Strong independent solving",
        detail: `You solved ${Math.round(
          metrics.independentSolveRate * 100,
        )}% of attempts independently. Keep pushing difficulty.`,
        severity: 1,
      });
    }
  }
}
