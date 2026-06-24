import type { Repositories } from "@/lib/repositories";
import type { Tables } from "@/types/database";

import { BaseService } from "./base.service";

export type ResourceSignal = "strong" | "neutral" | "unproven" | "weak";

export interface ScoredResource {
  source: "concept_resource" | "knowledge_item";
  id: string;
  title: string;
  linkedEntityType: "concept" | "problem" | "topic" | "pattern";
  linkedEntityId: string;
  effectivenessScore: number;
  signal: ResourceSignal;
  evidence: string;
}

/** Below this many qualifying problems, a resource hasn't accumulated enough evidence to claim strong/weak — same spirit as MemoryIntelligenceService's Laplace smoothing, applied as a sample-size floor instead. */
const MIN_SAMPLE_SIZE = 2;

/**
 * ResourceEffectivenessService — correlates a resource's attachment with the
 * Recall Strength of the problems it's linked to (via concept_resources ->
 * concept_problems, or knowledge_links directly). Pure compute, no schema
 * change. The lowest-priority/most-cuttable piece of the knowledge engine —
 * nothing else structurally depends on it.
 */
export class ResourceEffectivenessService extends BaseService {
  constructor(repos: Repositories) {
    super(repos);
  }

  async topResources(userId: string): Promise<ScoredResource[]> {
    const [conceptResources, conceptProblems, knowledgeLinks, knowledgeItems, recallScores, topicHealth] =
      await Promise.all([
        this.repos.conceptResources.findByUser(userId),
        this.repos.conceptProblems.findByUser(userId),
        this.repos.knowledgeLinks.findByUser(userId),
        this.repos.knowledge.findByUser(userId),
        this.repos.recallStrength.listForUser(userId),
        this.repos.topicMemoryHealth.listForUser(userId),
      ]);

    const recallByProblem = new Map(recallScores.map((s) => [s.problem_id, s]));
    const healthByEntity = new Map(topicHealth.map((h) => [`${h.entity_type}:${h.entity_id}`, h]));
    const knowledgeById = new Map(knowledgeItems.map((k) => [k.id, k]));

    const scored: ScoredResource[] = [];

    for (const resource of conceptResources) {
      const problemIds = conceptProblems
        .filter((cp) => cp.concept_id === resource.concept_id)
        .map((cp) => cp.problem_id);
      scored.push(
        scoreFromProblems({
          source: "concept_resource",
          id: resource.id,
          title: resource.title ?? "Untitled resource",
          linkedEntityType: "concept",
          linkedEntityId: resource.concept_id,
          problemIds,
          recallByProblem,
        }),
      );
    }

    for (const link of knowledgeLinks) {
      const title = knowledgeById.get(link.knowledge_id)?.title ?? "Untitled resource";
      if (link.entity_type === "problem") {
        scored.push(
          scoreFromProblems({
            source: "knowledge_item",
            id: link.id,
            title,
            linkedEntityType: "problem",
            linkedEntityId: link.entity_id,
            problemIds: [link.entity_id],
            recallByProblem,
          }),
        );
      } else if (link.entity_type === "topic" || link.entity_type === "pattern") {
        const health = healthByEntity.get(`${link.entity_type}:${link.entity_id}`);
        scored.push({
          source: "knowledge_item",
          id: link.id,
          title,
          linkedEntityType: link.entity_type,
          linkedEntityId: link.entity_id,
          effectivenessScore: health?.health_score ?? 50,
          signal: health ? signalFromScore(health.health_score) : "unproven",
          evidence: health
            ? `Approximated from current ${link.entity_type} memory health (${health.health_score}%) — no historical snapshot at link time.`
            : "No memory health data yet for the linked topic/pattern.",
        });
      }
    }

    return scored.sort((a, b) => b.effectivenessScore - a.effectivenessScore);
  }
}

function scoreFromProblems(input: {
  source: ScoredResource["source"];
  id: string;
  title: string;
  linkedEntityType: ScoredResource["linkedEntityType"];
  linkedEntityId: string;
  problemIds: string[];
  recallByProblem: Map<string, Tables<"recall_strength">>;
}): ScoredResource {
  const scores = input.problemIds
    .map((id) => input.recallByProblem.get(id)?.score)
    .filter((s): s is number => s !== undefined);

  if (scores.length < MIN_SAMPLE_SIZE) {
    return {
      source: input.source,
      id: input.id,
      title: input.title,
      linkedEntityType: input.linkedEntityType,
      linkedEntityId: input.linkedEntityId,
      effectivenessScore: 50,
      signal: "unproven",
      evidence: `Only ${scores.length} qualifying problem(s) tracked — not enough evidence to score yet.`,
    };
  }

  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  return {
    source: input.source,
    id: input.id,
    title: input.title,
    linkedEntityType: input.linkedEntityType,
    linkedEntityId: input.linkedEntityId,
    effectivenessScore: avg,
    signal: signalFromScore(avg),
    evidence: `Average recall strength of ${scores.length} linked problem(s): ${avg}%.`,
  };
}

function signalFromScore(score: number): ResourceSignal {
  if (score >= 70) return "strong";
  if (score >= 40) return "neutral";
  return "weak";
}
