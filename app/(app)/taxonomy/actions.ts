"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createServices } from "@/lib/services";

export type ActionResult = { ok: true } | { ok: false; error: string };

type EntityType = "topic" | "pattern";

function parseEntityType(value: FormDataEntryValue | null): EntityType | null {
  return value === "topic" || value === "pattern" ? value : null;
}

/**
 * Approves an AI-proposed topic/pattern → it becomes an active, user-owned
 * taxon. Wraps TaxonomyService.approve (which emits `taxonomy.approved`).
 */
export async function approveProposal(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser("/taxonomy");
  const entityType = parseEntityType(formData.get("entityType"));
  const id = formData.get("id");
  if (!entityType || typeof id !== "string") {
    return { ok: false, error: "Invalid proposal" };
  }

  const services = createServices(await createClient());
  try {
    await services.taxonomy.approve(user.id, entityType, id);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to approve" };
  }

  revalidatePath("/taxonomy");
  revalidatePath("/overview");
  return { ok: true };
}

/**
 * Dismisses an AI-proposed topic/pattern (status → dismissed, kept for de-dup).
 * Wraps TaxonomyService.dismiss (which emits `taxonomy.dismissed`).
 */
export async function dismissProposal(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser("/taxonomy");
  const entityType = parseEntityType(formData.get("entityType"));
  const id = formData.get("id");
  if (!entityType || typeof id !== "string") {
    return { ok: false, error: "Invalid proposal" };
  }

  const services = createServices(await createClient());
  try {
    await services.taxonomy.dismiss(user.id, entityType, id);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to dismiss" };
  }

  revalidatePath("/taxonomy");
  revalidatePath("/overview");
  return { ok: true };
}
