import { z } from "zod";

import { uuidSchema } from "./common";

/** Record the outcome of a revision (drives RevisionService.recordReview). */
export const recordReviewSchema = z.object({
  problemId: uuidSchema,
  success: z.boolean(),
  editorialUsed: z.boolean().optional(),
  recalledPattern: z.boolean().optional(),
  recalledAlgorithm: z.boolean().optional(),
  recalledComplexity: z.boolean().optional(),
  recalledMistakes: z.boolean().optional(),
  confidence: z.number().int().min(1).max(5).optional(),
});
export type RecordReviewInput = z.infer<typeof recordReviewSchema>;
