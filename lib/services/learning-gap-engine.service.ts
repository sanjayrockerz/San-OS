import type { Repositories } from "@/lib/repositories";

import { BaseService } from "./base.service";
import { KnowledgeHealthService } from "./knowledge-health.service";

export type GapKind =
  | "no_concept_notes"
  | "no_resources"
  | "no_pattern_link"
  | "unretained_coverage"
  | "stale_concept";

export type GapSeverity = "low" | "medium" | "high";

export interface KnowledgeGap {
  id: string;
  kind: GapKind;
  entityType: "topic" | "pattern" | "concept";
  entityId: string;
  name: string;
  severity: GapSeverity;
  reason: string;
  recommendedAction: { label: string; href: string };
}

/** Writing a concept note is a bigger ask than approving an auto-mined taxonomy label, so the bar sits above TaxonomyService.PROPOSE_MIN (2). */
const NO_NOTES_MIN_PROBLEMS = 3;
const NO_NOTES_HIGH_SEVERITY_MIN_PROBLEMS = 8;
const NO_RESOURCES_MIN_AGE_DAYS = 7;
const STALE_CONCEPT_DAYS = 60;
const UNRETAINED_COVERAGE_MIN = 60;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * LearningGapEngine — a rule pass over KnowledgeHealthService's computed
 * scores, mirroring the MemoryIntelligenceService (scores) / MemoryCoachService
 * (turns scores into interventions) split. Every gap carries a concrete,
 * clickable recommendedAction — a missing note is housekeeping, not a crisis,
 * so gaps never reach "critical" severity.
 */
export class LearningGapEngine extends BaseService {
  private readonly health: KnowledgeHealthService;

  constructor(repos: Repositories) {
    super(repos);
    this.health = new KnowledgeHealthService(repos);
  }

  async gaps(userId: string): Promise<KnowledgeGap[]> {
    const [snapshot, concepts] = await Promise.all([
      this.health.snapshot(userId),
      this.repos.concepts.findByUser(userId),
    ]);

    const gaps: KnowledgeGap[] = [];
    const now = Date.now();

    for (const entity of snapshot.entities) {
      if (entity.problemsSolved >= NO_NOTES_MIN_PROBLEMS && entity.conceptNotes === 0) {
        gaps.push({
          id: `no_concept_notes-${entity.entityType}-${entity.entityId}`,
          kind: "no_concept_notes",
          entityType: entity.entityType,
          entityId: entity.entityId,
          name: entity.name,
          severity: entity.problemsSolved >= NO_NOTES_HIGH_SEVERITY_MIN_PROBLEMS ? "high" : "medium",
          reason: `${entity.problemsSolved} problems solved in ${entity.name}, but no concept notes written.`,
          recommendedAction: {
            label: `Write a ${entity.name} concept note`,
            href: `/concepts/new?${entity.entityType}Id=${entity.entityId}`,
          },
        });
      }

      if (
        entity.coveragePercent >= UNRETAINED_COVERAGE_MIN &&
        (entity.retentionStatus === "at_risk" ||
          entity.retentionStatus === "decaying" ||
          entity.retentionStatus === "neglected")
      ) {
        gaps.push({
          id: `unretained_coverage-${entity.entityType}-${entity.entityId}`,
          kind: "unretained_coverage",
          entityType: entity.entityType,
          entityId: entity.entityId,
          name: entity.name,
          severity: "high",
          reason: `${entity.name} looks covered (${entity.coveragePercent}%) but retention is ${entity.retentionStatus.replace("_", " ")} — you may not actually know this anymore.`,
          recommendedAction: {
            label: `Revisit ${entity.name}`,
            href: "/revision",
          },
        });
      }
    }

    for (const concept of concepts) {
      const conceptAgeDays = (now - new Date(concept.created_at).getTime()) / DAY_MS;
      const resourceCount =
        snapshot.entities.find(
          (e) =>
            (e.entityType === "topic" && e.entityId === concept.topic_id) ||
            (e.entityType === "pattern" && e.entityId === concept.pattern_id),
        )?.resourcesAttached ?? 0;

      if (resourceCount === 0 && conceptAgeDays >= NO_RESOURCES_MIN_AGE_DAYS) {
        gaps.push({
          id: `no_resources-concept-${concept.id}`,
          kind: "no_resources",
          entityType: "concept",
          entityId: concept.id,
          name: concept.title,
          severity: "low",
          reason: `"${concept.title}" has no attached resources.`,
          recommendedAction: {
            label: `Attach a resource to "${concept.title}"`,
            href: `/concepts/${concept.id}?tab=resources`,
          },
        });
      }

      if (
        (concept.status === "understood" || concept.status === "mastered") &&
        !concept.pattern_id
      ) {
        gaps.push({
          id: `no_pattern_link-concept-${concept.id}`,
          kind: "no_pattern_link",
          entityType: "concept",
          entityId: concept.id,
          name: concept.title,
          severity: "low",
          reason: `"${concept.title}" is marked ${concept.status} but isn't linked to a pattern.`,
          recommendedAction: {
            label: `Link "${concept.title}" to a pattern`,
            href: `/concepts/${concept.id}?tab=pattern`,
          },
        });
      }

      if (conceptAgeDays >= STALE_CONCEPT_DAYS) {
        const updatedAgeDays = (now - new Date(concept.updated_at).getTime()) / DAY_MS;
        if (updatedAgeDays >= STALE_CONCEPT_DAYS) {
          gaps.push({
            id: `stale_concept-concept-${concept.id}`,
            kind: "stale_concept",
            entityType: "concept",
            entityId: concept.id,
            name: concept.title,
            severity: "low",
            reason: `"${concept.title}" hasn't been updated in ${Math.round(updatedAgeDays)} days.`,
            recommendedAction: {
              label: `Revisit "${concept.title}"`,
              href: `/concepts/${concept.id}`,
            },
          });
        }
      }
    }

    return gaps.sort((a, b) => SEVERITY_WEIGHT[b.severity] - SEVERITY_WEIGHT[a.severity]);
  }
}

const SEVERITY_WEIGHT: Record<GapSeverity, number> = { low: 1, medium: 2, high: 3 };
