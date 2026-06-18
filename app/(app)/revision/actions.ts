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

  const confidenceRaw = formData.get("confidence");
  const parsed = recordReviewSchema.safeParse({
    problemId: formData.get("problemId"),
    success: formData.get("success") === "true",
    editorialUsed: formData.get("editorialUsed") === "true",
    recalledPattern: formData.get("recalledPattern") === "true",
    recalledAlgorithm: formData.get("recalledAlgorithm") === "true",
    recalledComplexity: formData.get("recalledComplexity") === "true",
    recalledMistakes: formData.get("recalledMistakes") === "true",
    confidence: confidenceRaw ? Number(confidenceRaw) : undefined,
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

  // Graded recall is optional input (the checklist in the revision-flow
  // modal) — when present it sharpens Recall Strength beyond the binary
  // success/failure already recorded above. Best-effort: a missing grade
  // just means Model 1 falls back to the revision_queue-only formula.
  if (formData.get("recalledPattern") !== null) {
    try {
      await services.memoryIntelligence.gradeRecall(user.id, {
        problemId: parsed.data.problemId,
        recalledPattern: parsed.data.recalledPattern ?? false,
        recalledAlgorithm: parsed.data.recalledAlgorithm ?? false,
        recalledComplexity: parsed.data.recalledComplexity ?? false,
        recalledMistakes: parsed.data.recalledMistakes ?? false,
        confidence: parsed.data.confidence ?? null,
        success: parsed.data.success,
      });
    } catch {
      // best-effort; recall strength still works from revision_queue alone
    }
  }

  // Recall Strength/Topic Health are caches derived from revision_queue +
  // events; recompute them now so the dashboard reflects this outcome
  // immediately. Fail-soft and idempotent, same posture as taxonomy.evolve().
  try {
    await services.memoryIntelligence.evolve(user.id);
  } catch {
    // best-effort; a later evolve() call will catch up
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
