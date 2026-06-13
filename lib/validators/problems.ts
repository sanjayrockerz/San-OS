import { z } from "zod";

import { Constants } from "@/types/database";

import { uuidSchema } from "./common";

const E = Constants.public.Enums;

/** Create a user-authored problem. */
export const createProblemSchema = z.object({
  title: z.string().min(1).max(200),
  platform: z.enum(E.problem_platform).default("other"),
  external_problem_id: z.string().max(120).nullish(),
  url: z.url().nullish(),
  difficulty: z.enum(E.difficulty_level).nullish(),
  topic_id: uuidSchema.nullish(),
  pattern_id: uuidSchema.nullish(),
  estimated_minutes: z.number().int().positive().max(1440).nullish(),
});
export type CreateProblemInput = z.infer<typeof createProblemSchema>;

/** Learning-journey flags captured per attempt. */
export const solveJourneySchema = z.object({
  understoodStatement: z.boolean().optional(),
  identifiedPattern: z.boolean().optional(),
  derivedAlgorithm: z.boolean().optional(),
  wrotePseudocode: z.boolean().optional(),
  codedIndependently: z.boolean().optional(),
  runtimeError: z.boolean().optional(),
  syntaxError: z.boolean().optional(),
  logicError: z.boolean().optional(),
});

/** Record a solve attempt (drives ProblemsService.recordSolve). */
export const recordSolveSchema = z.object({
  problemId: uuidSchema,
  language: z.string().max(40).nullish(),
  timeTakenSeconds: z.number().int().nonnegative().nullish(),
  solveStatus: z.enum(E.solve_status).nullish(),
  confidence: z.number().int().min(1).max(5).nullish(),
  editorialUsed: z.boolean().optional(),
  journey: solveJourneySchema.optional(),
  reflection: z
    .object({
      myExplanation: z.string().max(10000).nullish(),
      algorithmInWords: z.string().max(10000).nullish(),
      bugThatStoppedMe: z.string().max(5000).nullish(),
      finalTakeaway: z.string().max(5000).nullish(),
    })
    .optional(),
  code: z
    .object({
      language: z.string().min(1).max(40),
      code: z.string().min(1).max(100000),
      isFinal: z.boolean().optional(),
    })
    .optional(),
});
export type RecordSolveInput = z.infer<typeof recordSolveSchema>;
