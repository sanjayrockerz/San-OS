import type { Repositories } from "@/lib/repositories";
import type { Tables } from "@/types/database";

import { BaseService } from "./base.service";
import { RevisionService } from "./revision.service";

/** What the user was last working on. */
export interface ContextPatch {
  active_entity_type: string | null;
  active_entity_id: string | null;
  active_session_type: string | null;
  current_focus_topic?: string | null;
  pending_action?: string | null;
  resume_payload?: Record<string, unknown>;
}

/**
 * A prioritised card in the "Continue Learning" panel.
 * Priority: revision (1) > concept (2) > vault (3) > problem (4) > iit (5)
 */
export interface ResumeItem {
  type: "revision" | "concept" | "vault" | "problem" | "iit";
  priority: number;
  title: string;
  reason: string;
  href: string;
  estimatedMinutes: number;
  lastTouchedAt: string | null;
  entityId: string | null;
}

/**
 * A rule-derived recommendation the app surfaces to the user.
 * No DB writes — computed fresh each dashboard load, dismissed via localStorage.
 */
export interface Recommendation {
  id: string;
  title: string;
  body: string;
  href: string | null;
  actionLabel: string;
  priority: number;
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

/** A single actionable task in the daily session orchestrator. */
export interface SessionTask {
  id: string;
  type: "revision" | "concept" | "problem" | "iit" | "roadmap";
  title: string;
  estimatedMinutes: number;
  href: string;
}

const EIGHT_DAYS_MS = 8 * 24 * 60 * 60 * 1000;

/**
 * ContextEngineService — the session memory and recommendation brain.
 *
 * Responsibilities:
 * - Remember what the user was doing (touch / getContext)
 * - Generate a priority-ranked resume list (resumePriority)
 * - Generate lightweight rule-based recommendations (recommendations)
 * - Compute the daily digest (dailyDigest)
 *
 * All methods are fail-soft. The context engine must never block a user action.
 */
export class ContextEngineService extends BaseService {
  private readonly revision: RevisionService;

  constructor(repos: Repositories) {
    super(repos);
    this.revision = new RevisionService(repos);
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
   * Priority-ranked list of things to resume.
   * 1. Due revisions (most urgent — SM-2 scheduled)
   * 2. Recently touched concepts still in 'learning' state
   * 3. Recently saved vault items with no concept link
   * 4. Recently touched problems (from attempts)
   * 5. Upcoming IIT assignments
   */
  async resumePriority(userId: string): Promise<ResumeItem[]> {
    const items: ResumeItem[] = [];

    const [due, concepts, problems, attempts, upcoming, knowledge] =
      await Promise.all([
        safe(this.revision.dueQueue(userId), []),
        safe(this.repos.concepts.findByUser(userId), []),
        safe(this.repos.problems.listVisible(userId), []),
        safe(this.repos.attempts.findByUser(userId), []),
        safe(
          this.repos.iitAssignments.upcoming(userId, new Date().toISOString().slice(0, 10)),
          [],
        ),
        safe(this.repos.knowledge.recent(userId, 20), []),
      ]);

    // 1 — Due revisions (priority 1)
    const titleMap = new Map(problems.map((p) => [p.id, p.title]));
    for (const r of due.slice(0, 3)) {
      items.push({
        type: "revision",
        priority: 1,
        title: titleMap.get(r.problem_id) ?? "Due revision",
        reason: "Scheduled for spaced repetition today",
        href: "/revision",
        estimatedMinutes: 8,
        lastTouchedAt: r.last_revision,
        entityId: r.problem_id,
      });
    }

    // 2 — Learning concepts (priority 2)
    const learningConcepts = concepts
      .filter((c) => c.status === "learning" || c.status === "weak")
      .sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
      )
      .slice(0, 2);
    for (const c of learningConcepts) {
      items.push({
        type: "concept",
        priority: 2,
        title: c.title,
        reason:
          c.status === "weak"
            ? "Marked as weak — needs reinforcement"
            : "In-progress concept note",
        href: `/concepts/${c.id}`,
        estimatedMinutes: 10,
        lastTouchedAt: c.updated_at,
        entityId: c.id,
      });
    }

    // 3 — Vault items with no links (priority 3)
    const unlinkedKnowledge = knowledge
      .filter((k) => {
        // We don't have link counts here; surface the most recent 2 vault items
        return true;
      })
      .slice(0, 2);
    for (const k of unlinkedKnowledge) {
      items.push({
        type: "vault",
        priority: 3,
        title: k.title,
        reason: "Recently saved — link it to a problem or concept",
        href: "/vault",
        estimatedMinutes: 5,
        lastTouchedAt: k.created_at,
        entityId: k.id,
      });
    }

    // 4 — Recently attempted problems (priority 4)
    const seen = new Set<string>();
    const recentAttempts = attempts
      .sort(
        (a, b) =>
          new Date(b.attempted_at ?? b.created_at).getTime() -
          new Date(a.attempted_at ?? a.created_at).getTime(),
      )
      .filter((a) => {
        if (seen.has(a.problem_id)) return false;
        seen.add(a.problem_id);
        return true;
      })
      .slice(0, 2);
    for (const a of recentAttempts) {
      const title = titleMap.get(a.problem_id) ?? "Problem";
      items.push({
        type: "problem",
        priority: 4,
        title,
        reason: "Recently worked on",
        href: `/problems/${a.problem_id}`,
        estimatedMinutes: 25,
        lastTouchedAt: a.attempted_at ?? a.created_at,
        entityId: a.problem_id,
      });
    }

    // 5 — Upcoming IIT (priority 5)
    const urgentIit = upcoming
      .filter((a) => a.status === "pending")
      .slice(0, 1);
    for (const a of urgentIit) {
      const daysUntil = a.due_date
        ? Math.ceil(
            (new Date(a.due_date).getTime() - Date.now()) / 86400000,
          )
        : null;
      items.push({
        type: "iit",
        priority: 5,
        title: a.title,
        reason:
          daysUntil !== null && daysUntil <= 3
            ? `Due in ${daysUntil} day${daysUntil === 1 ? "" : "s"} — urgent`
            : "Upcoming IIT assignment",
        href: "/iit-workspace",
        estimatedMinutes: 20,
        lastTouchedAt: null,
        entityId: a.id,
      });
    }

    return items.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Rule-based recommendations. Stateless — no DB writes.
   * Returns 3–5 actionable cards, prioritised by severity.
   */
  async recommendations(userId: string): Promise<Recommendation[]> {
    const recs: Recommendation[] = [];

    const [attempts, concepts, problems, due, knowledge, knowledgeLinks] =
      await Promise.all([
        safe(this.repos.attempts.findByUser(userId), []),
        safe(this.repos.concepts.findByUser(userId), []),
        safe(this.repos.problems.listVisible(userId), []),
        safe(this.revision.dueQueue(userId), []),
        safe(this.repos.knowledge.recent(userId, 50), []),
        safe(this.repos.knowledgeLinks.findByUser(userId), []),
      ]);

    const topicMap = new Map(problems.map((p) => [p.id, p.topic_id]));
    const linkedEntityIds = new Set(knowledgeLinks.map((l) => l.entity_id));

    // R1 — Ignored revision
    const oldestDue = due
      .filter((r) => r.last_revision !== null)
      .sort(
        (a, b) =>
          new Date(a.last_revision ?? 0).getTime() -
          new Date(b.last_revision ?? 0).getTime(),
      )[0];
    if (oldestDue) {
      const title = problems.find((p) => p.id === oldestDue.problem_id)?.title;
      const daysIgnored = oldestDue.last_revision
        ? Math.floor(
            (Date.now() - new Date(oldestDue.last_revision).getTime()) /
              86400000,
          )
        : null;
      if (daysIgnored !== null && daysIgnored >= 3) {
        recs.push({
          id: "ignored-revision",
          title: "Revision overdue",
          body: title
            ? `"${title}" has been overdue for ${daysIgnored} days.`
            : `You have ${due.length} problems overdue for revision.`,
          href: "/revision",
          actionLabel: "Start revision",
          priority: 1,
        });
      }
    }

    // R2 — Topic cluster without a concept note
    const topicFreq = new Map<string, number>();
    for (const a of attempts) {
      const tid = topicMap.get(a.problem_id);
      if (tid) topicFreq.set(tid, (topicFreq.get(tid) ?? 0) + 1);
    }
    const conceptTopicIds = new Set(
      concepts.filter((c) => c.topic_id).map((c) => c.topic_id!),
    );
    for (const [topicId, count] of topicFreq) {
      if (count >= 3 && !conceptTopicIds.has(topicId)) {
        const topicName = problems
          .find((p) => p.topic_id === topicId)
          ?.topic_id;
        recs.push({
          id: `no-concept-${topicId}`,
          title: "Write a concept note",
          body: `You've solved ${count} problems in a topic but haven't written a concept note yet.`,
          href: "/concepts/new",
          actionLabel: "Write concept",
          priority: 2,
        });
        break;
      }
    }

    // R3 — Forgotten concepts
    const forgotten = concepts.filter((c) => c.status === "forgotten");
    if (forgotten.length > 0) {
      recs.push({
        id: "forgotten-concepts",
        title: `${forgotten.length} forgotten concept${forgotten.length > 1 ? "s" : ""}`,
        body: `You have ${forgotten.length} concept note${forgotten.length > 1 ? "s" : ""} marked forgotten. Schedule a re-learn session.`,
        href: "/concepts",
        actionLabel: "Review concepts",
        priority: 2,
      });
    }

    // R4 — Vault items not linked to anything
    const unlinkedVault = knowledge.filter(
      (k) => !linkedEntityIds.has(k.id),
    );
    if (unlinkedVault.length >= 3) {
      recs.push({
        id: "unlinked-vault",
        title: "Unlinked vault items",
        body: `${unlinkedVault.length} vault items haven't been linked to a problem or concept.`,
        href: "/vault",
        actionLabel: "Open vault",
        priority: 3,
      });
    }

    // R5 — No revision for > 8 days
    const lastRevisionEvent = attempts.find((a) => a.attempted_at);
    const daysSinceAnyActivity = lastRevisionEvent?.attempted_at
      ? Math.floor(
          (Date.now() - new Date(lastRevisionEvent.attempted_at).getTime()) /
            86400000,
        )
      : null;
    if (daysSinceAnyActivity !== null && daysSinceAnyActivity >= 2 && due.length === 0) {
      recs.push({
        id: "no-new-problems",
        title: "Keep the streak alive",
        body: "You haven't logged a new problem recently. Pick one to maintain momentum.",
        href: "/problems/new",
        actionLabel: "Add problem",
        priority: 4,
      });
    }

    return recs.sort((a, b) => a.priority - b.priority).slice(0, 5);
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

  /**
   * Orchestrates a daily session plan by aggregating due revisions, unfinished problems,
   * IIT deadlines, and roadmap targets. Returns an ordered list of SessionTasks.
   */
  async buildDailyPlan(userId: string): Promise<SessionTask[]> {
    const tasks: SessionTask[] = [];
    const maxItems = 5;

    const [due, concepts, attempts, upcoming] = await Promise.all([
      safe(this.revision.dueQueue(userId), []),
      safe(this.repos.concepts.findByUser(userId), []),
      safe(this.repos.attempts.findByUser(userId), []),
      safe(
        this.repos.iitAssignments.upcoming(userId, new Date().toISOString().slice(0, 10)),
        [],
      ),
    ]);

    // 1. Add up to 2 due revisions
    const dueRevisions = due.slice(0, 2);
    for (const r of dueRevisions) {
      const problem = await safe(this.repos.problems.findById(r.problem_id), null);
      if (problem) {
        tasks.push({
          id: `rev-${r.id}`,
          type: "revision",
          title: `Revise ${problem.title}`,
          estimatedMinutes: 8,
          href: `/problems/${r.problem_id}`,
        });
      }
    }

    // 2. Add an unfinished concept or problem
    const unfinishedConcept = concepts.find((c) => c.status === "learning" || c.status === "weak");
    if (unfinishedConcept && tasks.length < maxItems) {
      tasks.push({
        id: `con-${unfinishedConcept.id}`,
        type: "concept",
        title: `Review ${unfinishedConcept.title} notes`,
        estimatedMinutes: 7,
        href: `/concepts/${unfinishedConcept.id}`,
      });
    }

    // 3. Add an upcoming IIT assignment
    const pendingIit = upcoming.find((a) => a.status === "pending");
    if (pendingIit && tasks.length < maxItems) {
      tasks.push({
        id: `iit-${pendingIit.id}`,
        type: "iit",
        title: `Complete ${pendingIit.title}`,
        estimatedMinutes: 20,
        href: `/iit-workspace`,
      });
    }

    // 4. Fill remaining slots with new problem suggestions based on roadmap or general
    if (tasks.length < maxItems) {
      tasks.push({
        id: `prob-new`,
        type: "problem",
        title: `Solve one new problem`,
        estimatedMinutes: 25,
        href: `/problems`,
      });
    }

    return tasks.slice(0, maxItems);
  }
}

async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch {
    return fallback;
  }
}
