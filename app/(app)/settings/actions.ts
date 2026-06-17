"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createServices } from "@/lib/services";
import { Constants } from "@/types/database";

export type ActionResult = { ok: true } | { ok: false; error: string };

const E = Constants.public.Enums;

function checked(form: FormData, name: string): boolean {
  const v = form.get(name);
  return v === "on" || v === "true" || v === "1";
}

const preferencesSchema = z.object({
  defaultFocusMode: z.enum(E.focus_mode).default("none"),
  notificationsEnabled: z.boolean(),
  dailyBriefEnabled: z.boolean(),
  eveningReviewEnabled: z.boolean(),
  quietHoursStart: z.string().trim().max(8).optional(),
  quietHoursEnd: z.string().trim().max(8).optional(),
  hiddenCategories: z.array(z.enum(E.reminder_category)).default([]),
});

/** Persists the whole Settings form (notifications, focus modes, daily brief, privacy). */
export async function updatePreferences(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser("/settings");

  const parsed = preferencesSchema.safeParse({
    defaultFocusMode: formData.get("defaultFocusMode") || "none",
    notificationsEnabled: checked(formData, "notificationsEnabled"),
    dailyBriefEnabled: checked(formData, "dailyBriefEnabled"),
    eveningReviewEnabled: checked(formData, "eveningReviewEnabled"),
    quietHoursStart: formData.get("quietHoursStart") || undefined,
    quietHoursEnd: formData.get("quietHoursEnd") || undefined,
    hiddenCategories: formData.getAll("hiddenCategories"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const v = parsed.data;
  const services = createServices(await createClient());
  try {
    await services.repos.userPreferences.upsert(user.id, {
      default_focus_mode: v.defaultFocusMode,
      notifications_enabled: v.notificationsEnabled,
      daily_brief_enabled: v.dailyBriefEnabled,
      evening_review_enabled: v.eveningReviewEnabled,
      quiet_hours_start: v.quietHoursStart ?? null,
      quiet_hours_end: v.quietHoursEnd ?? null,
      hidden_categories: v.hiddenCategories,
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to save settings" };
  }

  revalidatePath("/settings");
  revalidatePath("/overview");
  return { ok: true };
}

/** Thin action for the dashboard's Focus Mode switcher (single-field update). */
export async function setFocusMode(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser("/overview");

  const parsed = z.enum(E.focus_mode).safeParse(formData.get("mode"));
  if (!parsed.success) {
    return { ok: false, error: "Invalid focus mode" };
  }

  const services = createServices(await createClient());
  try {
    const existing = await services.repos.userPreferences.findByUser(user.id);
    await services.repos.userPreferences.upsert(user.id, {
      default_focus_mode: parsed.data,
      notifications_enabled: existing?.notifications_enabled ?? true,
      daily_brief_enabled: existing?.daily_brief_enabled ?? true,
      evening_review_enabled: existing?.evening_review_enabled ?? true,
      quiet_hours_start: existing?.quiet_hours_start ?? null,
      quiet_hours_end: existing?.quiet_hours_end ?? null,
      hidden_categories: existing?.hidden_categories ?? [],
    });
    await services.events.emit(user.id, {
      eventType: "habit.focus_mode_changed",
      entityType: "user_preferences",
      payload: { mode: parsed.data },
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to set focus mode" };
  }

  revalidatePath("/overview");
  revalidatePath("/settings");
  return { ok: true };
}
