import { z } from "zod";

import { Constants } from "@/types/database";

import { uuidSchema } from "./common";

const E = Constants.public.Enums;

/** Create or edit a permanent academic-history record for one semester. */
export const academicSemesterSchema = z.object({
  semester_number: z.number().int().positive().max(20),
  name: z.string().min(1).max(120),
  academic_year: z.string().max(20).nullish(),
  total_credits: z.number().min(0).max(999).nullish(),
  earned_credits: z.number().min(0).max(999).nullish(),
  sgpa: z.number().min(0).max(10).nullish(),
  cgpa_after: z.number().min(0).max(10).nullish(),
  backlogs: z.number().int().min(0).max(99).nullish(),
  status: z.enum(E.semester_status).default("upcoming"),
  is_current: z.boolean().default(false),
});
export type AcademicSemesterInput = z.infer<typeof academicSemesterSchema>;

/** Set or update the student's CGPA target, dream company, and programme length. */
export const academicGoalsSchema = z.object({
  target_cgpa: z.number().min(0).max(10).nullish(),
  dream_company: z.string().max(120).nullish(),
  total_semesters: z.number().int().positive().max(20).default(8),
});
export type AcademicGoalsInput = z.infer<typeof academicGoalsSchema>;

/** What-if simulator scenarios — every variant maps to a real, explainable recompute. */
export const whatIfScenarioSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("future_semester_gpa"),
    gpa: z.number().min(0).max(10),
  }),
  z.object({
    type: z.literal("course_grade"),
    courseId: uuidSchema,
    gradePoint: z.number().min(0).max(10),
  }),
  z.object({
    type: z.literal("backlog"),
    courseId: uuidSchema,
  }),
  z.object({
    type: z.literal("repeat_course"),
    courseId: uuidSchema,
    gradePoint: z.number().min(0).max(10),
  }),
]);
export type WhatIfScenarioInput = z.infer<typeof whatIfScenarioSchema>;
