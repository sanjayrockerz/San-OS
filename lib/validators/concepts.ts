import { z } from "zod";

import { Constants } from "@/types/database";

import { uuidSchema } from "./common";

const E = Constants.public.Enums;

/** Create a concept-vault card. */
export const createConceptSchema = z.object({
  title: z.string().min(1).max(200),
  category: z.string().max(80).nullish(),
  status: z.enum(E.concept_status).default("learning"),
  confidence: z.number().int().min(1).max(5).nullish(),
  personal_explanation: z.string().max(20000).nullish(),
  recognition_clues: z.array(z.string().max(500)).default([]),
  when_to_use: z.string().max(5000).nullish(),
  common_mistakes: z.array(z.string().max(500)).default([]),
  topic_id: uuidSchema.nullish(),
  pattern_id: uuidSchema.nullish(),
});
export type CreateConceptInput = z.infer<typeof createConceptSchema>;

/** Revise a concept: update its status and confidence. */
export const reviseConceptSchema = z.object({
  conceptId: uuidSchema,
  status: z.enum(E.concept_status),
  confidence: z.number().int().min(1).max(5).nullish(),
});
export type ReviseConceptInput = z.infer<typeof reviseConceptSchema>;

/** Attach a resource (image/PDF/link) to a concept. */
export const addConceptResourceSchema = z.object({
  concept_id: uuidSchema,
  type: z.enum(E.resource_type),
  title: z.string().max(200).nullish(),
  url: z.url().nullish(),
  storage_path: z.string().max(500).nullish(),
});
export type AddConceptResourceInput = z.infer<typeof addConceptResourceSchema>;

/** Link a concept to a problem. */
export const linkConceptProblemSchema = z.object({
  conceptId: uuidSchema,
  problemId: uuidSchema,
});
export type LinkConceptProblemInput = z.infer<typeof linkConceptProblemSchema>;
