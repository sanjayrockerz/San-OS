import type { Repositories } from "@/lib/repositories";
import type { Tables } from "@/types/database";

import { ActivityService } from "./activity.service";
import { BaseService } from "./base.service";
import { EVENT_TYPES, EventService } from "./event.service";
import { RevisionService } from "./revision.service";

type Item = Tables<"roadmap_items">;
type ItemStatus = Tables<"roadmap_progress">["status"];

/** A roadmap item with its children and the user's progress resolved. */
export interface RoadmapNode extends Item {
  status: ItemStatus;
  children: RoadmapNode[];
  /** True when `depends_on_item_id` is set and that item isn't completed yet. */
  locked: boolean;
  dependsOnTitle: string | null;
  /** Total/completed leaf (non-section) descendants, computed recursively — not just direct children. */
  leafTotal: number;
  leafCompleted: number;
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
  private readonly events: EventService;
  private readonly revision: RevisionService;

  constructor(repos: Repositories) {
    super(repos);
    this.activity = new ActivityService(repos);
    this.events = new EventService(repos);
    this.revision = new RevisionService(repos);
  }

  list(userId: string): Promise<Tables<"roadmaps">[]> {
    return this.repos.roadmaps.listVisible(userId);
  }

  /** Builds the nested item tree for a roadmap with the user's progress, lock state, and recursive leaf counts applied. */
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
    const itemById = new Map(items.map((i) => [i.id, i]));

    const nodeById = new Map<string, RoadmapNode>();
    for (const item of items) {
      const dependsOn = item.depends_on_item_id ? itemById.get(item.depends_on_item_id) : null;
      const dependsOnStatus = dependsOn ? statusByItem.get(dependsOn.id) ?? "not_started" : null;
      nodeById.set(item.id, {
        ...item,
        status: statusByItem.get(item.id) ?? "not_started",
        children: [],
        locked: dependsOn ? dependsOnStatus !== "completed" : false,
        dependsOnTitle: dependsOn?.title ?? null,
        leafTotal: 0,
        leafCompleted: 0,
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

    // Recursive leaf counts so a section's progress reflects every descendant,
    // not just direct children (multi-level roadmaps were under-counting).
    const computeLeafCounts = (node: RoadmapNode): void => {
      if (!node.is_section) {
        node.leafTotal = 1;
        node.leafCompleted = node.status === "completed" ? 1 : 0;
        return;
      }
      for (const child of node.children) computeLeafCounts(child);
      node.leafTotal = node.children.reduce((sum, c) => sum + c.leafTotal, 0);
      node.leafCompleted = node.children.reduce((sum, c) => sum + c.leafCompleted, 0);
    };
    for (const root of roots) computeLeafCounts(root);

    const total = items.filter((i) => !i.is_section).length;
    const completed = items.filter(
      (i) => !i.is_section && statusByItem.get(i.id) === "completed",
    ).length;

    return { roadmap, nodes: roots, completed, total };
  }

  /** Sets the user's status for a roadmap item (manual edit). Blocked while the item's dependency isn't completed. */
  async markItem(
    userId: string,
    roadmapId: string,
    itemId: string,
    status: ItemStatus,
  ): Promise<Tables<"roadmap_progress">> {
    const item = await this.repos.roadmapItems.findById(itemId);
    if (!item) throw new Error("Roadmap item not found");

    if (status !== "not_started" && item.depends_on_item_id) {
      const dependsOn = await this.repos.roadmapItems.findById(item.depends_on_item_id);
      const dependsOnProgress = await this.repos.roadmapProgress.findByItem(
        userId,
        item.depends_on_item_id,
      );
      if (dependsOnProgress?.status !== "completed") {
        throw new Error(
          `Complete "${dependsOn?.title ?? "the prerequisite"}" first before this item unlocks.`,
        );
      }
    }

    const completedAt = status === "completed" ? new Date().toISOString() : null;
    const row = await this.repos.roadmapProgress.upsert({
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
      await this.events.emit(userId, {
        eventType: EVENT_TYPES.RoadmapProgressed,
        entityType: "roadmap_item",
        entityId: itemId,
        payload: { roadmapId },
      });
      // A roadmap item completed straight from the checklist (rather than via
      // the normal problem-solve flow) still needs to enter spaced repetition.
      if (item.problem_id) {
        await this.revision.scheduleAfterSolve(userId, item.problem_id, false).catch(() => {});
      }
    }
    return row;
  }
}
