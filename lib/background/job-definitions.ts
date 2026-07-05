import type { Repositories } from "@/lib/repositories";
import type { JobDefinition } from "./types";

export function createBackgroundJobHandlers(repos: Repositories): JobDefinition[] {
  return [
    {
      id: "generate-embeddings",
      name: "Generate Embeddings",
      description: "Generate vector embeddings for content items",
      handler: async (input: { entityType: string; entityId: string; content: string }) => {
        const { embedText } = await import("@/lib/providers/embedding");
        const embedding = await embedText(input.content);
        return { embedding, entityType: input.entityType, entityId: input.entityId };
      },
      options: { maxAttempts: 2, priority: "normal", timeout: 30_000 },
    },
    {
      id: "semantic-indexing",
      name: "Semantic Indexing",
      description: "Index content for semantic search",
      handler: async (input: { entityType: string; entityId: string; content: string }) => {
        const { indexForSearch } = await import("@/lib/providers/search");
        await indexForSearch(input.entityType, input.entityId, input.content);
        return { indexed: true };
      },
      options: { maxAttempts: 2, priority: "low", timeout: 60_000 },
    },
    {
      id: "daily-review",
      name: "Daily Review",
      description: "Generate daily review and analytics",
      handler: async (input: { userId: string }) => {
        const { default: { services } } = await import("@/lib/services");
        const svc = await services(input.userId);
        await svc.timeline.generateDailySummary(input.userId);
        return { reviewed: true };
      },
      options: { maxAttempts: 1, priority: "normal", timeout: 120_000 },
    },
    {
      id: "planner-regeneration",
      name: "Planner Regeneration",
      description: "Regenerate daily planner",
      handler: async (input: { userId: string }) => {
        const { DailyPlannerService } = await import("@/lib/services");
        const planner = new DailyPlannerService(repos);
        await planner.generateDay(input.userId, new Date().toISOString().slice(0, 10));
        return { planned: true };
      },
      options: { maxAttempts: 2, priority: "normal", timeout: 60_000 },
    },
    {
      id: "analytics-recomputation",
      name: "Analytics Recomputation",
      description: "Recompute analytics from event data",
      handler: async (input: { userId: string }) => {
        const { AnalyticsService } = await import("@/lib/services");
        const analytics = new AnalyticsService(repos);
        await analytics.recompute(input.userId);
        return { recomputed: true };
      },
      options: { maxAttempts: 2, priority: "low", timeout: 120_000 },
    },
    {
      id: "timeline-summarization",
      name: "Timeline Summarization",
      description: "Summarize recent timeline events",
      handler: async (input: { userId: string }) => {
        const { TimelineService } = await import("@/lib/services");
        const timeline = new TimelineService(repos);
        await timeline.generateSummary(input.userId);
        return { summarized: true };
      },
      options: { maxAttempts: 2, priority: "low", timeout: 60_000 },
    },
    {
      id: "ocr-processing",
      name: "OCR Processing",
      description: "Process images through OCR",
      handler: async (input: { imageUrl: string }) => {
        const { recognizeText } = await import("@/lib/providers/ocr");
        const text = await recognizeText(input.imageUrl);
        return { text };
      },
      options: { maxAttempts: 3, priority: "high", timeout: 120_000 },
    },
  ];
}
