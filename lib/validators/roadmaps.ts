import { z } from "zod";

import { Constants } from "@/types/database";

import { slugSchema, uuidSchema } from "./common";

const E = Constants.public.Enums;

/** Create a user-authored roadmap. */
export const createRoadmapSchema = z.object({
  title: z.string().min(1).max(200),
  kind: z.enum(E.roadmap_kind).default("custom"),
  slug: slugSchema.nullish(),
  description: z.string().max(5000).nullish(),
  source_url: z.url().nullish(),
});
export type CreateRoadmapInput = z.infer<typeof createRoadmapSchema>;

/** Set the user's status for a roadmap item. */
export const markRoadmapItemSchema = z.object({
  roadmapId: uuidSchema,
  itemId: uuidSchema,
  status: z.enum(E.roadmap_item_status),
});
export type MarkRoadmapItemInput = z.infer<typeof markRoadmapItemSchema>;
