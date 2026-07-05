import { BaseService } from "./base.service";
import type { Repositories } from "@/lib/repositories";

export interface SearchResult {
  id: string;
  type: "resource" | "problem" | "project" | "client" | "memory" | "concept";
  title: string;
  description?: string;
  url: string;
  metadata?: any;
}

export class UniversalSearchService extends BaseService {
  constructor(repos: Repositories) {
    super(repos);
  }

  async search(userId: string, query: string, limit = 20): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    
    // 1. Natural Language / Heuristic parsing
    const q = query.toLowerCase();
    let targetType: string | null = null;
    if (q.includes("meeting")) targetType = "meeting";
    if (q.includes("invoice") || q.includes("money") || q.includes("paid")) targetType = "finance";
    if (q.includes("resource") || q.includes("pdf")) targetType = "resource";
    
    // In production, this would use Postgres full-text search vectors and pgvector embeddings.
    const searchPattern = `%${query}%`;

    // 1. Resources (Boosted if targetType matches)
    const { data: resources } = await this.repos.rawClient
      .from("resources")
      .select("*")
      .eq("user_id", userId)
      .or(`title.ilike.${searchPattern},description.ilike.${searchPattern}`)
      .limit(limit);

    if (resources) {
      resources.forEach(r => {
        let score = 1;
        if (targetType === "resource") score += 5;
        if (targetType === "meeting" && r.title.toLowerCase().includes("meeting")) score += 5;
        if (targetType === "finance" && r.title.toLowerCase().includes("invoice")) score += 5;

        results.push({
          id: r.id,
          type: "resource",
          title: r.title,
          description: r.description || undefined,
          url: `/resources/${r.id}`,
          metadata: { type: r.resource_type, score }
        });
      });
    }

    // 2. Memory Nodes (Graph entities)
    const { data: nodes } = await this.repos.rawClient
      .from("memory_nodes")
      .select("*")
      .eq("user_id", userId)
      .ilike("name", searchPattern)
      .limit(limit);

    if (nodes) {
      nodes.forEach(n => {
        results.push({
          id: n.id,
          type: "memory",
          title: `${n.node_type}: ${n.name}`,
          url: `/memory/${n.id}`,
          metadata: { type: n.node_type, score: 3 } // nodes inherently have high relevance
        });
      });
    }

    // 3. Problems
    const { data: problems } = await this.repos.rawClient
      .from("problems")
      .select("*")
      .eq("user_id", userId)
      .ilike("title", searchPattern)
      .limit(limit);

    if (problems) {
      problems.forEach(p => results.push({
        id: p.id,
        type: "problem",
        title: p.title,
        url: `/problems/${p.id}`,
        metadata: { platform: p.platform, score: 2 }
      }));
    }

    // 4. Projects
    const { data: projects } = await this.repos.rawClient
      .from("projects")
      .select("*")
      .eq("user_id", userId)
      .or(`title.ilike.${searchPattern},description.ilike.${searchPattern}`)
      .limit(limit);

    if (projects) {
      projects.forEach(p => results.push({
        id: p.id,
        type: "project",
        title: p.title,
        description: p.description || undefined,
        url: `/projects/${p.id}`,
        metadata: { score: 2 }
      }));
    }

    // 5. Concepts
    const { data: concepts } = await this.repos.rawClient
      .from("concept_notes")
      .select("*")
      .eq("user_id", userId)
      .ilike("title", searchPattern)
      .limit(limit);
      
    if (concepts) {
      concepts.forEach(c => results.push({
        id: c.id,
        type: "concept",
        title: c.title,
        url: `/concepts/${c.id}`,
        metadata: { score: 2 }
      }));
    }

    // Sort by computed relevance score (simulating semantic/graph ranking)
    return results.sort((a, b) => (b.metadata?.score || 0) - (a.metadata?.score || 0)).slice(0, limit);
  }
}
