import type { Repositories } from "@/lib/repositories";
import type { Tables } from "@/types/database";

import { BaseService, isoDate } from "./base.service";
import { CoachOutcomeService, EFFECTIVE_THRESHOLD, type Personalization } from "./coach-outcome.service";
import { EVENT_TYPES, EventService } from "./event.service";
import { HabitEngineService, type MissedWorkItem } from "./habit-engine.service";
import { ACTION_LABEL_BY_KIND } from "@/lib/design/status";
import {
  ACTION_KIND_TO_BATTLE_KIND,
  StudentIntelligenceCoreService,
  type RiskEntry,
  type StudentAction,
} from "./student-intelligence-core.service";

type FocusMode = Tables<"user_preferences">["default_focus_mode"];

/** Small nudge on top of StudentIntelligenceCore's score — not a new ranking system, just a personalization tilt bounded to +/-20%. */
const MIN_AFFINITY_MULTIPLIER = 0.8;
const MAX_AFFINITY_MULTIPLIER = 1.2;

export interface CoachConfidence {
  averageSuccessRate: number;
  mostEffectiveKind: { label: string; successRate: number } | null;
}

export interface DailyCoachBrief {
  greeting: string;
  yesterday: { completed: number; missed: number; learningWins: number };
  today: {
    biggestOpportunity: StudentAction | null;
    /** Why biggestOpportunity was picked — personalized when there's enough data, otherwise the action's own generic detail text. Never claims confidence it doesn't have. */
    insight: string | null;
    biggestRisk: RiskEntry | null;
    recommendedPlan: StudentAction[];
    estimatedMinutes: number;
  };
  /** Null until at least one action kind has crossed CoachOutcomeService's MIN_SAMPLE — no fake metrics. */
  confidence: CoachConfidence | null;
}

export interface RecoveryBlock {
  label: string;
  minutes: number;
  items: MissedWorkItem[];
}

export interface RecoveryPlan {
  totalMissed: number;
  totalMinutes: number;
  blocks: RecoveryBlock[];
}

export interface FocusStep {
  stepNumber: number;
  action: StudentAction;
}

export interface FocusSession {
  steps: FocusStep[];
  estimatedMinutes: number;
}

/** Rough per-item minute estimate for missed work, by source — mirrors the
 * same coarse estimates `battlePlanLink()` uses for battle-plan steps. */
const MISSED_ITEM_MINUTES: Record<MissedWorkItem["sourceType"], number> = {
  reminder: 10,
  revision: 15,
  iit_assignment: 20,
  system: 10,
};

function greetingForHour(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/** First segment of a reminder category ("academic_iit" -> "academic"), used to bucket recovery work without reaching into HabitEngineService's private category tables. */
function categoryBucket(category: MissedWorkItem["category"]): string {
  if (!category) return "general";
  return category.split("_")[0];
}

/**
 * StudentCoachService — the decision layer on top of StudentIntelligenceCore.
 * It does not re-rank or re-score anything; it reads the existing ranked
 * action list and risk register, applies focus-mode gating once (instead of
 * ad hoc in the overview page), and reshapes the result into a daily brief,
 * a recovery plan for missed work, and a guided focus session. Every method
 * is read + reshape + log — no new scoring logic, no new tables. Coach
 * "tracking" is a handful of new event types emitted through the existing
 * EventService/events table.
 */
export class StudentCoachService extends BaseService {
  private readonly intelligence: StudentIntelligenceCoreService;
  private readonly habitEngine: HabitEngineService;
  private readonly events: EventService;
  private readonly outcomes: CoachOutcomeService;

  constructor(repos: Repositories) {
    super(repos);
    this.intelligence = new StudentIntelligenceCoreService(repos);
    this.habitEngine = new HabitEngineService(repos);
    this.events = new EventService(repos);
    this.outcomes = new CoachOutcomeService(repos);
  }

  async dailyBrief(userId: string, focusMode: FocusMode = "none"): Promise<DailyCoachBrief> {
    const [snapshot, yesterday, personalization] = await Promise.all([
      this.intelligence.snapshot(userId),
      this.yesterdayRecap(userId),
      this.outcomes.personalization(userId),
    ]);

    const visiblePriorities = this.rankByAffinity(
      this.gateByFocusMode(snapshot.priorities, focusMode),
      personalization,
    );
    const recommendedPlan = visiblePriorities.slice(0, 4);
    const estimatedMinutes = recommendedPlan.reduce((sum, a) => sum + a.estimatedMinutes, 0);

    await this.emitShown(userId, recommendedPlan);

    const biggestOpportunity = visiblePriorities[0] ?? null;

    const brief: DailyCoachBrief = {
      greeting: greetingForHour(new Date().getHours()),
      yesterday,
      today: {
        biggestOpportunity,
        insight: biggestOpportunity ? this.coachInsight(biggestOpportunity, personalization) : null,
        biggestRisk: snapshot.risks.entries[0] ?? null,
        recommendedPlan,
        estimatedMinutes,
      },
      confidence: this.coachConfidence(personalization),
    };

    await this.events.emit(userId, {
      eventType: EVENT_TYPES.CoachBriefGenerated,
      payload: {
        biggestOpportunityId: brief.today.biggestOpportunity?.id ?? null,
        biggestRiskId: brief.today.biggestRisk?.entityId ?? null,
        estimatedMinutes,
      },
    });

    return brief;
  }

  /**
   * The "why this recommendation" sentence (spec Step 9). Only claims what
   * the data supports — falls back to the action's own generic detail text
   * when there isn't enough personalization signal for this kind/hour.
   */
  private coachInsight(action: StudentAction, personalization: Personalization): string {
    const label = ACTION_LABEL_BY_KIND[action.kind]?.toLowerCase() ?? "this";
    const affinity = personalization.kindAffinity[action.kind];
    const currentHour = new Date().getHours();
    const nearPreferredHour =
      personalization.preferredHour !== null &&
      Math.abs(personalization.preferredHour - currentHour) <= 2;

    if (nearPreferredHour) {
      return `You usually get things done around this time — good moment to ${label}.`;
    }
    if (affinity && affinity.successRate >= EFFECTIVE_THRESHOLD) {
      return `You complete "${label}" recommendations ${Math.round(affinity.successRate * 100)}% of the time — keep the streak going.`;
    }
    return action.detail;
  }

  async recoveryPlan(userId: string): Promise<RecoveryPlan> {
    const missed = await this.habitEngine.getMissedWorkQueue(userId);

    const byBucket = new Map<string, MissedWorkItem[]>();
    for (const item of missed) {
      const bucket = categoryBucket(item.category);
      const existing = byBucket.get(bucket);
      if (existing) existing.push(item);
      else byBucket.set(bucket, [item]);
    }

    const blocks: RecoveryBlock[] = Array.from(byBucket.entries()).map(([label, items]) => ({
      label,
      minutes: items.reduce((sum, i) => sum + MISSED_ITEM_MINUTES[i.sourceType], 0),
      items,
    }));
    blocks.sort((a, b) => b.minutes - a.minutes);

    const plan: RecoveryPlan = {
      totalMissed: missed.length,
      totalMinutes: blocks.reduce((sum, b) => sum + b.minutes, 0),
      blocks,
    };

    if (plan.totalMissed > 0) {
      await this.events.emit(userId, {
        eventType: EVENT_TYPES.CoachRecoveryPlanGenerated,
        payload: {
          totalMissed: plan.totalMissed,
          totalMinutes: plan.totalMinutes,
          notificationIds: missed.map((i) => i.notificationId),
        },
      });
    }

    return plan;
  }

  async focusSession(userId: string, focusMode: FocusMode = "none"): Promise<FocusSession> {
    const [snapshot, personalization] = await Promise.all([
      this.intelligence.snapshot(userId),
      this.outcomes.personalization(userId),
    ]);
    const visible = this.rankByAffinity(
      this.gateByFocusMode(snapshot.priorities, focusMode),
      personalization,
    ).slice(0, 5);

    const steps: FocusStep[] = visible.map((action, i) => ({ stepNumber: i + 1, action }));
    const estimatedMinutes = steps.reduce((sum, s) => sum + s.action.estimatedMinutes, 0);

    if (steps.length > 0) {
      await this.events.emit(userId, {
        eventType: EVENT_TYPES.CoachFocusSessionStarted,
        payload: { stepCount: steps.length, actionIds: steps.map((s) => s.action.id) },
      });
      await this.emitShown(userId, visible);
    }

    return { steps, estimatedMinutes };
  }

  async logStepCompleted(userId: string, action: Pick<StudentAction, "id" | "kind" | "source">): Promise<void> {
    await this.events.emit(userId, {
      eventType: EVENT_TYPES.CoachFocusStepCompleted,
      entityType: "student_action",
      entityId: action.id,
      payload: { kind: action.kind, source: action.source },
    });
  }

  /** Logged when the user clicks "Start Now" — closes the shown -> started gap the outcome audit found (a plain Link fired nothing). */
  async logActionStarted(userId: string, action: Pick<StudentAction, "id" | "kind" | "source">): Promise<void> {
    await this.events.emit(userId, {
      eventType: EVENT_TYPES.CoachActionStarted,
      entityType: "student_action",
      entityId: action.id,
      payload: { kind: action.kind, source: action.source },
    });
  }

  /** Same gating HabitEngineService.getFocusModeConfig() already drives for the battle plan — exposed so every coach surface (brief, focus session, and the page's own priority/mission lists) applies it the same way instead of each call site re-deriving it. */
  gateByFocusMode(actions: StudentAction[], focusMode: FocusMode): StudentAction[] {
    const config = HabitEngineService.getFocusModeConfig(focusMode);
    if (!config.hideBattlePlanKinds?.length) return actions;
    return actions.filter((a) => {
      const bucket = ACTION_KIND_TO_BATTLE_KIND[a.kind];
      return !bucket || !config.hideBattlePlanKinds!.includes(bucket);
    });
  }

  /** A small personalization tilt on top of StudentIntelligenceCore's existing score — not a new ranking system. Kinds with no observed affinity data keep their original order (multiplier 1). */
  private rankByAffinity(actions: StudentAction[], personalization: Personalization): StudentAction[] {
    const hasAnyAffinity = Object.keys(personalization.kindAffinity).length > 0;
    if (!hasAnyAffinity) return actions;

    const withWeight = actions.map((action) => {
      const affinity = personalization.kindAffinity[action.kind];
      const multiplier = affinity
        ? MIN_AFFINITY_MULTIPLIER + (MAX_AFFINITY_MULTIPLIER - MIN_AFFINITY_MULTIPLIER) * affinity.successRate
        : 1;
      return { action, weighted: action.score * multiplier };
    });
    withWeight.sort((a, b) => b.weighted - a.weighted);
    return withWeight.map((w) => w.action);
  }

  /** Mission Control's "Coach Confidence" data — null until real data backs it (spec Step 10: "only if supported by real data, no fake metrics"). */
  private coachConfidence(personalization: Personalization): CoachConfidence | null {
    const qualifying = Object.values(personalization.kindAffinity).filter(
      (k): k is NonNullable<typeof k> => k !== undefined,
    );
    if (qualifying.length === 0) return null;

    const averageSuccessRate =
      qualifying.reduce((sum, k) => sum + k.successRate, 0) / qualifying.length;
    const top = personalization.mostEffectiveKind;

    return {
      averageSuccessRate,
      mostEffectiveKind: top
        ? { label: ACTION_LABEL_BY_KIND[top.kind] ?? top.kind, successRate: top.successRate }
        : null,
    };
  }

  /** Logs that each of these actions was shown as a recommendation — fire-and-forget, fail-soft (a telemetry failure must never block the brief/session from rendering). */
  private async emitShown(userId: string, actions: StudentAction[]): Promise<void> {
    await Promise.all(
      actions.map((action) =>
        this.events.emit(userId, {
          eventType: EVENT_TYPES.CoachRecommendationShown,
          entityType: "student_action",
          entityId: action.id,
          payload: { kind: action.kind, source: action.source, entityId: action.entityId },
        }),
      ),
    );
  }

  private async yesterdayRecap(
    userId: string,
  ): Promise<DailyCoachBrief["yesterday"]> {
    const yesterday = isoDate(new Date(Date.now() - 86_400_000));
    const [logs, events] = await Promise.all([
      safe(this.repos.dailyLogs.between(userId, yesterday, yesterday), []),
      safe(this.repos.events.recent(userId, 100), []),
    ]);

    const dayStartMs = new Date(yesterday).getTime();
    const dayEndMs = dayStartMs + 86_400_000;
    const yesterdayEvents = events.filter((e) => {
      const t = new Date(e.created_at).getTime();
      return t >= dayStartMs && t < dayEndMs;
    });

    const log = logs[0];
    const completed = (log?.problems_solved ?? 0) + (log?.revisions_done ?? 0);
    const missed = yesterdayEvents.filter((e) => e.event_type === "habit.reminder_missed").length;
    const learningWins = yesterdayEvents.filter((e) =>
      e.event_type === "concept.created" ||
      e.event_type === "knowledge.created" ||
      e.event_type === "problem.solved",
    ).length;

    return { completed, missed, learningWins };
  }
}

async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch {
    return fallback;
  }
}
