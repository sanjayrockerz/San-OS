"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  createServices,
  DashboardAggregationService,
  EVENT_TYPES,
} from "@/lib/services";
import type { StudentAction } from "@/lib/services";

export type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * Marks a Battle Plan task complete. The plan itself is derived (read-only) from
 * the revision queue / weak items, so "completing" a task is recorded as a
 * domain event (`battleplan.task_completed`) + activity entry rather than a row
 * mutation — the underlying state (e.g. a revision) is closed via its own flow.
 */
export async function completeBattlePlanTask(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser("/overview");
  const title = formData.get("title");
  const entityId = formData.get("entityId");
  if (typeof title !== "string" || !title.trim()) {
    return { ok: false, error: "Invalid task" };
  }

  const services = createServices(await createClient());
  try {
    await services.events.emit(user.id, {
      eventType: EVENT_TYPES.BattlePlanTaskCompleted,
      entityType: typeof entityId === "string" && entityId ? "problem" : null,
      entityId: typeof entityId === "string" && entityId ? entityId : null,
      payload: { title },
    });
    await services.activity.log(user.id, {
      type: "study_session",
      title: `Completed: ${title}`,
      metadata: { source: "battle_plan" },
    });
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to complete task",
    };
  }

  DashboardAggregationService.invalidate(user.id);
  revalidatePath("/overview");
  return { ok: true };
}

/**
 * Logs that a focus-session step was marked done. Pure telemetry (the coach
 * timeline reads it back via the existing events table) — it does not gate
 * or mutate anything the rest of the page depends on, so no revalidation.
 */
export async function completeFocusStep(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser("/overview");

  const actionId = formData.get("actionId");
  const actionKind = formData.get("actionKind");
  const actionSource = formData.get("actionSource");
  if (typeof actionId !== "string" || typeof actionKind !== "string" || typeof actionSource !== "string") {
    return { ok: false, error: "Invalid step" };
  }

  const services = createServices(await createClient());
  try {
    await services.studentCoach.logStepCompleted(user.id, {
      id: actionId,
      kind: actionKind as StudentAction["kind"],
      source: actionSource as StudentAction["source"],
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to log step" };
  }
}

/**
 * "Start Now" on a focus-session step. Logs `coach.action_started` (closing
 * the shown -> started gap the outcome audit found — a plain Link fired no
 * event) and then redirects server-side, so the event is guaranteed recorded
 * before the user ever leaves the page.
 */
export async function startFocusAction(formData: FormData): Promise<void> {
  const user = await requireUser("/overview");

  const actionId = formData.get("actionId");
  const actionKind = formData.get("actionKind");
  const actionSource = formData.get("actionSource");
  const href = formData.get("href");
  if (
    typeof actionId !== "string" ||
    typeof actionKind !== "string" ||
    typeof actionSource !== "string" ||
    typeof href !== "string" ||
    !href.startsWith("/")
  ) {
    redirect("/overview");
  }

  const services = createServices(await createClient());
  await services.studentCoach
    .logActionStarted(user.id, {
      id: actionId,
      kind: actionKind as StudentAction["kind"],
      source: actionSource as StudentAction["source"],
    })
    .catch(() => null);

  redirect(href);
}

/** Saves today's daily reflection (mood + notes) to daily_logs. */
export async function saveReflection(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser("/overview");

  const moodRaw = formData.get("mood");
  const notes = formData.get("notes");

  const mood = typeof moodRaw === "string" && moodRaw ? Number(moodRaw) : null;
  if (mood !== null && (mood < 1 || mood > 5)) {
    return { ok: false, error: "Mood must be 1–5" };
  }

  const services = createServices(await createClient());
  const today = new Date().toISOString().slice(0, 10);

  try {
    const existing = await services.repos.dailyLogs.findByDate(user.id, today);
    if (existing) {
      await services.repos.dailyLogs.update(existing.id, {
        mood: mood ?? existing.mood,
        notes: typeof notes === "string" && notes.trim() ? notes.trim() : existing.notes,
      });
    } else {
      await services.repos.dailyLogs.create({
        user_id: user.id,
        log_date: today,
        problems_solved: 0,
        minutes_studied: 0,
        revisions_done: 0,
        mood: mood ?? null,
        notes: typeof notes === "string" && notes.trim() ? notes.trim() : null,
      });
    }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to save reflection",
    };
  }

  DashboardAggregationService.invalidate(user.id);
  revalidatePath("/overview");
  return { ok: true };
}
