import type { Repositories } from "@/lib/repositories";
import type { Tables } from "@/types/database";

import { BaseService } from "./base.service";
import { MemoryGraphService } from "./memory-graph.service";

/** What the user was last working on. */
export interface ContextPatch {
  active_entity_type: string | null;
  active_entity_id: string | null;
  active_session_type: string | null;
  current_focus_topic?: string | null;
  pending_action?: string | null;
  resume_payload?: Record<string, unknown>;
}

/** Today's learning digest: a snapshot of what the user accomplished. */
export interface DailyDigest {
  problemsSolved: number;
  revisionsCompleted: number;
  conceptsCreated: number;
  knowledgeAdded: number;
  iitCompleted: number;
  streak: number;
  observation: string | null;
}

/**
 * ContextEngineService — session memory only: remembers what the user was
 * last doing (touch/getOrCreate) and computes today's digest. The "what
 * should the user do next" responsibility this service used to own
 * (resumePriority/recommendations/buildDailyPlan) has moved to
 * {@link StudentIntelligenceCoreService} — see its `continueLearning`,
 * `recommendations`, and `dailyPlan` formatters — so there is exactly one
 * place that ranks next actions.
 *
 * All methods are fail-soft. The context engine must never block a user action.
 */
export class ContextEngineService extends BaseService {
  private memoryGraphService: MemoryGraphService;

  constructor(repos: Repositories) {
    super(repos);
    this.memoryGraphService = new MemoryGraphService(repos);
  }

  /** Retrieve or initialize the context row for a user. */
  async getOrCreate(userId: string): Promise<Tables<"user_context">> {
    const existing = await this.repos.userContext.findByUser(userId);
    if (existing) return existing;
    return this.repos.userContext.upsert(userId, {
      active_entity_type: null,
      active_entity_id: null,
      active_session_type: null,
      current_focus_topic: null,
      pending_action: null,
      resume_payload: {},
    });
  }

  /**
   * Fail-soft context update. Called from every server action after a mutation.
   * Silently swallows errors — context updates must never block the user.
   */
  async touch(userId: string, patch: Partial<ContextPatch>): Promise<void> {
    try {
      await this.repos.userContext.upsert(userId, {
        active_entity_type: patch.active_entity_type ?? null,
        active_entity_id: patch.active_entity_id ?? null,
        active_session_type: patch.active_session_type ?? null,
        current_focus_topic: patch.current_focus_topic ?? null,
        pending_action: patch.pending_action ?? null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resume_payload: (patch.resume_payload ?? {}) as any,
      });
    } catch {
      // intentionally silenced
    }
  }

  /**
   * Retrieves the surrounding context for a given entity, traversing the Memory Graph.
   */
  async getSurroundingContext(userId: string, entityType: string, entityId: string) {
    try {
      const graph = await this.memoryGraphService.traverseGraph(userId, entityType, entityId, 2);
      
      // We can group the nodes by type to return a clean contextual object
      const context: Record<string, string[]> = {};
      
      for (const node of graph.nodes) {
        if (!context[node.type]) {
          context[node.type] = [];
        }
        if (node.id !== entityId) { // don't include self in the context list
          context[node.type].push(node.id);
        }
      }

      return {
        graph,
        groupedContext: context
      };
    } catch (e) {
      console.error("Failed to fetch surrounding context", e);
      return { graph: { nodes: [], edges: [] }, groupedContext: {} };
    }
  }

  /**
   * Today's digest — what the user accomplished.
   * Reads from daily_logs for today + events.
   */
  async dailyDigest(userId: string): Promise<DailyDigest> {
    const today = new Date().toISOString().slice(0, 10);
    const [logs, events, concepts, knowledge] = await Promise.all([
      safe(this.repos.dailyLogs.between(userId, today, today), []),
      safe(this.repos.events.recent(userId, 50), []),
      safe(this.repos.concepts.findByUser(userId), []),
      safe(this.repos.knowledge.recent(userId, 20), []),
    ]);

    const todayLog = logs[0];
    const todayStart = new Date(today).getTime();
    const todayEvents = events.filter(
      (e) => new Date(e.created_at).getTime() >= todayStart,
    );

    const problemsSolved = todayLog?.problems_solved ?? 0;
    const revisionsCompleted = todayLog?.revisions_done ?? 0;
    const conceptsCreated = todayEvents.filter(
      (e) => e.event_type === "concept.created",
    ).length;
    const knowledgeAdded = todayEvents.filter(
      (e) => e.event_type === "knowledge.created",
    ).length;
    const iitCompleted = todayEvents.filter(
      (e) =>
        e.event_type === "assignment.completed" ||
        e.event_type === "lecture.watched",
    ).length;

    // Observation
    let observation: string | null = null;
    if (problemsSolved > 0 && revisionsCompleted > 0) {
      observation = `Solid session — ${problemsSolved} solved and ${revisionsCompleted} revised.`;
    } else if (problemsSolved > 0) {
      observation = `Good work on ${problemsSolved} new problem${problemsSolved > 1 ? "s" : ""}. Don't forget revision.`;
    } else if (revisionsCompleted > 0) {
      observation = `${revisionsCompleted} revision${revisionsCompleted > 1 ? "s" : ""} completed. Keep it up.`;
    } else if (conceptsCreated > 0 || knowledgeAdded > 0) {
      observation = "Good knowledge session today.";
    }

    // Streak (simple: count logs[0].log_date = today)
    const streak = todayLog
      ? (await safe(this.countStreak(userId, today), 0))
      : 0;

    return {
      problemsSolved,
      revisionsCompleted,
      conceptsCreated,
      knowledgeAdded,
      iitCompleted,
      streak,
      observation,
    };
  }

  private async countStreak(userId: string, today: string): Promise<number> {
    const logs = await this.repos.dailyLogs.between(
      userId,
      new Date(Date.now() - 60 * 86400000).toISOString().slice(0, 10),
      today,
    );
    const active = new Set(
      logs
        .filter(
          (l) => (l.problems_solved ?? 0) > 0 || (l.revisions_done ?? 0) > 0,
        )
        .map((l) => l.log_date),
    );
    let streak = 0;
    const cursor = new Date(today);
    while (active.has(cursor.toISOString().slice(0, 10))) {
      streak++;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }
    return streak;
  }
}

async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch {
    return fallback;
  }
}
