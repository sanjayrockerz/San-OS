import { z } from "zod";

import { Constants } from "@/types/database";

import { uuidSchema } from "./common";

const E = Constants.public.Enums;

/** Create an IIT course. */
export const createCourseSchema = z.object({
  name: z.string().min(1).max(200),
  code: z.string().max(40).nullish(),
  credits: z.number().min(0).max(99).nullish(),
  semester: z.string().max(40).nullish(),
  status: z.enum(E.course_status).default("in_progress"),
  instructor: z.string().max(120).nullish(),
  grade: z.string().max(10).nullish(),
  marks: z.number().min(0).nullish(),
  max_marks: z.number().min(0).nullish(),
  semester_id: uuidSchema.nullish(),
  grade_point: z.number().min(0).max(10).nullish(),
  attempts: z.number().int().positive().max(10).nullish(),
  attendance_percentage: z.number().min(0).max(100).nullish(),
});
export type CreateCourseInput = z.infer<typeof createCourseSchema>;

/** Create an assignment, optionally tied to a course. */
export const createAssignmentSchema = z.object({
  course_id: uuidSchema.nullish(),
  title: z.string().min(1).max(200),
  description: z.string().max(5000).nullish(),
  due_date: z.iso.datetime({ offset: true }).nullish(),
  status: z.enum(E.assignment_status).default("pending"),
  max_score: z.number().min(0).nullish(),
});
export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;

/** Create a lecture, optionally tied to a course. */
export const createLectureSchema = z.object({
  course_id: uuidSchema.nullish(),
  title: z.string().min(1).max(200),
  lecture_number: z.number().int().positive().nullish(),
  status: z.enum(E.lecture_status).default("not_started"),
  duration_minutes: z.number().int().positive().max(100000).nullish(),
  video_url: z.url().nullish(),
  notes: z.string().max(20000).nullish(),
});
export type CreateLectureInput = z.infer<typeof createLectureSchema>;

/** Register a document in the academic vault. */
export const addDocumentSchema = z.object({
  type: z.enum(E.document_type).default("other"),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).nullish(),
  storage_bucket: z.string().max(80).nullish(),
  storage_path: z.string().max(500).nullish(),
  file_url: z.url().nullish(),
  file_size_bytes: z.number().int().nonnegative().nullish(),
  mime_type: z.string().max(120).nullish(),
  course_id: uuidSchema.nullish(),
});
export type AddDocumentInput = z.infer<typeof addDocumentSchema>;
