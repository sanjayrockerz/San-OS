import type { Repositories } from "@/lib/repositories";
import type { Tables } from "@/types/database";

import { BaseService } from "./base.service";
import { RoadmapService, type RoadmapNode } from "./roadmaps.service";
import { scoreAction } from "./student-action-scoring";
import type { RiskEntry, RiskLevel, StudentAction } from "./student-intelligence-core.service";

export interface RoadmapAction extends StudentAction {
  source: "roadmap";
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

/** DFS for the first incomplete, unlocked leaf — the literal next thing to do. */
function findNextActionable(nodes: RoadmapNode[]): RoadmapNode | null {
  for (const node of nodes) {
    if (!node.is_section) {
      if (node.status !== "completed" && !node.locked) return node;
      continue;
    }
    const found = findNextActionable(node.children);
    if (found) return found;
  }
  return null;
}

/**
 * RoadmapCoachService — maps in-progress roadmaps onto StudentAction/RiskEntry
 * so "resume my roadmap" and "this roadmap has stalled" plug into
 * StudentIntelligenceCoreService's existing ranked list and risk register,
 * the same way AcademicCoachService and KnowledgeCoachService do for their
 * domains. Only roadmaps the student has actually started are considered —
 * an untouched template isn't a signal worth surfacing.
 */
export class RoadmapCoachService extends BaseService {
  private readonly roadmapService: RoadmapService;

  constructor(repos: Repositories) {
    super(repos);
    this.roadmapService = new RoadmapService(repos);
  }

  async actions(userId: string): Promise<RoadmapAction[]> {
    const started = await this.startedRoadmaps(userId);
    const actions: RoadmapAction[] = [];

    for (const { roadmap, tree, daysSinceTouched } of started) {
      if (tree.total === 0 || tree.completed >= tree.total) continue;
      const next = findNextActionable(tree.nodes);
      if (!next) continue;

      const urgency = clamp01(daysSinceTouched / 14);
      const impact = 0.5;
      const momentum = clamp01(1 - daysSinceTouched / 30);

      actions.push({
        id: `resume_roadmap-${roadmap.id}`,
        kind: "resume_roadmap",
        source: "roadmap",
        title: `Continue ${roadmap.title}`,
        detail: `${tree.completed}/${tree.total} complete — next up: ${next.title}`,
        href: `/roadmaps/${roadmap.id}`,
        entityId: roadmap.id,
        estimatedMinutes: 25,
        urgency,
        impact,
        momentum,
        score: scoreAction({ urgency, impact, momentum }),
        lastTouchedAt: null,
      });
    }

    return actions.sort((a, b) => b.score - a.score).slice(0, 3);
  }

  async risks(userId: string): Promise<RiskEntry[]> {
    const started = await this.startedRoadmaps(userId);
    const entries: RiskEntry[] = [];

    for (const { roadmap, tree, daysSinceTouched } of started) {
      if (tree.completed === 0 || tree.completed >= tree.total) continue;
      if (daysSinceTouched < 14) continue;

      const riskLevel: RiskLevel = daysSinceTouched >= 30 ? "high" : "medium";
      entries.push({
        entityType: "roadmap",
        entityId: roadmap.id,
        name: roadmap.title,
        riskLevel,
        reason: `No progress in ${Math.round(daysSinceTouched)} days — ${tree.completed}/${tree.total} complete.`,
        recommendedAction: {
          label: `Resume ${roadmap.title}`,
          href: `/roadmaps/${roadmap.id}`,
          entityId: roadmap.id,
        },
      });
    }

    return entries;
  }

  private async startedRoadmaps(userId: string) {
    const roadmaps = await this.repos.roadmaps.listVisible(userId);
    const results: {
      roadmap: Tables<"roadmaps">;
      tree: NonNullable<Awaited<ReturnType<RoadmapService["tree"]>>>;
      daysSinceTouched: number;
    }[] = [];

    for (const roadmap of roadmaps) {
      const progress = await this.repos.roadmapProgress.findByRoadmap(userId, roadmap.id);
      if (progress.length === 0) continue;

      const tree = await this.roadmapService.tree(userId, roadmap.id);
      if (!tree) continue;

      const lastTouchedMs = Math.max(...progress.map((p) => new Date(p.updated_at).getTime()));
      const daysSinceTouched = (Date.now() - lastTouchedMs) / 86_400_000;

      results.push({ roadmap, tree, daysSinceTouched });
    }

    return results;
  }
}
