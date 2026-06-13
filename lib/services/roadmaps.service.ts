import type { Repositories } from "@/lib/repositories";
import type { Tables } from "@/types/database";

import { ActivityService } from "./activity.service";
import { BaseService } from "./base.service";

type Item = Tables<"roadmap_items">;
type ItemStatus = Tables<"roadmap_progress">["status"];

/** A roadmap item with its children and the user's progress resolved. */
export interface RoadmapNode extends Item {
  status: ItemStatus;
  children: RoadmapNode[];
}

export interface RoadmapTree {
  roadmap: Tables<"roadmaps">;
  nodes: RoadmapNode[];
  completed: number;
  total: number;
}

/**
 * Roadmap Engine: assembles the item tree with per-user progress and records
 * completion. Solving a problem fans out to roadmaps in ProblemsService; this
 * service handles direct, manual progress edits and tree reads.
 */
export class RoadmapService extends BaseService {
  private readonly activity: ActivityService;

  constructor(repos: Repositories) {
    super(repos);
    this.activity = new ActivityService(repos);
  }

  list(userId: string): Promise<Tables<"roadmaps">[]> {
    return this.repos.roadmaps.listVisible(userId);
  }

  /** Builds the nested item tree for a roadmap with the user's progress applied. */
  async tree(userId: string, roadmapId: string): Promise<RoadmapTree | null> {
    const roadmap = await this.repos.roadmaps.findById(roadmapId);
    if (!roadmap) return null;

    const items = await this.repos.roadmapItems.findByRoadmap(roadmapId);
    const progress = await this.repos.roadmapProgress.findByRoadmap(
      userId,
      roadmapId,
    );
    const statusByItem = new Map<string, ItemStatus>(
      progress.map((p) => [p.item_id, p.status]),
    );

    const nodeById = new Map<string, RoadmapNode>();
    for (const item of items) {
      nodeById.set(item.id, {
        ...item,
        status: statusByItem.get(item.id) ?? "not_started",
        children: [],
      });
    }

    const roots: RoadmapNode[] = [];
    for (const node of nodeById.values()) {
      if (node.parent_item_id && nodeById.has(node.parent_item_id)) {
        nodeById.get(node.parent_item_id)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    const byOrder = (a: RoadmapNode, b: RoadmapNode) =>
      a.order_index - b.order_index;
    roots.sort(byOrder);
    for (const node of nodeById.values()) node.children.sort(byOrder);

    const total = items.filter((i) => !i.is_section).length;
    const completed = items.filter(
      (i) => !i.is_section && statusByItem.get(i.id) === "completed",
    ).length;

    return { roadmap, nodes: roots, completed, total };
  }

  /** Sets the user's status for a roadmap item (manual edit). */
  async markItem(
    userId: string,
    roadmapId: string,
    itemId: string,
    status: ItemStatus,
  ): Promise<Tables<"roadmap_progress">> {
    const existing = await this.repos.roadmapProgress.findByItem(userId, itemId);
    const completedAt = status === "completed" ? new Date().toISOString() : null;

    const row = existing
      ? await this.repos.roadmapProgress.update(existing.id, {
          status,
          completed_at: completedAt,
        })
      : await this.repos.roadmapProgress.create({
          user_id: userId,
          roadmap_id: roadmapId,
          item_id: itemId,
          status,
          completed_at: completedAt,
        });

    if (status === "completed") {
      await this.activity.log(userId, {
        type: "problem_solved",
        title: "Completed a roadmap item",
        entityType: "roadmap_item",
        entityId: itemId,
        metadata: { roadmapId },
      });
    }
    return row;
  }
}
