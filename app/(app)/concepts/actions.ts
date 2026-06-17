"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createServices, DashboardAggregationService } from "@/lib/services";
import {
  createConceptSchema,
  reviseConceptSchema,
  addConceptResourceSchema,
  linkConceptProblemSchema,
} from "@/lib/validators/concepts";
import { uuidSchema } from "@/lib/validators/common";

export type ActionResult =
  | { ok: true; id?: string }
  | { ok: false; error: string };

function revalidate(conceptId?: string) {
  revalidatePath("/concepts");
  revalidatePath("/overview");
  if (conceptId) revalidatePath(`/concepts/${conceptId}`);
}

export async function createConcept(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser("/concepts/new");

  const raw = {
    title: formData.get("title"),
    category: formData.get("category") || null,
    status: formData.get("status") || "learning",
    confidence: formData.get("confidence") ? Number(formData.get("confidence")) : null,
    personal_explanation: formData.get("personal_explanation") || null,
    recognition_clues: formData.getAll("recognition_clues").filter(Boolean) as string[],
    when_to_use: formData.get("when_to_use") || null,
    common_mistakes: formData.getAll("common_mistakes").filter(Boolean) as string[],
    topic_id: formData.get("topic_id") || null,
    pattern_id: formData.get("pattern_id") || null,
  };

  const parsed = createConceptSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const services = createServices(await createClient());
  try {
    const concept = await services.concepts.create(user.id, parsed.data);
    DashboardAggregationService.invalidate(user.id);
    
    try {
      await services.context.touch(user.id, {
        active_entity_type: "concept",
        active_entity_id: concept.id,
        active_session_type: "learn",
      });
    } catch {
      // best effort
    }

    revalidate(concept.id);
    return { ok: true, id: concept.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to create concept" };
  }
}

export async function updateConcept(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser("/concepts");
  const id = formData.get("id");
  if (typeof id !== "string") return { ok: false, error: "Invalid concept" };

  const raw = {
    title: formData.get("title"),
    category: formData.get("category") || null,
    personal_explanation: formData.get("personal_explanation") || null,
    recognition_clues: formData.getAll("recognition_clues").filter(Boolean) as string[],
    when_to_use: formData.get("when_to_use") || null,
    common_mistakes: formData.getAll("common_mistakes").filter(Boolean) as string[],
    topic_id: formData.get("topic_id") || null,
    pattern_id: formData.get("pattern_id") || null,
  };

  const parsed = createConceptSchema.partial().safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const services = createServices(await createClient());
  try {
    await services.concepts.update(user.id, id, parsed.data);
    DashboardAggregationService.invalidate(user.id);
    revalidate(id);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to update concept" };
  }
}

export async function deleteConcept(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser("/concepts");
  const id = formData.get("id");
  if (typeof id !== "string") return { ok: false, error: "Invalid concept" };

  const services = createServices(await createClient());
  try {
    await services.concepts.remove(user.id, id);
    DashboardAggregationService.invalidate(user.id);
    revalidate();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to delete concept" };
  }
}

export async function markConceptStatus(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser("/concepts");

  const parsed = reviseConceptSchema.safeParse({
    conceptId: formData.get("conceptId"),
    status: formData.get("status"),
    confidence: formData.get("confidence") ? Number(formData.get("confidence")) : null,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const services = createServices(await createClient());
  try {
    await services.concepts.revise(
      user.id,
      parsed.data.conceptId,
      parsed.data.status,
      parsed.data.confidence,
    );
    DashboardAggregationService.invalidate(user.id);
    revalidate(parsed.data.conceptId);
    revalidatePath("/revision");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to update status" };
  }
}

export async function addConceptResource(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser("/concepts");

  const parsed = addConceptResourceSchema.safeParse({
    concept_id: formData.get("concept_id"),
    type: formData.get("type"),
    title: formData.get("title") || null,
    url: formData.get("url") || null,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid resource" };
  }

  const services = createServices(await createClient());
  try {
    await services.concepts.addResource(user.id, parsed.data);
    revalidate(parsed.data.concept_id);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to add resource" };
  }
}

export async function linkConceptProblem(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser("/concepts");

  const parsed = linkConceptProblemSchema.safeParse({
    conceptId: formData.get("conceptId"),
    problemId: formData.get("problemId"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Invalid concept or problem ID" };
  }

  const services = createServices(await createClient());
  try {
    await services.concepts.linkProblem(user.id, parsed.data.conceptId, parsed.data.problemId);
    revalidate(parsed.data.conceptId);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to link problem" };
  }
}

export async function unlinkConceptProblem(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser("/concepts");
  const conceptId = uuidSchema.safeParse(formData.get("conceptId"));
  const problemId = uuidSchema.safeParse(formData.get("problemId"));
  if (!conceptId.success || !problemId.success) {
    return { ok: false, error: "Invalid IDs" };
  }

  const services = createServices(await createClient());
  try {
    await services.concepts.unlinkProblem(user.id, conceptId.data, problemId.data);
    revalidate(conceptId.data);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to unlink problem" };
  }
}
