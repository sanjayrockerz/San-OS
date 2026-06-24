import type { Repositories } from "@/lib/repositories";
import type { Json, Tables } from "@/types/database";

import { BaseService } from "./base.service";
import { EVENT_TYPES, type EventType } from "./event.service";
import type { StudentAction } from "./student-intelligence-core.service";

type EventRow = Tables<"events">;

/** How long after "started" a real completion event still counts toward the recommendation. */
const WINDOW_MS = 72 * 60 * 60 * 1000;
/** Below this many "shown" samples, a kind is omitted entirely rather than reported with a misleadingly confident rate. */
const MIN_SAMPLE = 3;
/** Below this start-rate (of shown -> started), a kind is considered ignored. */
const IGNORE_THRESHOLD = 0.3;
/** A kind needs at least this success rate to be called "effective" for an insight sentence. */
export const EFFECTIVE_THRESHOLD = 0.6;

export interface KindEffectiveness {
  kind: StudentAction["kind"];
  shown: number;
  started: number;
  completed: number;
  successRate: number;
  startRate: number;
}

export interface FocusSessionStats {
  sessionsStarted: number;
  sessionsCompleted: number;
  completionRate: number;
  avgDurationMinutes: number | null;
}

export interface RecoveryStats {
  generated: number;
  completed: number;
  abandoned: number;
  avgRecoveryHours: number | null;
}

export interface Personalization {
  preferredHour: number | null;
  kindAffinity: Partial<Record<StudentAction["kind"], KindEffectiveness>>;
  ignoredKinds: StudentAction["kind"][];
  mostEffectiveKind: KindEffectiveness | null;
}

interface CompletionRule {
  events: EventType[];
  match: "entityId" | "any";
}

/**
 * Which real domain-completion events count as "this recommendation worked",
 * per StudentAction kind — derived from the Phase C outcome audit. Kinds with
 * no joinable completion signal today (review_resource, review_course,
 * address_missed_work — see audit) are intentionally absent: they're omitted
 * from effectiveness output rather than reported with a fabricated rate.
 * link_pattern is never actually produced by any generator, so it's absent too.
 */
const ACTION_KIND_COMPLETION: Partial<Record<StudentAction["kind"], CompletionRule>> = {
  revise_problem: { events: [EVENT_TYPES.RevisionSucceeded, EVENT_TYPES.ProblemSolved], match: "entityId" },
  strengthen_problem: { events: [EVENT_TYPES.RevisionSucceeded, EVENT_TYPES.ProblemSolved], match: "entityId" },
  resume_problem: { events: [EVENT_TYPES.RevisionSucceeded, EVENT_TYPES.ProblemSolved], match: "entityId" },
  review_concept: { events: [EVENT_TYPES.ConceptRevised], match: "entityId" },
  link_vault_item: { events: [EVENT_TYPES.KnowledgeLinked], match: "entityId" },
  complete_assignment: { events: [EVENT_TYPES.AssignmentCompleted], match: "entityId" },
  solve_new: { events: [EVENT_TYPES.ProblemSolved], match: "any" },
  approve_taxonomy: { events: [EVENT_TYPES.TaxonomyApproved], match: "any" },
  create_concept_note: { events: [EVENT_TYPES.ConceptCreated], match: "any" },
};

const PREFERRED_HOUR_EVENTS: EventType[] = [
  EVENT_TYPES.ProblemSolved,
  EVENT_TYPES.RevisionSucceeded,
  EVENT_TYPES.ConceptRevised,
];

function payloadField(payload: Json, key: string): unknown {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return undefined;
  return (payload as Record<string, Json | undefined>)[key];
}

function timeMs(e: EventRow): number {
  return new Date(e.created_at).getTime();
}

/**
 * CoachOutcomeService — the read side of "coach memory". It does not rank or
 * recommend anything; it reads the existing append-only `events` table (the
 * same one every domain service already writes to) and correlates
 * coach.recommendation_shown / coach.action_started / real completion events
 * to answer "did this kind of recommendation actually work". No new tables,
 * no AI — every number here is a count over observed events.
 */
export class CoachOutcomeService extends BaseService {
  constructor(repos: Repositories) {
    super(repos);
  }

  async effectiveness(userId: string): Promise<KindEffectiveness[]> {
    const events = await safe(this.repos.events.recent(userId, 300), []);
    const shown = events.filter((e) => e.event_type === EVENT_TYPES.CoachRecommendationShown);
    const started = events.filter((e) => e.event_type === EVENT_TYPES.CoachActionStarted);

    const byKind = new Map<string, EventRow[]>();
    for (const e of shown) {
      const kind = payloadField(e.payload, "kind");
      if (typeof kind !== "string") continue;
      const list = byKind.get(kind);
      if (list) list.push(e);
      else byKind.set(kind, [e]);
    }

    const results: KindEffectiveness[] = [];
    for (const [kind, kindShown] of byKind) {
      if (kindShown.length < MIN_SAMPLE) continue;
      const rule = ACTION_KIND_COMPLETION[kind as StudentAction["kind"]];
      if (!rule) continue;

      const kindStarted = started.filter((e) => payloadField(e.payload, "kind") === kind);
      const completionEvents = events.filter((e) => rule.events.includes(e.event_type as EventType));

      let completed = 0;
      for (const s of kindShown) {
        const entityId = payloadField(s.payload, "entityId");
        const windowEnd = timeMs(s) + WINDOW_MS;
        const hit = completionEvents.some((c) => {
          const t = timeMs(c);
          if (t < timeMs(s) || t > windowEnd) return false;
          if (rule.match === "any") return true;
          return typeof entityId === "string" && entityId.length > 0 && c.entity_id === entityId;
        });
        if (hit) completed++;
      }

      results.push({
        kind: kind as StudentAction["kind"],
        shown: kindShown.length,
        started: kindStarted.length,
        completed,
        successRate: completed / kindShown.length,
        startRate: kindStarted.length / kindShown.length,
      });
    }

    return results.sort((a, b) => b.successRate - a.successRate);
  }

  async focusSessionStats(userId: string): Promise<FocusSessionStats> {
    const events = await safe(this.repos.events.recent(userId, 300), []);
    const sessions = events.filter((e) => e.event_type === EVENT_TYPES.CoachFocusSessionStarted);
    const stepCompletions = events.filter((e) => e.event_type === EVENT_TYPES.CoachFocusStepCompleted);

    let completedSessions = 0;
    const durations: number[] = [];
    for (const session of sessions) {
      const actionIds = payloadField(session.payload, "actionIds");
      if (!Array.isArray(actionIds) || actionIds.length === 0) continue;

      const matches = stepCompletions.filter(
        (c) => timeMs(c) >= timeMs(session) && typeof c.entity_id === "string" && actionIds.includes(c.entity_id),
      );
      const completedIds = new Set(matches.map((m) => m.entity_id));
      if (actionIds.every((id) => typeof id === "string" && completedIds.has(id))) {
        completedSessions++;
        const lastCompletion = Math.max(...matches.map(timeMs));
        durations.push((lastCompletion - timeMs(session)) / 60_000);
      }
    }

    return {
      sessionsStarted: sessions.length,
      sessionsCompleted: completedSessions,
      completionRate: sessions.length > 0 ? completedSessions / sessions.length : 0,
      avgDurationMinutes:
        durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : null,
    };
  }

  async recoveryStats(userId: string): Promise<RecoveryStats> {
    const events = await safe(this.repos.events.recent(userId, 300), []);
    const plans = events.filter((e) => e.event_type === EVENT_TYPES.CoachRecoveryPlanGenerated);
    const completions = events.filter((e) => e.event_type === EVENT_TYPES.HabitNotificationCompleted);
    const nowMs = new Date().getTime();
    const ABANDON_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

    let completed = 0;
    let abandoned = 0;
    const recoveryHours: number[] = [];

    for (const plan of plans) {
      const notificationIds = payloadField(plan.payload, "notificationIds");
      if (!Array.isArray(notificationIds) || notificationIds.length === 0) continue;

      const matches = completions.filter(
        (c) => timeMs(c) >= timeMs(plan) && typeof c.entity_id === "string" && notificationIds.includes(c.entity_id),
      );
      if (matches.length > 0) {
        completed++;
        const firstCompletion = Math.min(...matches.map(timeMs));
        recoveryHours.push((firstCompletion - timeMs(plan)) / 3_600_000);
      } else if (nowMs - timeMs(plan) > ABANDON_AFTER_MS) {
        abandoned++;
      }
    }

    return {
      generated: plans.length,
      completed,
      abandoned,
      avgRecoveryHours:
        recoveryHours.length > 0
          ? Math.round((recoveryHours.reduce((a, b) => a + b, 0) / recoveryHours.length) * 10) / 10
          : null,
    };
  }

  async personalization(userId: string): Promise<Personalization> {
    const [kindAffinityList, events] = await Promise.all([
      this.effectiveness(userId),
      safe(this.repos.events.recent(userId, 300), []),
    ]);

    const hourEvents = events.filter((e) => PREFERRED_HOUR_EVENTS.includes(e.event_type as EventType));
    const hourCounts = new Map<number, number>();
    for (const e of hourEvents) {
      const hour = new Date(e.created_at).getHours();
      hourCounts.set(hour, (hourCounts.get(hour) ?? 0) + 1);
    }
    let preferredHour: number | null = null;
    let bestCount = 0;
    for (const [hour, count] of hourCounts) {
      if (count > bestCount) {
        bestCount = count;
        preferredHour = hour;
      }
    }

    const kindAffinity: Partial<Record<StudentAction["kind"], KindEffectiveness>> = {};
    for (const k of kindAffinityList) kindAffinity[k.kind] = k;

    const ignoredKinds = kindAffinityList.filter((k) => k.startRate < IGNORE_THRESHOLD).map((k) => k.kind);
    const mostEffectiveKind =
      kindAffinityList.find((k) => k.successRate >= EFFECTIVE_THRESHOLD) ?? null;

    return { preferredHour, kindAffinity, ignoredKinds, mostEffectiveKind };
  }
}

async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch {
    return fallback;
  }
}
