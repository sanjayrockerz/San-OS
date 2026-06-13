import { z } from "zod";

import { uuidSchema } from "./common";

/** Record the outcome of a revision (drives RevisionService.recordReview). */
export const recordReviewSchema = z.object({
  problemId: uuidSchema,
  success: z.boolean(),
  editorialUsed: z.boolean().optional(),
});
export type RecordReviewInput = z.infer<typeof recordReviewSchema>;
