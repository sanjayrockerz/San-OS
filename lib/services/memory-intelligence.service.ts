import type { Repositories } from "@/lib/repositories";
import type { Tables } from "@/types/database";

import { BaseService } from "./base.service";
import { EVENT_TYPES, EventService } from "./event.service";
import { intervalFor } from "./revision.service";

type RevisionRow = Tables<"revision_queue">;
type AttemptRow = Tables<"problem_attempts">;
type GradeRow = Tables<"recall_grades">;
type EventRow = Tables<"events">;
type ForgettingRisk = Tables<"recall_strength">["risk"];
type MemoryTrend = Tables<"recall_strength">["trend"];
type MemoryHealthStatus = Tables<"topic_memory_health">["status"];
type EntityType = "topic" | "pattern";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Recall Strength (Model 1) for a single problem. */
export interface RecallStrengthResult {
  problemId: string;
  score: number;
  risk: ForgettingRisk;
  trend: MemoryTrend;
}

/** Topic/Pattern Memory Health (Model 2) for a single entity. */
export interface TopicHealthResult {
  entityType: EntityType;
  entityId: string;
  healthScore: number;
  status: MemoryHealthStatus;
  trend: MemoryTrend;
  problemsTracked: number;
  problemsAtRisk: number;
}

/** A topic/pattern health row decorated with its display name. */
export type NamedTopicHealth = TopicHealthResult & { name: string };

export interface MemoryHealthSnapshot {
  overallScore: number;
  strong: NamedTopicHealth[];
  atRisk: NamedTopicHealth[];
  neglected: NamedTopicHealth[];
  all: NamedTopicHealth[];
}

export interface ForecastItem {
  problemId: string;
  title: string;
  score: number;
  trend: MemoryTrend;
}

export interface ForgettingForecast {
  likelyForgotten: ForecastItem[];
  atRisk: ForecastItem[];
  stableCount: number;
  recentlyReinforcedCount: number;
}

export interface MemoryEvolveSummary {
  problemsScored: number;
  topicsScored: number;
}

/**
 * MemoryIntelligenceService — turns the raw signals SanOS already records
 * (revision_queue success/failure + timestamps, problem_attempts confidence,
 * optional recall_grades) into three concrete models:
 *
 *   Model 1 — Recall Strength: a 0-100 score per problem.
 *   Model 2 — Topic Memory Health: Recall Strength rolled up per topic/pattern.
 *   Model 3 — Forgetting Prediction: a risk bucket per problem, derived from
 *             how overdue it is relative to the engine's OWN schedule.
 *
 * All three are deterministic and documented inline — no tuned/random
 * weights. Like TaxonomyService.evolve(), evolve() recomputes everything from
 * the source of truth (idempotent, self-healing) and caches the result in
 * recall_strength / topic_memory_health so reads (dashboard, coach) are cheap.
 */
export class MemoryIntelligenceService extends BaseService {
  private readonly events: EventService;

  /** Decay half-life, expressed as a multiple of the item's OWN scheduled
   * interval (not a fixed number of days). Reviewing exactly on schedule
   * (ageRatio = 1) costs ~30% of the score; being twice as overdue as
   * predicted halves it. This personalises the recency-decay idea
   * TaxonomyService already uses for taxonomy_usage (fixed 14-day half-life)
   * to each item's own forgetting curve. */
  private static readonly HALF_LIFE_INTERVAL_MULTIPLIER = 2;

  /** Self-reported confidence (1-5) at/above this is "high" for calibration
   * checks — chosen because the UI's own scale treats 4-5 as "confident". */
  private static readonly HIGH_CONFIDENCE = 4;

  /** Points subtracted when stated confidence contradicts the actual outcome
   * (high confidence + struggling/failed). A calibration mismatch is a
   * forgetting signal in its own right, independent of the raw success ratio. */
  private static readonly CALIBRATION_PENALTY = 15;

  constructor(repos: Repositories) {
    super(repos);
    this.events = new EventService(repos);
  }

  // ---------------------------------------------------------------------------
  // Model 1 + 3 — Recall Strength & Forgetting Prediction for one problem
  // ---------------------------------------------------------------------------

  /**
   * Computes Recall Strength for one revision_queue entry.
   *
   *   reliability = (success_count + 1) / (success_count + failure_count + 2)
   *     Laplace-smoothed success rate. Without smoothing, one early success
   *     (1/1) or failure (0/1) would swing straight to 100 or 0 before there
   *     is enough history to trust it.
   *
   *   ageRatio = daysSinceLastRevision / scheduledIntervalDays
   *     scheduledIntervalDays comes from RevisionService's own SM-2 ladder —
   *     the engine's prediction of how long this memory should hold. Ratio
   *     <1 means "ahead of schedule", >1 means "overdue relative to what we
   *     predicted".
   *
   *   decay = 2 ^ (-ageRatio / HALF_LIFE_INTERVAL_MULTIPLIER)
   *
   *   score = clamp(round(100 * reliability * decay) - calibrationPenalty)
   *
   * If recall_grades exist (a real graded recall test, richer than binary
   * success/failure), the most recent grade_score is blended in 50/50 — a
   * structured recall test is strictly more informative than the ladder
   * alone.
   */
  computeRecallStrength(
    entry: RevisionRow,
    latestAttempt: AttemptRow | null,
    recentGrades: GradeRow[],
    recentEvents: EventRow[],
  ): RecallStrengthResult {
    const successCount = entry.success_count;
    const failureCount = entry.failure_count;
    const reliability =
      (successCount + 1) / (successCount + failureCount + 2);

    const lastRevisionMs = entry.last_revision
      ? new Date(entry.last_revision).getTime()
      : new Date(entry.created_at).getTime();
    const ageDays = Math.max(0, (Date.now() - lastRevisionMs) / DAY_MS);
    const scheduledIntervalDays = intervalFor(successCount);
    const ageRatio = ageDays / scheduledIntervalDays;
    const decay = Math.pow(
      2,
      -ageRatio / MemoryIntelligenceService.HALF_LIFE_INTERVAL_MULTIPLIER,
    );

    const mostRecentGradeFailed =
      recentGrades.length > 0 && !recentGrades[0].success;
    const highConfidence =
      (latestAttempt?.confidence ?? 0) >= MemoryIntelligenceService.HIGH_CONFIDENCE;
    const calibrationMismatch =
      highConfidence &&
      (entry.current_state === "struggling" || mostRecentGradeFailed);

    let score = Math.round(100 * reliability * decay);
    if (calibrationMismatch) {
      score -= MemoryIntelligenceService.CALIBRATION_PENALTY;
    }
    if (recentGrades.length > 0) {
      score = Math.round((score + recentGrades[0].grade_score) / 2);
    }
    score = clamp(score);

    return {
      problemId: entry.problem_id,
      score,
      risk: riskFor(score, ageRatio),
      trend: trendFor(recentEvents, reliability),
    };
  }

  /**
   * Grades a recall test (Model 1's richest input) and persists it. Each of
   * the four recall checks is weighted equally (25 pts) since each is a
   * distinct, independently-forgettable retrieval (the pattern, the
   * algorithm, its complexity, the mistake that tripped you up last time).
   * An overall failed revision caps the grade at 40 — failing to reproduce
   * the solution is the strongest single signal and a high partial-recall
   * score must not mask it.
   */
  async gradeRecall(
    userId: string,
    input: {
      problemId: string;
      revisionId?: string | null;
      recalledPattern: boolean;
      recalledAlgorithm: boolean;
      recalledComplexity: boolean;
      recalledMistakes: boolean;
      confidence?: number | null;
      success: boolean;
    },
  ): Promise<GradeRow> {
    const checks = [
      input.recalledPattern,
      input.recalledAlgorithm,
      input.recalledComplexity,
      input.recalledMistakes,
    ];
    const rawScore = Math.round(
      (checks.filter(Boolean).length / checks.length) * 100,
    );
    const gradeScore = input.success ? rawScore : Math.min(rawScore, 40);

    const row = await this.repos.recallGrades.create({
      user_id: userId,
      problem_id: input.problemId,
      revision_id: input.revisionId ?? null,
      recalled_pattern: input.recalledPattern,
      recalled_algorithm: input.recalledAlgorithm,
      recalled_complexity: input.recalledComplexity,
      recalled_mistakes: input.recalledMistakes,
      confidence: input.confidence ?? null,
      success: input.success,
      grade_score: gradeScore,
    });

    await this.events.emit(userId, {
      eventType: EVENT_TYPES.MemoryRecallGraded,
      entityType: "problem",
      entityId: input.problemId,
      payload: { gradeScore, success: input.success },
    });

    return row;
  }

  // ---------------------------------------------------------------------------
  // evolve() — recompute everything for one user and cache it
  // ---------------------------------------------------------------------------

  /**
   * Recomputes Recall Strength for every problem in the revision queue and
   * Topic Memory Health for every visible topic/pattern, then caches both.
   * Idempotent and self-healing (recomputes from source tables every time),
   * same posture as TaxonomyService.evolve(). Safe to call after every solve
   * or revision.
   */
  async evolve(userId: string): Promise<MemoryEvolveSummary> {
    const [revisions, problems, attempts, grades, events, topics, patterns] =
      await Promise.all([
        this.repos.revision.findByUser(userId),
        this.repos.problems.listVisible(userId),
        this.repos.attempts.findByUser(userId),
        this.repos.recallGrades.findByUser(userId),
        this.repos.events.recent(userId, 500),
        this.repos.topics.listVisible(userId),
        this.repos.patterns.listVisible(userId),
      ]);

    const problemById = new Map(problems.map((p) => [p.id, p]));

    const latestAttemptByProblem = new Map<string, AttemptRow>();
    for (const a of attempts) {
      if (!latestAttemptByProblem.has(a.problem_id)) {
        latestAttemptByProblem.set(a.problem_id, a);
      }
    }

    const gradesByProblem = new Map<string, GradeRow[]>();
    for (const g of grades) {
      const list = gradesByProblem.get(g.problem_id) ?? [];
      if (list.length < 3) list.push(g);
      gradesByProblem.set(g.problem_id, list);
    }

    const revisionEventTypes = new Set<string>([
      EVENT_TYPES.RevisionSucceeded,
      EVENT_TYPES.RevisionFailed,
    ]);
    const eventsByProblem = new Map<string, EventRow[]>();
    for (const e of events) {
      if (
        e.entity_type !== "problem" ||
        !e.entity_id ||
        !revisionEventTypes.has(e.event_type)
      ) {
        continue;
      }
      const list = eventsByProblem.get(e.entity_id) ?? [];
      if (list.length < 5) list.push(e);
      eventsByProblem.set(e.entity_id, list);
    }

    const resultByProblem = new Map<string, RecallStrengthResult>();
    for (const entry of revisions) {
      const result = this.computeRecallStrength(
        entry,
        latestAttemptByProblem.get(entry.problem_id) ?? null,
        gradesByProblem.get(entry.problem_id) ?? [],
        eventsByProblem.get(entry.problem_id) ?? [],
      );
      resultByProblem.set(entry.problem_id, result);
      await this.repos.recallStrength.upsert({
        user_id: userId,
        problem_id: entry.problem_id,
        score: result.score,
        risk: result.risk,
        trend: result.trend,
        computed_at: new Date().toISOString(),
      });
    }

    let topicsScored = 0;
    for (const topic of topics) {
      await this.repos.topicMemoryHealth.upsert(
        this.rollupEntity(userId, "topic", topic.id, problemById, resultByProblem),
      );
      topicsScored += 1;
    }
    for (const pattern of patterns) {
      await this.repos.topicMemoryHealth.upsert(
        this.rollupEntity(userId, "pattern", pattern.id, problemById, resultByProblem),
      );
      topicsScored += 1;
    }

    const summary: MemoryEvolveSummary = {
      problemsScored: revisions.length,
      topicsScored,
    };
    await this.events.emit(userId, {
      eventType: EVENT_TYPES.MemoryHealthComputed,
      payload: { ...summary },
    });
    return summary;
  }

  /**
   * Model 2 — rolls up every tracked problem under one topic/pattern into a
   * single health score (the plain mean of their Recall Strength scores —
   * each tracked problem is an equally-weighted vote on the topic's health).
   * Zero tracked problems is its own bucket ('neglected') rather than a low
   * score, because "never reviewed" and "reviewed and failing" need different
   * interventions.
   */
  private rollupEntity(
    userId: string,
    entityType: EntityType,
    entityId: string,
    problemById: Map<string, Tables<"problems">>,
    resultByProblem: Map<string, RecallStrengthResult>,
  ): {
    user_id: string;
    entity_type: EntityType;
    entity_id: string;
    health_score: number;
    status: MemoryHealthStatus;
    trend: MemoryTrend;
    problems_tracked: number;
    problems_at_risk: number;
    computed_at: string;
  } {
    const tracked: RecallStrengthResult[] = [];
    for (const [problemId, result] of resultByProblem) {
      const problem = problemById.get(problemId);
      if (!problem) continue;
      const matches =
        entityType === "topic"
          ? problem.topic_id === entityId
          : problem.pattern_id === entityId;
      if (matches) tracked.push(result);
    }

    if (tracked.length === 0) {
      return {
        user_id: userId,
        entity_type: entityType,
        entity_id: entityId,
        health_score: 0,
        status: "neglected",
        trend: "stable",
        problems_tracked: 0,
        problems_at_risk: 0,
        computed_at: new Date().toISOString(),
      };
    }

    const healthScore = Math.round(
      tracked.reduce((sum, r) => sum + r.score, 0) / tracked.length,
    );
    const problemsAtRisk = tracked.filter((r) => r.score < 50).length;

    const improving = tracked.filter((r) => r.trend === "improving").length;
    const declining = tracked.filter((r) => r.trend === "declining").length;
    const trend: MemoryTrend =
      improving > declining + 1
        ? "improving"
        : declining > improving + 1
          ? "declining"
          : "stable";

    return {
      user_id: userId,
      entity_type: entityType,
      entity_id: entityId,
      health_score: healthScore,
      status: healthStatusFor(healthScore),
      trend,
      problems_tracked: tracked.length,
      problems_at_risk: problemsAtRisk,
      computed_at: new Date().toISOString(),
    };
  }

  // ---------------------------------------------------------------------------
  // Reads — cached snapshots for the dashboard and the coach
  // ---------------------------------------------------------------------------

  /** Topic/pattern health, decorated with names and grouped for display. */
  async healthSnapshot(userId: string): Promise<MemoryHealthSnapshot> {
    const [health, topics, patterns] = await Promise.all([
      this.repos.topicMemoryHealth.listForUser(userId),
      this.repos.topics.listVisible(userId),
      this.repos.patterns.listVisible(userId),
    ]);
    const nameById = new Map<string, string>();
    for (const t of topics) nameById.set(t.id, t.name);
    for (const p of patterns) nameById.set(p.id, p.name);

    const decorated: NamedTopicHealth[] = health.map((h) => ({
      entityType: h.entity_type as EntityType,
      entityId: h.entity_id,
      healthScore: h.health_score,
      status: h.status,
      trend: h.trend,
      problemsTracked: h.problems_tracked,
      problemsAtRisk: h.problems_at_risk,
      name: nameById.get(h.entity_id) ?? "Unknown",
    }));

    const tracked = decorated.filter((d) => d.problemsTracked > 0);
    const overallScore = tracked.length
      ? Math.round(
          tracked.reduce((sum, d) => sum + d.healthScore, 0) / tracked.length,
        )
      : 0;

    return {
      overallScore,
      strong: decorated.filter((d) => d.status === "strong"),
      atRisk: decorated.filter(
        (d) => d.status === "at_risk" || d.status === "decaying",
      ),
      neglected: decorated.filter((d) => d.status === "neglected"),
      all: decorated,
    };
  }

  /** Per-problem forgetting forecast (Model 3), titles resolved for display. */
  async forgettingForecast(userId: string): Promise<ForgettingForecast> {
    const [scores, problems] = await Promise.all([
      this.repos.recallStrength.listForUser(userId),
      this.repos.problems.listVisible(userId),
    ]);
    const titleById = new Map(problems.map((p) => [p.id, p.title]));
    const decorate = (s: Tables<"recall_strength">): ForecastItem => ({
      problemId: s.problem_id,
      title: titleById.get(s.problem_id) ?? "Untitled problem",
      score: s.score,
      trend: s.trend,
    });

    return {
      likelyForgotten: scores
        .filter((s) => s.risk === "likely_forgotten")
        .map(decorate),
      atRisk: scores.filter((s) => s.risk === "at_risk").map(decorate),
      stableCount: scores.filter((s) => s.risk === "stable").length,
      recentlyReinforcedCount: scores.filter(
        (s) => s.risk === "recently_reinforced",
      ).length,
    };
  }
}

function clamp(score: number): number {
  return Math.max(0, Math.min(100, score));
}

/**
 * Model 3 — Forgetting Prediction. Buckets are relative to the engine's OWN
 * schedule (ageRatio), not absolute score, because "due tomorrow at 70%" and
 * "due in three weeks at 70%" carry different urgency.
 */
function riskFor(score: number, ageRatio: number): ForgettingRisk {
  if (ageRatio >= 2) return "likely_forgotten"; // twice as overdue as predicted
  if (ageRatio >= 1 && score < 60) return "at_risk"; // due/overdue and shaky
  if (ageRatio < 0.25) return "recently_reinforced"; // reviewed very recently
  return "stable";
}

/** Topic/pattern health bucket from the rolled-up score. */
function healthStatusFor(score: number): MemoryHealthStatus {
  if (score >= 75) return "strong";
  if (score >= 55) return "stable";
  if (score >= 35) return "at_risk";
  return "decaying";
}

/**
 * Trend direction from the last up-to-5 revision events (newest first):
 * compares the success rate of the most recent attempts against the item's
 * all-time reliability. A >20-point swing either way is "improving"/
 * "declining"; anything smaller is noise.
 */
function trendFor(recentEvents: EventRow[], allTimeReliability: number): MemoryTrend {
  if (recentEvents.length === 0) return "stable";
  const recentSuccesses = recentEvents.filter(
    (e) => e.event_type === EVENT_TYPES.RevisionSucceeded,
  ).length;
  const recentRate = recentSuccesses / recentEvents.length;
  const delta = recentRate - allTimeReliability;
  if (delta > 0.2) return "improving";
  if (delta < -0.2) return "declining";
  return "stable";
}
