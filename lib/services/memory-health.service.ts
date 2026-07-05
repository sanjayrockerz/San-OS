import { BaseService } from "./base.service";
import type { Repositories } from "@/lib/repositories";

export interface MemoryHealthDiagnostics {
  totalResources: number;
  linkedResourcesCount: number;
  linkedPercentage: number;
  unlinkedPercentage: number;
  totalMemoryNodes: number;
  orphanNodesCount: number;
  totalEdges: number;
  memoryQualityScore: number;
}

export class MemoryHealthService extends BaseService {
  constructor(repos: Repositories) {
    super(repos);
  }

  async getDiagnostics(userId: string): Promise<MemoryHealthDiagnostics> {
    // Run all four count queries in parallel instead of sequentially.
    const [
      { count: totalResources },
      { count: linkedResources },
      { count: totalMemoryNodes },
      { count: totalEdges },
    ] = await Promise.all([
      this.repos.rawClient
        .from("resources")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId),
      this.repos.rawClient
        .from("memory_edges")
        .select("source_id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("source_type", "resource"),
      this.repos.rawClient
        .from("memory_nodes")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId),
      this.repos.rawClient
        .from("memory_edges")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId),
    ]);

    const tr = totalResources ?? 0;
    const lr = Math.min(linkedResources ?? 0, tr);
    const tn = totalMemoryNodes ?? 0;
    const te = totalEdges ?? 0;

    const linkedPercentage = tr > 0 ? (lr / tr) * 100 : 0;
    const unlinkedPercentage = 100 - linkedPercentage;
    const orphanNodesCount = Math.max(0, tn - te);

    const resourceScore = linkedPercentage;
    const nodeScore = tn > 0 ? ((tn - orphanNodesCount) / tn) * 100 : 100;
    const memoryQualityScore = Math.round((resourceScore + nodeScore) / 2);

    return {
      totalResources: tr,
      linkedResourcesCount: lr,
      linkedPercentage: Math.round(linkedPercentage),
      unlinkedPercentage: Math.round(unlinkedPercentage),
      totalMemoryNodes: tn,
      orphanNodesCount,
      totalEdges: te,
      memoryQualityScore,
    };
  }
}
