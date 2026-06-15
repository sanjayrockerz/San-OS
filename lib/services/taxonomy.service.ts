import type { Repositories } from "@/lib/repositories";
import type { Tables, TablesInsert } from "@/types/database";

import { BaseService } from "./base.service";
import { EVENT_TYPES, EventService } from "./event.service";

type TopicRow = Tables<"topics">;
type PatternRow = Tables<"patterns">;
type EntityType = "topic" | "pattern";

/** A taxonomy row decorated with the caller's personal usage signal. */
export type RankedTopic = TopicRow & {
  usageCount: number;
  relevanceScore: number;
};
export type RankedPattern = PatternRow & {
  usageCount: number;
  relevanceScore: number;
};

/** What one `evolve()` pass changed, for logging/telemetry/UI. */
export interface EvolveSummary {
  reranked: number;
  topicsProposed: number;
  topicsAutoAdded: number;
  patternsProposed: number;
  patternsAutoAdded: number;
}

/**
 * TaxonomyService — keeps the topic/pattern taxonomy *alive* for each user
 * instead of frozen at the seed. Three mechanisms, all per user:
 *
 *   1. Usage-driven re-ranking. Every topic/pattern the user actually practises
 *      (via problem attempts) accrues a `relevance_score` that decays with time,
 *      so the taxonomy surfaces what is hot and lets the untouched fade.
 *   2. AI proposes -> you approve. Candidates mined from the user's own notes
 *      land as `status='proposed'` for a one-tap approve/dismiss.
 *   3. AI auto-add. High-confidence candidates go live silently and are
 *      surfaced as an insight so nothing happens behind the user's back.
 *
 * Like AiService this is deterministic rule-based logic over the user's data;
 * a later phase can swap the candidate detection for an LLM without changing
 * the persistence or approval flow.
 */
export class TaxonomyService extends BaseService {
  private readonly events: EventService;

  /** Recency half-life: a topic untouched for this many days halves in score. */
  private static readonly HALF_LIFE_DAYS = 14;
  /** Min occurrences for the engine to *suggest* a new taxon. */
  private static readonly PROPOSE_MIN = 2;
  /** Min occurrences for the engine to add one *automatically*. */
  private static readonly AUTO_ADD_MIN = 5;

  constructor(repos: Repositories) {
    super(repos);
    this.events = new EventService(repos);
  }

  // ---------------------------------------------------------------------------
  // Reads — visible taxonomy merged with the caller's personal ranking
  // ---------------------------------------------------------------------------

  /** Visible topics (global seed + own), ordered by personal relevance. */
  async listTopics(userId: string): Promise<RankedTopic[]> {
    const [topics, usage] = await Promise.all([
      this.repos.topics.listOrdered(userId),
      this.repos.taxonomyUsage.ranked(userId, "topic"),
    ]);
    const byId = this.indexUsage(usage);
    return topics
      .map((t) => ({
        ...t,
        usageCount: byId.get(t.id)?.usage_count ?? 0,
        relevanceScore: byId.get(t.id)?.relevance_score ?? 0,
      }))
      .sort(
        (a, b) =>
          b.relevanceScore - a.relevanceScore ||
          a.order_index - b.order_index ||
          a.name.localeCompare(b.name),
      );
  }

  /** Visible patterns (global seed + own), ordered by personal relevance. */
  async listPatterns(userId: string): Promise<RankedPattern[]> {
    const [patterns, usage] = await Promise.all([
      this.repos.patterns.listVisible(userId),
      this.repos.taxonomyUsage.ranked(userId, "pattern"),
    ]);
    const byId = this.indexUsage(usage);
    return patterns
      .map((p) => ({
        ...p,
        usageCount: byId.get(p.id)?.usage_count ?? 0,
        relevanceScore: byId.get(p.id)?.relevance_score ?? 0,
      }))
      .sort(
        (a, b) =>
          b.relevanceScore - a.relevanceScore || a.name.localeCompare(b.name),
      );
  }

  /** The pending approval queue: AI-proposed topics and patterns. */
  async listProposals(
    userId: string,
  ): Promise<{ topics: TopicRow[]; patterns: PatternRow[] }> {
    const [topics, patterns] = await Promise.all([
      this.repos.topics.listProposals(userId),
      this.repos.patterns.listProposals(userId),
    ]);
    return { topics, patterns };
  }

  // ---------------------------------------------------------------------------
  // Approve / dismiss a proposal
  // ---------------------------------------------------------------------------

  async approve(
    userId: string,
    entityType: EntityType,
    id: string,
  ): Promise<TopicRow | PatternRow> {
    const repo = entityType === "topic" ? this.repos.topics : this.repos.patterns;
    const row = await repo.update(id, { status: "active", source: "user" });
    await this.events.emit(userId, {
      eventType: EVENT_TYPES.TaxonomyApproved,
      entityType,
      entityId: id,
      payload: { slug: row.slug, name: row.name },
    });
    return row;
  }

  async dismiss(
    userId: string,
    entityType: EntityType,
    id: string,
  ): Promise<void> {
    const repo = entityType === "topic" ? this.repos.topics : this.repos.patterns;
    await repo.update(id, { status: "dismissed" });
    await this.events.emit(userId, {
      eventType: EVENT_TYPES.TaxonomyDismissed,
      entityType,
      entityId: id,
    });
  }

  // ---------------------------------------------------------------------------
  // The evolve engine — re-rank from usage, then mine new candidates
  // ---------------------------------------------------------------------------

  /**
   * Recompute everything for one user from the source of truth (attempts +
   * notes) and grow the taxonomy. Idempotent and self-healing: it derives usage
   * straight from attempts rather than trusting incremental counters, so running
   * it twice is harmless. Safe to call on a schedule or after a solve.
   */
  async evolve(userId: string): Promise<EvolveSummary> {
    const reranked = await this.rerankFromAttempts(userId);
    const topics = await this.mineTopicCandidates(userId);
    const patterns = await this.minePatternCandidates(userId);

    const summary: EvolveSummary = {
      reranked,
      topicsProposed: topics.proposed,
      topicsAutoAdded: topics.autoAdded,
      patternsProposed: patterns.proposed,
      patternsAutoAdded: patterns.autoAdded,
    };

    await this.events.emit(userId, {
      eventType: EVENT_TYPES.TaxonomyEvolved,
      payload: { ...summary },
    });
    return summary;
  }

  /**
   * Recompute `taxonomy_usage` for every topic/pattern the user has touched via
   * problem attempts, applying recency decay. Returns the number of usage rows
   * written. Public so callers can re-rank without a full mine.
   */
  async rerankFromAttempts(userId: string): Promise<number> {
    const [attempts, problems] = await Promise.all([
      this.repos.attempts.findByUser(userId),
      this.repos.problems.listVisible(userId),
    ]);

    const problemById = new Map(problems.map((p) => [p.id, p]));

    // entityType|entityId -> { count, lastUsed }
    const acc = new Map<string, { count: number; lastUsed: number }>();
    const bump = (
      entityType: EntityType,
      entityId: string | null,
      whenMs: number,
    ) => {
      if (!entityId) return;
      const key = `${entityType}|${entityId}`;
      const cur = acc.get(key) ?? { count: 0, lastUsed: 0 };
      cur.count += 1;
      cur.lastUsed = Math.max(cur.lastUsed, whenMs);
      acc.set(key, cur);
    };

    for (const a of attempts) {
      const problem = problemById.get(a.problem_id);
      if (!problem) continue;
      const whenMs = new Date(a.attempted_at ?? a.created_at).getTime();
      bump("topic", problem.topic_id, whenMs);
      bump("pattern", problem.pattern_id, whenMs);
    }

    let written = 0;
    for (const [key, { count, lastUsed }] of acc) {
      const [entityType, entityId] = key.split("|") as [EntityType, string];
      const lastIso = new Date(lastUsed).toISOString();
      await this.repos.taxonomyUsage.upsert({
        user_id: userId,
        entity_type: entityType,
        entity_id: entityId,
        usage_count: count,
        last_used_at: lastIso,
        relevance_score: this.decayedScore(count, lastUsed),
      });
      written += 1;
    }
    return written;
  }

  // ---------------------------------------------------------------------------
  // Candidate mining from the user's own concept notes
  // ---------------------------------------------------------------------------

  /**
   * Topics emerge from the free-text `category` the user types on concept notes.
   * A category that recurs but maps to no existing topic is a real topic in
   * their head that the seed never had — promote or propose it by frequency.
   */
  private async mineTopicCandidates(
    userId: string,
  ): Promise<{ proposed: number; autoAdded: number }> {
    const concepts = await this.repos.concepts.findByUser(userId);

    const groups = new Map<string, { label: string; count: number }>();
    for (const c of concepts) {
      const label = (c.category ?? "").trim();
      if (!label) continue;
      const slug = this.slugify(label);
      if (!slug) continue;
      const g = groups.get(slug) ?? { label, count: 0 };
      g.count += 1;
      groups.set(slug, g);
    }

    let proposed = 0;
    let autoAdded = 0;
    for (const [slug, { label, count }] of groups) {
      if (count < TaxonomyService.PROPOSE_MIN) continue;
      if (await this.topicExists(userId, slug)) continue;

      const auto = count >= TaxonomyService.AUTO_ADD_MIN;
      const insert: TablesInsert<"topics"> = {
        user_id: userId,
        name: label,
        slug,
        description: `Auto-derived from ${count} of your concept notes tagged "${label}".`,
        source: auto ? "ai_auto" : "ai_proposed",
        status: auto ? "active" : "proposed",
        ai_confidence: this.confidenceFromCount(count),
        ai_rationale: `${count} concept note(s) categorised as "${label}".`,
      };
      const row = await this.repos.topics.create(insert);
      if (auto) {
        autoAdded += 1;
        await this.announceAutoAdd(userId, "topic", row.id, label);
      } else {
        proposed += 1;
        await this.announceProposal(userId, "topic", row.id, label);
      }
    }
    return { proposed, autoAdded };
  }

  /**
   * Patterns emerge from concept notes the user has written up richly
   * (recognition clues present) but not yet linked to a known pattern. A note
   * the user already *understands/masters* is high-confidence — auto-add it;
   * one still being learned is proposed for review. The note's own clues and
   * mistakes seed the pattern card.
   */
  private async minePatternCandidates(
    userId: string,
  ): Promise<{ proposed: number; autoAdded: number }> {
    const concepts = await this.repos.concepts.findByUser(userId);

    let proposed = 0;
    let autoAdded = 0;
    for (const c of concepts) {
      if (c.pattern_id) continue; // already maps to a known pattern
      if (c.recognition_clues.length === 0) continue; // not pattern-shaped yet

      const slug = this.slugify(c.title);
      if (!slug) continue;
      if (await this.patternExists(userId, slug)) continue;

      const auto = c.status === "understood" || c.status === "mastered";
      const insert: TablesInsert<"patterns"> = {
        user_id: userId,
        name: c.title,
        slug,
        recognition_clues: c.recognition_clues,
        common_mistakes: c.common_mistakes,
        generic_algorithm: c.when_to_use,
        description:
          c.personal_explanation ??
          `Derived from your concept note "${c.title}".`,
        source: auto ? "ai_auto" : "ai_proposed",
        status: auto ? "active" : "proposed",
        ai_confidence: c.confidence ?? (auto ? 4 : 2),
        ai_rationale: `Concept note "${c.title}" (${c.status}) carries recognition clues but no linked pattern.`,
      };
      const row = await this.repos.patterns.create(insert);
      if (auto) {
        autoAdded += 1;
        await this.announceAutoAdd(userId, "pattern", row.id, c.title);
      } else {
        proposed += 1;
        await this.announceProposal(userId, "pattern", row.id, c.title);
      }
    }
    return { proposed, autoAdded };
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private async topicExists(userId: string, slug: string): Promise<boolean> {
    const visible = await this.repos.topics.findVisibleBySlug(userId, slug);
    if (visible) return true;
    // also blocked if the user previously dismissed it
    return (await this.repos.topics.findOwnBySlug(userId, slug)) !== null;
  }

  private async patternExists(userId: string, slug: string): Promise<boolean> {
    const visible = await this.repos.patterns.findVisibleBySlug(userId, slug);
    if (visible) return true;
    return (await this.repos.patterns.findOwnBySlug(userId, slug)) !== null;
  }

  /** Surface a silent auto-add as a non-intrusive insight + event. */
  private async announceAutoAdd(
    userId: string,
    entityType: EntityType,
    entityId: string,
    label: string,
  ): Promise<void> {
    await this.events.emit(userId, {
      eventType: EVENT_TYPES.TaxonomyAutoAdded,
      entityType,
      entityId,
      payload: { label },
    });
    try {
      await this.repos.aiInsights.create({
        user_id: userId,
        type: "recommendation",
        title: `New ${entityType} tracked: ${label}`,
        detail: `You keep working with "${label}", so it was added to your ${entityType} library automatically. You can rename or remove it any time.`,
        severity: 1,
        entity_type: entityType,
        entity_id: entityId,
      });
    } catch {
      // insight surfacing is best-effort; never block taxonomy growth
    }
  }

  private async announceProposal(
    userId: string,
    entityType: EntityType,
    entityId: string,
    label: string,
  ): Promise<void> {
    await this.events.emit(userId, {
      eventType: EVENT_TYPES.TaxonomyProposed,
      entityType,
      entityId,
      payload: { label },
    });
  }

  private indexUsage(
    rows: Tables<"taxonomy_usage">[],
  ): Map<string, Tables<"taxonomy_usage">> {
    return new Map(rows.map((r) => [r.entity_id, r]));
  }

  /** count blended with exponential recency decay (half-life in days). */
  private decayedScore(count: number, lastUsedMs: number): number {
    if (count <= 0 || !lastUsedMs) return 0;
    const ageDays = (Date.now() - lastUsedMs) / 86_400_000;
    const recency = Math.pow(2, -ageDays / TaxonomyService.HALF_LIFE_DAYS);
    return count * recency;
  }

  /** Map an occurrence count onto the 1..5 confidence scale. */
  private confidenceFromCount(count: number): number {
    return Math.max(1, Math.min(5, count));
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
}
