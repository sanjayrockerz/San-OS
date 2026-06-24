import type { Repositories } from "@/lib/repositories";

import { BaseService } from "./base.service";
import { type GapKind, type KnowledgeGap, LearningGapEngine } from "./learning-gap-engine.service";
import { scoreAction } from "./student-action-scoring";
import type { StudentAction } from "./student-intelligence-core.service";

export interface KnowledgeAction extends StudentAction {
  source: "knowledge";
  entityType: KnowledgeGap["entityType"];
  severity: KnowledgeGap["severity"];
}

/** Maps a gap to the StudentAction kind that best represents the work — reuses existing kinds where one already fits, since "review a concept" and "open the vault" aren't knowledge-specific ideas. */
const KIND_BY_GAP: Record<GapKind, StudentAction["kind"]> = {
  no_concept_notes: "create_concept_note",
  no_resources: "link_vault_item",
  no_pattern_link: "link_pattern",
  unretained_coverage: "review_concept",
  stale_concept: "review_concept",
};

/** Gap severity -> urgency/impact, on the same 0-1 scale every other signal source in StudentIntelligenceCoreService uses. */
const URGENCY_IMPACT_BY_SEVERITY: Record<KnowledgeGap["severity"], { urgency: number; impact: number }> = {
  high: { urgency: 0.7, impact: 0.7 },
  medium: { urgency: 0.45, impact: 0.55 },
  low: { urgency: 0.25, impact: 0.35 },
};

/**
 * KnowledgeCoachService — the decision engine for the knowledge domain.
 * Maps each LearningGapEngine gap 1:1 to a concrete, scored action using the
 * same urgency/impact/momentum rubric as StudentIntelligenceCoreService (via
 * the shared scoreAction helper), so it plugs straight into the existing
 * ranked action list, risk register, and missions without any remapping.
 */
export class KnowledgeCoachService extends BaseService {
  private readonly gapEngine: LearningGapEngine;

  constructor(repos: Repositories) {
    super(repos);
    this.gapEngine = new LearningGapEngine(repos);
  }

  async actions(userId: string): Promise<KnowledgeAction[]> {
    const gaps = await this.gapEngine.gaps(userId);
    return gaps.map((gap) => this.toAction(gap)).sort((a, b) => b.score - a.score);
  }

  private toAction(gap: KnowledgeGap): KnowledgeAction {
    const kind = KIND_BY_GAP[gap.kind];
    const { urgency, impact } = URGENCY_IMPACT_BY_SEVERITY[gap.severity];
    const momentum = 0.2;
    return {
      id: `${kind}-${gap.id}`,
      kind,
      source: "knowledge",
      entityType: gap.entityType,
      severity: gap.severity,
      title: gap.recommendedAction.label,
      detail: gap.reason,
      href: gap.recommendedAction.href,
      entityId: gap.entityId,
      estimatedMinutes: estimatedMinutesFor(gap.kind),
      urgency,
      impact,
      momentum,
      score: scoreAction({ urgency, impact, momentum }),
      lastTouchedAt: null,
    };
  }
}

function estimatedMinutesFor(kind: GapKind): number {
  switch (kind) {
    case "no_concept_notes":
      return 15;
    case "unretained_coverage":
      return 12;
    case "no_resources":
    case "no_pattern_link":
    case "stale_concept":
    default:
      return 5;
  }
}
