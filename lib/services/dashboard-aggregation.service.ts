import type { Repositories } from "@/lib/repositories";
import type { Tables } from "@/types/database";

import { AiService, type BattlePlanStep } from "./ai.service";
import { BaseService } from "./base.service";
import { RevisionService } from "./revision.service";
import { TimelineService, type TimelineItem } from "./timeline.service";

const SOLVED_STATUSES = new Set(["solved", "solved_with_help", "partial"]);
const WEEKLY_TARGET = 21;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Top-of-page headline numbers. */
export interface HeroSummary {
  totalProblems: number;
  uniqueSolved: number;
  solvedThisWeek: number;
  weeklyTarget: number;
  revisionDue: number;
}

/** A revision-queue entry resolved with its problem title for display. */
export interface RevisionQueueItem {
  problemId: string;
  title: string;
  state: Tables<"revision_queue">["current_state"];
  nextRevision: string | null;
}

/** A topic the user is weak at, with how many struggling problems sit under it. */
export interface WeakTopic {
  topicId: string;
  name: string;
  strugglingCount: number;
}

/** Per-roadmap completion summary. */
export interface RoadmapProgressItem {
  roadmapId: string;
  title: string;
  completed: number;
  total: number;
}

/** An upcoming assignment surfaced on the dashboard. */
export interface UpcomingAssignment {
  id: string;
  title: string;
  dueDate: string | null;
  status: Tables<"iit_assignments">["status"];
}

/** A problem the user can resume. */
export interface ContinueLearningItem {
  problemId: string;
  title: string;
  lastTouchedAt: string;
}

/**
 * The single object the overview/dashboard renders. Everything the page needs
 * is assembled here so the React layer holds NO analytics logic and issues NO
 * direct domain-table queries.
 */
export interface DashboardAggregate {
  hero: HeroSummary;
  battlePlan: BattlePlanStep[];
  revisionQueue: RevisionQueueItem[];
  aiInsights: Tables<"ai_insights">[];
  activityTimeline: TimelineItem[];
  weakTopics: WeakTopic[];
  roadmapProgress: RoadmapProgressItem[];
  upcomingAssignments: UpcomingAssignment[];
  continueLearning: ContinueLearningItem[];
}

/**
 * Tiny per-process TTL cache. The overview is read on most navigations; a full
 * aggregation fans out to ~a dozen queries, so we memoise the assembled
 * snapshot per user for a short window. Mutations (solve/revise/...) revalidate
 * the route, and the TTL bounds staleness regardless. Personal-OS scale: a
 * handful of users, so a module Map is appropriate (no external cache infra).
 */
const CACHE_TTL_MS = 30_000;
const cache = new Map<string, { at: number; snapshot: DashboardAggregate }>();

/**
 * DashboardAggregationService — the one read model for the overview. It NEVER
 * mutates state; it composes analytics, revision, AI (read-only battle plan),
 * timeline and the domain repositories into a single {@link DashboardAggregate}.
 */
export class DashboardAggregationService extends BaseService {
  private readonly revision: RevisionService;
  private readonly ai: AiService;
  private readonly timeline: TimelineService;

  constructor(repos: Repositories) {
    super(repos);
    this.revision = new RevisionService(repos);
    this.ai = new AiService(repos);
    this.timeline = new TimelineService(repos);
  }

  /** Invalidate the cached snapshot for a user (call after a mutation if eager). */
  static invalidate(userId: string): void {
    cache.delete(userId);
  }

  /**
   * Assembles the whole dashboard. Each section is independently fail-soft so a
   * single behind-migration table (or a transient error) degrades that section
   * to empty rather than blanking the page.
   */
  async snapshot(userId: string, useCache = true): Promise<DashboardAggregate> {
    if (useCache) {
      const hit = cache.get(userId);
      if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.snapshot;
    }

    const [
      problems,
      attempts,
      due,
      weak,
      aiInsights,
      battlePlan,
      activityTimeline,
      roadmapProgress,
      upcomingAssignments,
    ] = await Promise.all([
      safe(this.repos.problems.listVisible(userId), [] as Tables<"problems">[]),
      safe(this.repos.attempts.findByUser(userId), [] as Tables<"problem_attempts">[]),
      safe(this.revision.dueQueue(userId), [] as Tables<"revision_queue">[]),
      safe(this.revision.weakQueue(userId), [] as Tables<"revision_queue">[]),
      safe(this.repos.aiInsights.active(userId), [] as Tables<"ai_insights">[]),
      safe(this.ai.battlePlan(userId), [] as BattlePlanStep[]),
      safe(this.timeline.getUserTimeline(userId, 20), [] as TimelineItem[]),
      safe(this.roadmapProgress(userId), [] as RoadmapProgressItem[]),
      safe(this.upcomingAssignments(userId), [] as UpcomingAssignment[]),
    ]);

    const titleByProblem = new Map(problems.map((p) => [p.id, p.title]));
    const topicByProblem = new Map(problems.map((p) => [p.id, p.topic_id]));

    const snapshot: DashboardAggregate = {
      hero: this.hero(problems, attempts, due),
      battlePlan,
      revisionQueue: due.slice(0, 10).map((r) => ({
        problemId: r.problem_id,
        title: titleByProblem.get(r.problem_id) ?? "Untitled problem",
        state: r.current_state,
        nextRevision: r.next_revision,
      })),
      aiInsights,
      activityTimeline,
      weakTopics: await safe(
        this.weakTopics(userId, weak, topicByProblem),
        [] as WeakTopic[],
      ),
      roadmapProgress,
      upcomingAssignments,
      continueLearning: this.continueLearning(attempts, titleByProblem),
    };

    cache.set(userId, { at: Date.now(), snapshot });
    return snapshot;
  }

  // ---------------------------------------------------------------------------
  // Section builders
  // ---------------------------------------------------------------------------

  private hero(
    problems: Tables<"problems">[],
    attempts: Tables<"problem_attempts">[],
    due: Tables<"revision_queue">[],
  ): HeroSummary {
    const solvedAttempts = attempts.filter(
      (a) => a.solve_status && SOLVED_STATUSES.has(a.solve_status),
    );
    const uniqueSolved = new Set(solvedAttempts.map((a) => a.problem_id)).size;
    const weekAgo = Date.now() - WEEK_MS;
    const solvedThisWeek = solvedAttempts.filter(
      (a) => new Date(a.attempted_at ?? a.created_at).getTime() >= weekAgo,
    ).length;

    return {
      totalProblems: problems.length,
      uniqueSolved,
      solvedThisWeek,
      weeklyTarget: WEEKLY_TARGET,
      revisionDue: due.length,
    };
  }

  /** Group struggling revision items by their problem's topic. */
  private async weakTopics(
    userId: string,
    weak: Tables<"revision_queue">[],
    topicByProblem: Map<string, string | null>,
  ): Promise<WeakTopic[]> {
    const counts = new Map<string, number>();
    for (const w of weak) {
      const topicId = topicByProblem.get(w.problem_id) ?? null;
      if (!topicId) continue;
      counts.set(topicId, (counts.get(topicId) ?? 0) + 1);
    }
    if (counts.size === 0) return [];

    const out: WeakTopic[] = [];
    for (const [topicId, strugglingCount] of counts) {
      const topic = await this.repos.topics.findById(topicId);
      out.push({
        topicId,
        name: topic?.name ?? "Unknown topic",
        strugglingCount,
      });
    }
    return out.sort((a, b) => b.strugglingCount - a.strugglingCount).slice(0, 6);
  }

  private async roadmapProgress(
    userId: string,
  ): Promise<RoadmapProgressItem[]> {
    const roadmaps = await this.repos.roadmaps.listVisible(userId);
    const out: RoadmapProgressItem[] = [];
    for (const roadmap of roadmaps) {
      const [items, progress] = await Promise.all([
        this.repos.roadmapItems.findByRoadmap(roadmap.id),
        this.repos.roadmapProgress.findByRoadmap(userId, roadmap.id),
      ]);
      const completedItems = new Set(
        progress.filter((p) => p.status === "completed").map((p) => p.item_id),
      );
      const total = items.filter((i) => !i.is_section).length;
      const completed = items.filter(
        (i) => !i.is_section && completedItems.has(i.id),
      ).length;
      if (total === 0) continue;
      out.push({ roadmapId: roadmap.id, title: roadmap.title, completed, total });
    }
    return out;
  }

  private async upcomingAssignments(
    userId: string,
  ): Promise<UpcomingAssignment[]> {
    const now = new Date().toISOString();
    const rows = await this.repos.iitAssignments.upcoming(userId, now);
    return rows
      .filter((a) => a.status !== "graded" && a.status !== "submitted")
      .slice(0, 5)
      .map((a) => ({
        id: a.id,
        title: a.title,
        dueDate: a.due_date,
        status: a.status,
      }));
  }

  private continueLearning(
    attempts: Tables<"problem_attempts">[],
    titleByProblem: Map<string, string>,
  ): ContinueLearningItem[] {
    const seen = new Set<string>();
    const out: ContinueLearningItem[] = [];
    for (const a of attempts) {
      if (seen.has(a.problem_id)) continue;
      seen.add(a.problem_id);
      out.push({
        problemId: a.problem_id,
        title: titleByProblem.get(a.problem_id) ?? "Untitled problem",
        lastTouchedAt: a.attempted_at ?? a.created_at,
      });
      if (out.length >= 5) break;
    }
    return out;
  }
}

/** Resolve a promise to a fallback if it rejects — keeps each section isolated. */
async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch {
    return fallback;
  }
}
