"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createServices, DashboardAggregationService } from "@/lib/services";
import { Constants } from "@/types/database";

export type ActionResult = { ok: true } | { ok: false; error: string };

const E = Constants.public.Enums;

function revalidateAll() {
  revalidatePath("/notifications");
  revalidatePath("/overview");
}

/** Snoozes a notification until a given timestamp (re-surfaces on its own afterwards). */
export async function snoozeNotification(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser("/notifications");

  const notificationId = formData.get("notificationId");
  const until = formData.get("until");
  if (typeof notificationId !== "string" || !notificationId) {
    return { ok: false, error: "Missing notification" };
  }
  const untilDate = typeof until === "string" && until ? new Date(until) : null;
  if (!untilDate || Number.isNaN(untilDate.getTime())) {
    return { ok: false, error: "Invalid snooze time" };
  }

  const services = createServices(await createClient());
  try {
    await services.habitEngine.snoozeNotification(user.id, notificationId, untilDate);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to snooze" };
  }

  DashboardAggregationService.invalidate(user.id);
  revalidateAll();
  return { ok: true };
}

/** Marks a notification resolved/done. */
export async function completeNotification(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser("/notifications");

  const notificationId = formData.get("notificationId");
  if (typeof notificationId !== "string" || !notificationId) {
    return { ok: false, error: "Missing notification" };
  }

  const services = createServices(await createClient());
  try {
    await services.habitEngine.completeNotification(user.id, notificationId);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to complete" };
  }

  DashboardAggregationService.invalidate(user.id);
  revalidateAll();
  return { ok: true };
}

/** Marks a notification read without resolving it. */
export async function markRead(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser("/notifications");

  const notificationId = formData.get("notificationId");
  if (typeof notificationId !== "string" || !notificationId) {
    return { ok: false, error: "Missing notification" };
  }

  const services = createServices(await createClient());
  try {
    await services.habitEngine.markRead(user.id, notificationId);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to update" };
  }

  revalidateAll();
  return { ok: true };
}

const createReminderSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().max(2000).optional(),
  category: z.enum(E.reminder_category),
  recurrence: z.enum(E.reminder_recurrence).default("one_time"),
  intervalDays: z.coerce.number().int().positive().max(3650).optional(),
  intervalWeeks: z.coerce.number().int().positive().max(520).optional(),
  intervalMonths: z.coerce.number().int().positive().max(120).optional(),
  timeOfDay: z.string().trim().max(8).optional(),
  scheduledAt: z.string().trim().optional(),
});

/** Creates a new one-time or recurring reminder. */
export async function createReminder(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser("/notifications");

  const parsed = createReminderSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    category: formData.get("category"),
    recurrence: formData.get("recurrence") || "one_time",
    intervalDays: formData.get("intervalDays") || undefined,
    intervalWeeks: formData.get("intervalWeeks") || undefined,
    intervalMonths: formData.get("intervalMonths") || undefined,
    timeOfDay: formData.get("timeOfDay") || undefined,
    scheduledAt: formData.get("scheduledAt") || undefined,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const v = parsed.data;
  const services = createServices(await createClient());
  try {
    await services.habitEngine.createReminder(user.id, {
      title: v.title,
      description: v.description ?? null,
      category: v.category,
      recurrence: v.recurrence,
      intervalDays: v.intervalDays ?? null,
      intervalWeeks: v.intervalWeeks ?? null,
      intervalMonths: v.intervalMonths ?? null,
      timeOfDay: v.timeOfDay ?? null,
      scheduledAt: v.scheduledAt ? new Date(v.scheduledAt).toISOString() : null,
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to create reminder" };
  }

  revalidateAll();
  return { ok: true };
}

/** Pauses, archives, or otherwise updates an existing reminder. */
export async function updateReminder(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser("/notifications");

  const reminderId = formData.get("reminderId");
  const status = formData.get("status");
  if (typeof reminderId !== "string" || !reminderId) {
    return { ok: false, error: "Missing reminder" };
  }
  const parsedStatus = z.enum(E.reminder_status).safeParse(status);
  if (!parsedStatus.success) {
    return { ok: false, error: "Invalid status" };
  }

  const services = createServices(await createClient());
  try {
    await services.habitEngine.updateReminder(user.id, reminderId, {
      status: parsedStatus.data,
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to update reminder" };
  }

  revalidateAll();
  return { ok: true };
}

/** Deletes a reminder. */
export async function deleteReminder(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser("/notifications");

  const reminderId = formData.get("reminderId");
  if (typeof reminderId !== "string" || !reminderId) {
    return { ok: false, error: "Missing reminder" };
  }

  const services = createServices(await createClient());
  try {
    await services.habitEngine.deleteReminder(user.id, reminderId);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to delete reminder" };
  }

  revalidateAll();
  return { ok: true };
}
