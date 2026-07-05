import { BaseService } from "./base.service";
import type { Repositories } from "@/lib/repositories";
import { getEmbeddingProvider } from "@/lib/embeddings/embedding-provider";

export interface SemanticSearchResult {
  id: string;
  source: "capture" | "knowledge" | "event";
  content: string;
  similarity: number;
}

export class SemanticMemoryService extends BaseService {
  constructor(repos: Repositories) {
    super(repos);
  }
  /**
   * Generates embeddings and stores them for a given entity
   */
  async indexText(userId: string, entityType: "capture" | "knowledge" | "event", entityId: string, text: string) {
    const provider = getEmbeddingProvider();
    if (!provider.isConfigured()) return;

    try {
      const embedding = await provider.embedText(text);

      let table = "";
      if (entityType === "capture") table = "capture_items";
      if (entityType === "knowledge") table = "concept_notes";
      if (entityType === "event") table = "events";

      // Formatted as a pgvector string e.g., "[0.1, 0.2, ...]"
      const embeddingString = `[${embedding.join(",")}]`;

      // Update the record with the generated embedding
      const { error } = await this.repos.rawClient
        .from(table as any)
        .update({ embedding: embeddingString })
        .eq("id", entityId)
        .eq("user_id", userId);

      if (error) {
        console.error("Failed to store embedding:", error);
      }
    } catch (e) {
      console.error("Error generating embedding:", e);
    }
  }

  /**
   * Search across all vector spaces
   */
  async search(userId: string, query: string, limit = 5, matchThreshold = 0.5): Promise<SemanticSearchResult[]> {
    const provider = getEmbeddingProvider();
    if (!provider.isConfigured()) return [];

    try {
      const queryEmbedding = await provider.embedText(query);
      const embeddingString = `[${queryEmbedding.join(",")}]`;

      const { data, error } = await this.repos.rawClient.rpc("match_semantic_items", {
        query_embedding: embeddingString,
        match_threshold: matchThreshold,
        match_count: limit,
        p_user_id: userId,
      });

      if (error) {
        console.error("Vector search RPC error:", error);
        return [];
      }

      return (data as SemanticSearchResult[]) || [];
    } catch (e) {
      console.error("Error searching semantic memory:", e);
      return [];
    }
  }
}
