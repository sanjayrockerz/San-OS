import { z } from "zod";

import { Constants } from "@/types/database";

import { uuidSchema } from "./common";

const E = Constants.public.Enums;

export const createProjectSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).nullish(),
  type: z.enum(E.project_type).default("internal"),
  status: z.enum(E.project_status).default("planning"),
  priority: z.enum(E.project_priority).default("medium"),
  tags: z.array(z.string().max(50)).max(20).default([]),
  client_id: uuidSchema.nullish(),
  client_name: z.string().max(200).nullish(),
  client_email: z.string().email().nullish().or(z.literal("")).transform((v) => v || null),
  repository_url: z.url().nullish().or(z.literal("")).transform((v) => v || null),
  deployment_url: z.url().nullish().or(z.literal("")).transform((v) => v || null),
  production_url: z.url().nullish().or(z.literal("")).transform((v) => v || null),
  estimated_hours: z.number().min(0).max(99999).nullish(),
  budget: z.number().min(0).nullish(),
  revenue: z.number().min(0).nullish(),
  start_date: z.string().nullish(),
  deadline: z.string().nullish(),
});
export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = createProjectSchema.partial();
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

export const createTaskSchema = z.object({
  project_id: uuidSchema,
  title: z.string().min(1).max(300),
  description: z.string().max(5000).nullish(),
  status: z.enum(E.task_status).default("backlog"),
  priority: z.enum(E.project_priority).default("medium"),
  estimated_minutes: z.number().int().min(1).max(99999).nullish(),
  due_date: z.string().nullish(),
  order_index: z.number().int().min(0).default(0),
});
export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = createTaskSchema.omit({ project_id: true }).partial();
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export const createMilestoneSchema = z.object({
  project_id: uuidSchema,
  title: z.string().min(1).max(200),
  description: z.string().max(2000).nullish(),
  target_date: z.string().nullish(),
});
export type CreateMilestoneInput = z.infer<typeof createMilestoneSchema>;

export const logTimeSchema = z.object({
  project_id: uuidSchema,
  task_id: uuidSchema.nullish(),
  category: z.enum(E.time_entry_category).default("other"),
  description: z.string().max(500).nullish(),
  minutes: z.number().int().min(1).max(1440),
  logged_at: z.string().optional(),
});
export type LogTimeInput = z.infer<typeof logTimeSchema>;

export const createDocumentSchema = z.object({
  project_id: uuidSchema,
  title: z.string().min(1).max(200),
  doc_type: z.string().max(50).default("note"),
  content: z.string().max(100000).nullish(),
  file_url: z.url().nullish().or(z.literal("")).transform((v) => v || null),
});
export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;

export const createChangeRequestSchema = z.object({
  project_id: uuidSchema,
  title: z.string().min(1).max(200),
  description: z.string().max(5000).nullish(),
  original_scope: z.string().max(5000).nullish(),
  requested_change: z.string().max(5000).nullish(),
  estimated_hours: z.number().min(0).max(99999).nullish(),
  suggested_price: z.number().min(0).nullish(),
  status: z.enum(E.change_request_status).default("pending"),
});
export type CreateChangeRequestInput = z.infer<typeof createChangeRequestSchema>;

export const createQuoteSchema = z.object({
  project_id: uuidSchema.nullish(),
  client_id: uuidSchema.nullish(),
  title: z.string().min(1).max(200),
  summary: z.string().max(5000).nullish(),
  features: z.array(z.object({
    title: z.string(),
    description: z.string().optional(),
    estimatedHours: z.number().optional(),
    complexity: z.enum(["low", "medium", "high"]).optional(),
  })).default([]),
  milestones: z.array(z.object({
    title: z.string(),
    deliverables: z.array(z.string()).optional(),
    durationWeeks: z.number().optional(),
    price: z.number().optional(),
  })).default([]),
  total_estimated_hours: z.number().min(0).nullish(),
  price_min: z.number().min(0).nullish(),
  price_max: z.number().min(0).nullish(),
  status: z.enum(E.quote_status).default("draft"),
  expires_at: z.string().nullish(),
});
export type CreateQuoteInput = z.infer<typeof createQuoteSchema>;
