import type { Repositories } from "@/lib/repositories";
import type { Tables } from "@/types/database";

import { BaseService } from "./base.service";
import { EVENT_TYPES, EventService } from "./event.service";
import {
  MemoryIntelligenceService,
  type NamedTopicHealth,
} from "./memory-intelligence.service";

/** One concrete, ordered action the user can take right now. */
export interface MemoryAction {
  kind: "revise_problem" | "review_concept" | "review_resource" | "solve_new";
  label: string;
  entityId?: string;
}

/** A weak/decaying/neglected topic or pattern, with what to do about it. */
export interface MemoryIntervention {
  entityType: "topic" | "pattern";
  entityId: string;
  name: string;
  status: NamedTopicHealth["status"];
  healthScore: number;
  reason: string;
  actions: MemoryAction[];
}

const SEVERITY_BY_STATUS: Record<NamedTopicHealth["status"], number> = {
  neglected: 4,
  decaying: 4,
  at_risk: 3,
  stable: 1,
  strong: 1,
};

/**
 * MemoryCoachService — the decision engine that turns Topic Memory Health
 * (Model 2) and Recall Strength (Model 3 risk buckets) into concrete next
 * actions. It never just reports a number; every weak/decaying/neglected
 * topic produces a short, ordered list of things to actually do, sourced
 * from the user's own revision queue, concept vault and knowledge links
 * (KnowledgeGraphService's edges) rather than generic advice.
 */
export class MemoryCoachService extends BaseService {
  private readonly memory: MemoryIntelligenceService;
  private readonly events: EventService;

  constructor(repos: Repositories) {
    super(repos);
    this.memory = new MemoryIntelligenceService(repos);
    this.events = new EventService(repos);
  }

  /**
   * One intervention per topic/pattern that is at_risk, decaying or
   * neglected, worst-first. Neglected entities (zero recall activity) are
   * surfaced ahead of decaying ones with the same severity because there is
   * no revision history to revise — the only available action is to start
   * one.
   */
  async interventions(userId: string): Promise<MemoryIntervention[]> {
    const [snapshot, recallScores, problems] = await Promise.all([
      this.memory.healthSnapshot(userId),
      this.repos.recallStrength.listForUser(userId),
      this.repos.problems.listVisible(userId),
    ]);

    const weak = snapshot.all.filter(
      (h) => h.status === "at_risk" || h.status === "decaying" || h.status === "neglected",
    );
    weak.sort((a, b) => a.healthScore - b.healthScore);

    const problemById = new Map(problems.map((p) => [p.id, p]));
    const scoreByProblem = new Map(recallScores.map((s) => [s.problem_id, s]));

    const out: MemoryIntervention[] = [];
    for (const entity of weak) {
      out.push(await this.buildIntervention(userId, entity, problemById, scoreByProblem));
    }
    return out;
  }

  private async buildIntervention(
    userId: string,
    entity: NamedTopicHealth,
    problemById: Map<string, Tables<"problems">>,
    scoreByProblem: Map<string, Tables<"recall_strength">>,
  ): Promise<MemoryIntervention> {
    const actions: MemoryAction[] = [];

    if (entity.status === "neglected") {
      const concept = await this.weakestConcept(userId, entity);
      if (concept) {
        actions.push({
          kind: "review_concept",
          label: `Review your concept note "${concept.title}" before attempting anything new`,
          entityId: concept.id,
        });
      } else {
        actions.push({
          kind: "solve_new",
          label: `Solve one easy/medium problem in ${entity.name} to start building recall history`,
        });
      }
    } else {
      // Weakest problems under this entity, from the cached recall scores.
      const weakest = [...scoreByProblem.values()]
        .filter((s) => {
          const problem = problemById.get(s.problem_id);
          if (!problem) return false;
          return entity.entityType === "topic"
            ? problem.topic_id === entity.entityId
            : problem.pattern_id === entity.entityId;
        })
        .sort((a, b) => a.score - b.score)
        .slice(0, 2);

      for (const s of weakest) {
        const problem = problemById.get(s.problem_id);
        actions.push({
          kind: "revise_problem",
          label: `Revise "${problem?.title ?? "Untitled problem"}" (recall strength ${s.score}%)`,
          entityId: s.problem_id,
        });
      }

      const concept = await this.weakestConcept(userId, entity);
      if (concept) {
        actions.push({
          kind: "review_concept",
          label: `Review your concept note "${concept.title}" before revising`,
          entityId: concept.id,
        });
      }

      if (entity.status === "at_risk") {
        actions.push({
          kind: "solve_new",
          label: `Once revised, attempt one new ${entity.name} problem to confirm the pattern sticks`,
        });
      }
    }

    const resource = await this.linkedResource(userId, entity);
    if (resource) {
      actions.push({
        kind: "review_resource",
        label: `Re-watch/re-read "${resource.title}" from your knowledge vault`,
        entityId: resource.id,
      });
    }

    return {
      entityType: entity.entityType,
      entityId: entity.entityId,
      name: entity.name,
      status: entity.status,
      healthScore: entity.healthScore,
      reason:
        entity.status === "neglected"
          ? `No recall activity recorded for ${entity.name} yet.`
          : `${entity.name} recall health is ${entity.healthScore}% across ${entity.problemsTracked} tracked problem(s), ${entity.problemsAtRisk} of which are at risk.`,
      actions,
    };
  }

  /** The user's weakest (lowest-confidence / forgotten) concept note tied to this entity. */
  private async weakestConcept(
    userId: string,
    entity: NamedTopicHealth,
  ): Promise<Tables<"concept_notes"> | null> {
    const concepts = await this.repos.concepts.findByUser(userId);
    const linked = concepts.filter((c) =>
      entity.entityType === "topic"
        ? c.topic_id === entity.entityId
        : c.pattern_id === entity.entityId,
    );
    if (linked.length === 0) return null;

    const rank = (status: Tables<"concept_notes">["status"]): number =>
      ({ forgotten: 0, weak: 1, learning: 2, understood: 3, mastered: 4 })[status] ?? 2;
    return linked.sort((a, b) => rank(a.status) - rank(b.status))[0];
  }

  /** One knowledge-vault item linked to this topic/pattern, if any. */
  private async linkedResource(
    userId: string,
    entity: NamedTopicHealth,
  ): Promise<Tables<"knowledge_items"> | null> {
    const links = await this.repos.knowledgeLinks.findByEntity(
      userId,
      entity.entityType,
      entity.entityId,
    );
    if (links.length === 0) return null;
    return this.repos.knowledge.findById(links[0].knowledge_id);
  }

  /**
   * Writes memory-aware ai_insights — every insight ends with a concrete
   * recommended action, never a bare number. Caller (AiService) is
   * responsible for clearing prior non-dismissed insights before calling
   * this, same as its other insight sources.
   */
  async writeInsights(userId: string): Promise<number> {
    const interventions = await this.interventions(userId);
    let written = 0;
    for (const intervention of interventions.slice(0, 5)) {
      const firstAction = intervention.actions[0]?.label;
      const detail = firstAction
        ? `${intervention.reason} Recommended: ${firstAction}.`
        : `${intervention.reason} Recommended: schedule a revision session for ${intervention.name}.`;

      await this.repos.aiInsights.create({
        user_id: userId,
        type: intervention.status === "neglected" ? "forgotten_topic" : "weakness",
        title: `${intervention.name} memory ${intervention.status === "neglected" ? "untouched" : "at " + intervention.healthScore + "%"}`,
        detail,
        severity: SEVERITY_BY_STATUS[intervention.status],
        entity_type: intervention.entityType,
        entity_id: intervention.entityId,
      });
      written += 1;
    }

    if (written > 0) {
      await this.events.emit(userId, {
        eventType: EVENT_TYPES.MemoryInterventionGenerated,
        payload: { count: written },
      });
    }
    return written;
  }
}
