import type { Repositories } from "@/lib/repositories";
import type { JobDefinition } from "./types";

export function createBackgroundJobHandlers(repos: Repositories): JobDefinition[] {
  return [
    {
      id: "daily-review",
      name: "Daily Review",
      handler: async (_input: unknown) => {
        return { reviewed: true };
      },
      options: { maxAttempts: 1, priority: "normal", timeout: 120_000 },
    },
    {
      id: "planner-regeneration",
      name: "Planner Regeneration",
      handler: async (_input: unknown) => {
        return { planned: true };
      },
      options: { maxAttempts: 2, priority: "normal", timeout: 60_000 },
    },
    {
      id: "analytics-recomputation",
      name: "Analytics Recomputation",
      handler: async (_input: unknown) => {
        return { recomputed: true };
      },
      options: { maxAttempts: 2, priority: "low", timeout: 120_000 },
    },
    {
      id: "timeline-summarization",
      name: "Timeline Summarization",
      handler: async (_input: unknown) => {
        return { summarized: true };
      },
      options: { maxAttempts: 2, priority: "low", timeout: 60_000 },
    },
    {
      id: "semantic-indexing",
      name: "Semantic Indexing",
      handler: async (_input: unknown) => {
        return { indexed: true };
      },
      options: { maxAttempts: 2, priority: "low", timeout: 60_000 },
    },
    {
      id: "ocr-processing",
      name: "OCR Processing",
      handler: async (_input: unknown) => {
        return { text: "" };
      },
      options: { maxAttempts: 3, priority: "high", timeout: 120_000 },
    },
  ];
}
