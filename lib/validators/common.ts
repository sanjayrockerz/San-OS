import { z } from "zod";

/**
 * Shared Zod primitives reused across feature validators (added in later
 * phases). Server Actions validate their input with schemas built from these
 * before any repository/service call runs.
 */

export const uuidSchema = z.uuid();

export const slugSchema = z
  .string()
  .min(1)
  .max(96)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Must be a lowercase kebab-case slug");

export const timestampSchema = z.iso.datetime({ offset: true });

/** Columns present on every table per the project's schema conventions. */
export const baseEntitySchema = z.object({
  id: uuidSchema,
  created_at: timestampSchema,
  updated_at: timestampSchema,
});

export type BaseEntity = z.infer<typeof baseEntitySchema>;
