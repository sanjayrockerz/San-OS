"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createServices, StudentIntelligenceCoreService } from "@/lib/services";
import {
  createPipelineEntrySchema,
  updatePipelineEntrySchema,
} from "@/lib/validators/business";
import { uuidSchema } from "@/lib/validators/common";

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

function revalidate() {
  revalidatePath("/pipeline");
  revalidatePath("/overview");
}

export async function createPipelineEntry(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser("/pipeline");

  const raw = {
    client_id: formData.get("client_id") || null,
    title: formData.get("title"),
    value_estimate: formData.get("value_estimate")
      ? Number(formData.get("value_estimate"))
      : null,
    stage: formData.get("stage") || "lead",
    probability: formData.get("probability") ? Number(formData.get("probability")) : 50,
    expected_close_date: formData.get("expected_close_date") || null,
    notes: formData.get("notes") || null,
  };

  const parsed = createPipelineEntrySchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const services = createServices(await createClient());
  try {
    const entry = await services.pipeline.create(user.id, parsed.data);
    StudentIntelligenceCoreService.invalidate(user.id);
    revalidate();
    return { ok: true, id: entry.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to create entry" };
  }
}

export async function updatePipelineStage(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser("/pipeline");

  const entryId = uuidSchema.safeParse(formData.get("entryId"));
  if (!entryId.success) return { ok: false, error: "Invalid entry" };

  const parsed = updatePipelineEntrySchema.safeParse({
    stage: formData.get("stage"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const services = createServices(await createClient());
  try {
    await services.pipeline.update(user.id, entryId.data, parsed.data);
    StudentIntelligenceCoreService.invalidate(user.id);
    revalidate();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to update entry" };
  }
}

export async function deletePipelineEntry(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser("/pipeline");

  const entryId = uuidSchema.safeParse(formData.get("entryId"));
  if (!entryId.success) return { ok: false, error: "Invalid entry" };

  const services = createServices(await createClient());
  try {
    await services.pipeline.delete(entryId.data);
    StudentIntelligenceCoreService.invalidate(user.id);
    revalidate();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to delete entry" };
  }
}
