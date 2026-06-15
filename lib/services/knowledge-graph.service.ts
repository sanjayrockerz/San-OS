import type { Repositories } from "@/lib/repositories";
import type { Tables } from "@/types/database";

import { BaseService } from "./base.service";

type Problem = Tables<"problems">;
type Concept = Tables<"concept_notes">;
type Pattern = Tables<"patterns">;
type Topic = Tables<"topics">;

/** Everything related to one problem, ready for the detail page's "Related" rail. */
export interface RelatedKnowledge {
  problems: Problem[];
  concepts: Concept[];
  patterns: Pattern[];
  topics: Topic[];
}

/**
 * KnowledgeGraphService — the backend relationship model that ties problems,
 * concepts, patterns and topics together. It is the foundation a graph
 * visualisation will later render; for now it answers "what is related to X?"
 * so the problem detail page can surface neighbours automatically.
 *
 * Edges, all derived from existing columns / link tables (no new schema):
 *   problem --topic_id--> topic        problem --pattern_id--> pattern
 *   concept_problems: concept <-> problem (many-to-many)
 *   concept --topic_id/pattern_id--> topic/pattern
 * Two problems are "related" when they share a topic, a pattern, or a concept.
 */
export class KnowledgeGraphService extends BaseService {
  constructor(repos: Repositories) {
    super(repos);
  }

  /** Problems sharing this problem's topic, pattern, or a linked concept. */
  async getRelatedProblems(
    userId: string,
    problemId: string,
    limit = 8,
  ): Promise<Problem[]> {
    const problem = await this.repos.problems.findById(problemId);
    if (!problem) return [];

    const all = await this.repos.problems.listVisible(userId);
    const byId = new Map(all.map((p) => [p.id, p]));

    const related = new Map<string, Problem>();
    for (const p of all) {
      if (p.id === problemId) continue;
      const shareTopic = problem.topic_id && p.topic_id === problem.topic_id;
      const sharePattern =
        problem.pattern_id && p.pattern_id === problem.pattern_id;
      if (shareTopic || sharePattern) related.set(p.id, p);
    }

    // Problems linked through any concept this problem is attached to.
    const conceptLinks = await this.repos.conceptProblems.findByProblem(problemId);
    for (const link of conceptLinks) {
      const siblings = await this.repos.conceptProblems.findByConcept(
        link.concept_id,
      );
      for (const s of siblings) {
        if (s.problem_id === problemId) continue;
        const p = byId.get(s.problem_id);
        if (p) related.set(p.id, p);
      }
    }

    return Array.from(related.values()).slice(0, limit);
  }

  /** Concept notes linked to this problem. */
  async getRelatedConcepts(
    userId: string,
    problemId: string,
    limit = 8,
  ): Promise<Concept[]> {
    const links = await this.repos.conceptProblems.findByProblem(problemId);
    const concepts: Concept[] = [];
    for (const link of links.slice(0, limit)) {
      const c = await this.repos.concepts.findById(link.concept_id);
      if (c) concepts.push(c);
    }
    return concepts;
  }

  /** The problem's own pattern plus patterns carried by its linked concepts. */
  async getRelatedPatterns(
    userId: string,
    problemId: string,
  ): Promise<Pattern[]> {
    const ids = new Set<string>();
    const problem = await this.repos.problems.findById(problemId);
    if (problem?.pattern_id) ids.add(problem.pattern_id);

    const concepts = await this.getRelatedConcepts(userId, problemId);
    for (const c of concepts) if (c.pattern_id) ids.add(c.pattern_id);

    const patterns: Pattern[] = [];
    for (const id of ids) {
      const p = await this.repos.patterns.findById(id);
      if (p) patterns.push(p);
    }
    return patterns;
  }

  /**
   * One-shot neighbourhood for a problem: related problems, concepts, patterns
   * and topics. The detail page renders whatever is non-empty.
   */
  async getRelatedKnowledge(
    userId: string,
    problemId: string,
  ): Promise<RelatedKnowledge> {
    const [problems, concepts, patterns] = await Promise.all([
      this.getRelatedProblems(userId, problemId),
      this.getRelatedConcepts(userId, problemId),
      this.getRelatedPatterns(userId, problemId),
    ]);

    // Topics = this problem's topic + topics carried by related concepts.
    const topicIds = new Set<string>();
    const problem = await this.repos.problems.findById(problemId);
    if (problem?.topic_id) topicIds.add(problem.topic_id);
    for (const c of concepts) if (c.topic_id) topicIds.add(c.topic_id);

    const topics: Topic[] = [];
    for (const id of topicIds) {
      const t = await this.repos.topics.findById(id);
      if (t) topics.push(t);
    }

    return { problems, concepts, patterns, topics };
  }
}
