import { BaseService } from "./base.service";
import type { Repositories } from "@/lib/repositories";
import type { Tables } from "@/types/database";

export class MemoryGraphService extends BaseService {
  constructor(repos: Repositories) {
    super(repos);
  }

  async addEdge(
    userId: string,
    sourceType: string,
    sourceId: string,
    targetType: string,
    targetId: string,
    relationshipType: string,
    metadata: any = {},
    confidence: number = 1.0,
    evidence: string | null = null,
    createdByPipeline: boolean = false,
  ): Promise<Tables<"memory_edges">> {
    return this.repos.memoryEdges.create({
      user_id: userId,
      source_type: sourceType,
      source_id: sourceId,
      target_type: targetType,
      target_id: targetId,
      relationship_type: relationshipType,
      metadata,
      confidence,
      evidence,
      created_by_pipeline: createdByPipeline,
    });
  }

  async getEdges(
    userId: string,
    entityType: string,
    entityId: string,
  ): Promise<Tables<"memory_edges">[]> {
    return this.repos.memoryEdges.findEdges(userId, entityType, entityId);
  }

  async getOrCreateNode(
    userId: string,
    nodeType: string,
    name: string,
  ): Promise<Tables<"memory_nodes">> {
    const existing = await this.repos.memoryNodes.findByNameAndType(userId, nodeType, name);
    if (existing) return existing;
    
    return this.repos.memoryNodes.create({
      user_id: userId,
      node_type: nodeType,
      name,
      metadata: {},
    });
  }

  async traverseGraph(
    userId: string,
    startType: string,
    startId: string,
    maxDepth: number = 2
  ): Promise<{ nodes: any[]; edges: Tables<"memory_edges">[] }> {
    const edges: Tables<"memory_edges">[] = [];
    const visited = new Set<string>();
    const queue = [{ type: startType, id: startId, depth: 0 }];
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      const key = `${current.type}:${current.id}`;
      
      if (visited.has(key) || current.depth >= maxDepth) {
        continue;
      }
      visited.add(key);

      const adjacent = await this.getEdges(userId, current.type, current.id);
      for (const edge of adjacent) {
        edges.push(edge);
        const nextType = edge.source_id === current.id ? edge.target_type : edge.source_type;
        const nextId = edge.source_id === current.id ? edge.target_id : edge.source_id;
        queue.push({ type: nextType, id: nextId, depth: current.depth + 1 });
      }
    }

    return {
      nodes: Array.from(visited).map(v => {
        const [type, id] = v.split(":");
        return { type, id };
      }),
      edges,
    };
  }
}
