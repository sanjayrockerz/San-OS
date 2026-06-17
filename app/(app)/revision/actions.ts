"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createServices, DashboardAggregationService } from "@/lib/services";
import { recordReviewSchema } from "@/lib/validators/revision";

export type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * Records the outcome of a revision and fans out every side effect:
 *   recordReview (reschedules + emits revision.succeeded/failed)
 *   → activity log + daily counter
 *   → dashboard cache invalidation + route revalidation
 * The scheduling maths lives in RevisionService; this action only orchestrates.
 */
export async function recordRevision(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser("/revision");

  const parsed = recordReviewSchema.safeParse({
    problemId: formData.get("problemId"),
    success: formData.get("success") === "true",
    editorialUsed: formData.get("editorialUsed") === "true",
  });
  if (!parsed.success) return { ok: false, error: "Invalid revision outcome" };

  const services = createServices(await createClient());
  try {
    await services.revision.recordReview(
      user.id,
      parsed.data.problemId,
      parsed.data.success,
      parsed.data.editorialUsed ?? false,
    );
    await services.activity.log(user.id, {
      type: "revision_completed",
      title: parsed.data.success
        ? "Completed a revision"
        : "Struggled on a revision",
      entityType: "problem",
      entityId: parsed.data.problemId,
      metadata: { success: parsed.data.success },
    });
    await services.activity.bumpDailyCounters(user.id, { revisions_done: 1 });
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to record revision",
    };
  }

  DashboardAggregationService.invalidate(user.id);

  try {
    await services.context.touch(user.id, {
      active_entity_type: "problem",
      active_entity_id: parsed.data.problemId,
      active_session_type: "revise",
    });
  } catch {
    // best effort
  }

  revalidatePath("/revision");
  revalidatePath("/overview");
  return { ok: true };
}

/** Pushes a problem's next revision out by one day. Emits revision.snoozed. */
export async function snoozeRevision(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser("/revision");
  const problemId = formData.get("problemId");
  if (typeof problemId !== "string") {
    return { ok: false, error: "Invalid problem" };
  }

  const services = createServices(await createClient());
  try {
    await services.revision.snooze(user.id, problemId, 1);
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to snooze",
    };
  }

  DashboardAggregationService.invalidate(user.id);
  revalidatePath("/revision");
  revalidatePath("/overview");
  return { ok: true };
}
