import { z } from "zod";

import { Constants } from "@/types/database";

import { uuidSchema } from "./common";

const E = Constants.public.Enums;

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------

export const createClientSchema = z.object({
  name: z.string().min(1).max(200),
  company: z.string().max(200).nullish(),
  industry: z.string().max(100).nullish(),
  website: z.url().nullish().or(z.literal("")).transform((v) => v || null),
  email: z.string().email().nullish().or(z.literal("")).transform((v) => v || null),
  phone: z.string().max(50).nullish(),
  whatsapp: z.string().max(50).nullish(),
  timezone: z.string().max(50).nullish(),
  address: z.string().max(500).nullish(),
  tax_info: z.string().max(200).nullish(),
  status: z.enum(E.client_status).default("prospect"),
  notes: z.string().max(5000).nullish(),
});
export type CreateClientInput = z.infer<typeof createClientSchema>;

export const updateClientSchema = createClientSchema.partial();
export type UpdateClientInput = z.infer<typeof updateClientSchema>;

// ---------------------------------------------------------------------------
// Pipeline
// ---------------------------------------------------------------------------

export const createPipelineEntrySchema = z.object({
  client_id: uuidSchema.nullish(),
  title: z.string().min(1).max(200),
  value_estimate: z.number().min(0).nullish(),
  stage: z.enum(E.pipeline_stage).default("lead"),
  probability: z.number().int().min(0).max(100).default(50),
  expected_close_date: z.string().nullish(),
  notes: z.string().max(5000).nullish(),
});
export type CreatePipelineEntryInput = z.infer<typeof createPipelineEntrySchema>;

export const updatePipelineEntrySchema = createPipelineEntrySchema.partial();
export type UpdatePipelineEntryInput = z.infer<typeof updatePipelineEntrySchema>;

// ---------------------------------------------------------------------------
// Invoices
// ---------------------------------------------------------------------------

export const invoiceLineItemSchema = z.object({
  description: z.string().min(1).max(300),
  quantity: z.number().min(0).default(1),
  unitPrice: z.number().min(0),
});

export const createInvoiceSchema = z.object({
  client_id: uuidSchema,
  project_id: uuidSchema.nullish(),
  invoice_number: z.string().min(1).max(50),
  line_items: z.array(invoiceLineItemSchema).default([]),
  total_amount: z.number().min(0).default(0),
  currency: z.string().max(10).default("INR"),
  status: z.enum(E.invoice_status).default("draft"),
  due_date: z.string().nullish(),
});
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;

export const updateInvoiceSchema = createInvoiceSchema.partial();
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;

// ---------------------------------------------------------------------------
// Finance — income / expense entries
// ---------------------------------------------------------------------------

export const createIncomeEntrySchema = z.object({
  client_id: uuidSchema.nullish(),
  project_id: uuidSchema.nullish(),
  invoice_id: uuidSchema.nullish(),
  amount: z.number().min(0),
  currency: z.string().max(10).default("INR"),
  category: z.string().max(50).default("project_revenue"),
  description: z.string().max(500).nullish(),
  received_at: z.string().optional(),
});
export type CreateIncomeEntryInput = z.infer<typeof createIncomeEntrySchema>;

export const createExpenseEntrySchema = z.object({
  category: z.string().max(50).default("other"),
  amount: z.number().min(0),
  currency: z.string().max(10).default("INR"),
  description: z.string().max(500).nullish(),
  occurred_at: z.string().optional(),
});
export type CreateExpenseEntryInput = z.infer<typeof createExpenseEntrySchema>;
