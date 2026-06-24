import type { Repositories } from "@/lib/repositories";
import type { Tables } from "@/types/database";

import { BaseService } from "./base.service";

type EntityType = "topic" | "pattern";
type MemoryHealthStatus = Tables<"topic_memory_health">["status"];

/** Mirrors DashboardAggregationService's SOLVED_STATUSES — the one definition of "solved" used across the app. */
const SOLVED_STATUSES = new Set(["solved", "solved_with_help", "partial"]);

/** Per-topic/pattern knowledge health: real relationship counts -> a coverage %. */
export interface EntityKnowledgeHealth {
  entityType: EntityType;
  entityId: string;
  name: string;
  problemsSolved: number;
  conceptNotes: number;
  resourcesAttached: number;
  retentionScore: number | null;
  retentionStatus: MemoryHealthStatus | "untracked";
  coveragePercent: number;
}

/** Per-concept retention, derived from its linked problems' Recall Strength — never persisted, see MemoryIntelligenceService.rollupEntity for the rollup this mirrors. */
export interface ConceptRetention {
  conceptId: string;
  score: number | null;
  problemsTracked: number;
}

export interface KnowledgeHealthSnapshot {
  entities: EntityKnowledgeHealth[];
  conceptRetention: ConceptRetention[];
  strong: EntityKnowledgeHealth[];
  weak: EntityKnowledgeHealth[];
  overallCoveragePercent: number;
}

/** A concept note "covers" a topic/pattern once it has this many notes. */
const CONCEPT_NOTES_FOR_FULL_COVERAGE = 3;
/** A topic/pattern is considered resourced once it has this many attached resources. */
const RESOURCES_FOR_FULL_COVERAGE = 2;

/**
 * KnowledgeHealthService — measures learning *completeness*, not activity.
 * Pure compute over existing tables (problems, concept_notes,
 * concept_resources, knowledge_links, topic_memory_health), following the
 * same no-persistence posture as KnowledgeGraphService. Coverage blends four
 * signals: did you do the reps (problems), did you write it down (concepts),
 * did you attach supporting material (resources), and did it stick
 * (retention, from MemoryIntelligenceService's existing rollup) — weighted
 * 0.30 / 0.30 / 0.15 / 0.25. Problems and concepts are weighted equally
 * because "did the reps" and "wrote it down" are independently necessary;
 * retention sits close behind because coverage that decays afterward isn't
 * real coverage; resources are lightest because a resource is a means, not
 * evidence of understanding.
 */
export class KnowledgeHealthService extends BaseService {
  constructor(repos: Repositories) {
    super(repos);
  }

  async snapshot(userId: string): Promise<KnowledgeHealthSnapshot> {
    const [
      topics,
      patterns,
      problems,
      attempts,
      concepts,
      conceptResources,
      knowledgeLinks,
      topicHealth,
      recallScores,
    ] = await Promise.all([
      this.repos.topics.listVisible(userId),
      this.repos.patterns.listVisible(userId),
      this.repos.problems.listVisible(userId),
      this.repos.attempts.findByUser(userId),
      this.repos.concepts.findByUser(userId),
      this.repos.conceptResources.findByUser(userId),
      this.repos.knowledgeLinks.findByUser(userId),
      this.repos.topicMemoryHealth.listForUser(userId),
      this.repos.recallStrength.listForUser(userId),
    ]);

    const solvedProblemIds = new Set(
      attempts
        .filter((a) => a.solve_status && SOLVED_STATUSES.has(a.solve_status))
        .map((a) => a.problem_id),
    );

    const conceptResourceCountByConcept = new Map<string, number>();
    for (const r of conceptResources) {
      conceptResourceCountByConcept.set(
        r.concept_id,
        (conceptResourceCountByConcept.get(r.concept_id) ?? 0) + 1,
      );
    }

    const linkResourceCount = (entityType: EntityType, entityId: string): number =>
      knowledgeLinks.filter((l) => l.entity_type === entityType && l.entity_id === entityId)
        .length;

    const healthByEntity = new Map(
      topicHealth.map((h) => [`${h.entity_type}:${h.entity_id}`, h]),
    );

    const entities: EntityKnowledgeHealth[] = [];
    for (const [entityType, rows] of [
      ["topic", topics] as const,
      ["pattern", patterns] as const,
    ]) {
      for (const row of rows) {
        const problemsSolved = problems.filter(
          (p) =>
            (entityType === "topic" ? p.topic_id === row.id : p.pattern_id === row.id) &&
            solvedProblemIds.has(p.id),
        ).length;

        const matchedConcepts = concepts.filter((c) =>
          entityType === "topic" ? c.topic_id === row.id : c.pattern_id === row.id,
        );
        const conceptResourcesForEntity = matchedConcepts.reduce(
          (sum, c) => sum + (conceptResourceCountByConcept.get(c.id) ?? 0),
          0,
        );
        const resourcesAttached = conceptResourcesForEntity + linkResourceCount(entityType, row.id);

        const health = healthByEntity.get(`${entityType}:${row.id}`);

        entities.push({
          entityType,
          entityId: row.id,
          name: row.name,
          problemsSolved,
          conceptNotes: matchedConcepts.length,
          resourcesAttached,
          retentionScore: health?.health_score ?? null,
          retentionStatus: health?.status ?? "untracked",
          coveragePercent: coveragePercentFor({
            problemsSolved,
            conceptNotes: matchedConcepts.length,
            resourcesAttached,
            retentionScore: health?.health_score ?? null,
          }),
        });
      }
    }

    const conceptProblems = await this.repos.conceptProblems.findByUser(userId);
    const recallByProblem = new Map(recallScores.map((s) => [s.problem_id, s]));
    const conceptRetention: ConceptRetention[] = concepts.map((c) =>
      conceptRetentionFor(c.id, conceptProblems, recallByProblem),
    );

    const strong = entities.filter(
      (e) => e.coveragePercent >= 70 && (e.retentionStatus === "strong" || e.retentionStatus === "stable"),
    );
    const weak = entities.filter(
      (e) =>
        e.coveragePercent < 40 ||
        e.retentionStatus === "at_risk" ||
        e.retentionStatus === "decaying" ||
        e.retentionStatus === "neglected",
    );
    const overallCoveragePercent = entities.length
      ? Math.round(entities.reduce((sum, e) => sum + e.coveragePercent, 0) / entities.length)
      : 0;

    return { entities, conceptRetention, strong, weak, overallCoveragePercent };
  }
}

function coveragePercentFor(input: {
  problemsSolved: number;
  conceptNotes: number;
  resourcesAttached: number;
  retentionScore: number | null;
}): number {
  const problemsComponent = clamp((input.problemsSolved / 5) * 100); // 5+ solved = "covered" for this topic
  const conceptsComponent = clamp(
    (Math.min(input.conceptNotes, CONCEPT_NOTES_FOR_FULL_COVERAGE) / CONCEPT_NOTES_FOR_FULL_COVERAGE) * 100,
  );
  const resourcesComponent = clamp(
    (Math.min(input.resourcesAttached, RESOURCES_FOR_FULL_COVERAGE) / RESOURCES_FOR_FULL_COVERAGE) * 100,
  );
  const retentionComponent = input.retentionScore ?? 0;

  return Math.round(
    0.3 * problemsComponent + 0.3 * conceptsComponent + 0.15 * resourcesComponent + 0.25 * retentionComponent,
  );
}

/** Per-concept retention: plain mean of its linked problems' Recall Strength scores. Zero linked problems is "not yet practiced", not a zero score. */
function conceptRetentionFor(
  conceptId: string,
  conceptProblemLinks: Tables<"concept_problems">[],
  recallByProblem: Map<string, Tables<"recall_strength">>,
): ConceptRetention {
  const scores = conceptProblemLinks
    .filter((l) => l.concept_id === conceptId)
    .map((l) => recallByProblem.get(l.problem_id)?.score)
    .filter((s): s is number => s !== undefined);

  if (scores.length === 0) return { conceptId, score: null, problemsTracked: 0 };
  return {
    conceptId,
    score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    problemsTracked: scores.length,
  };
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, n));
}
