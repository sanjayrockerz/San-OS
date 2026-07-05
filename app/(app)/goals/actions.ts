"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createServices } from "@/lib/services";
import type { GoalHorizon, GoalDomain } from "@/lib/services";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function createGoal(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser("/goals");
  const title = (formData.get("title") as string | null)?.trim();
  const description = (formData.get("description") as string | null)?.trim() || undefined;
  const horizon = formData.get("horizon") as GoalHorizon;
  const domain = (formData.get("domain") as GoalDomain | null) ?? "personal";
  const target_date = (formData.get("targetDate") as string | null) || undefined;

  if (!title) return { ok: false, error: "Title required" };
  if (!horizon) return { ok: false, error: "Horizon required" };

  const services = createServices(await createClient());
  try {
    await services.goalService.createGoal(user.id, { title, description, horizon, domain, target_date });
    revalidatePath("/goals");
    revalidatePath("/overview");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to create goal" };
  }
}

export async function updateGoalProgress(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireUser("/goals");
  const goalId = formData.get("goalId") as string;
  const progress = Number(formData.get("progress") ?? 0);

  if (!goalId) return { ok: false, error: "Goal ID required" };

  const services = createServices(await createClient());
  try {
    await services.goalService.updateProgress(goalId, progress);
    revalidatePath("/goals");
    revalidatePath("/overview");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to update goal" };
  }
}

export async function archiveGoal(formData: FormData): Promise<void> {
  await requireUser("/goals");
  const goalId = formData.get("goalId") as string;
  if (!goalId) return;
  const services = createServices(await createClient());
  await services.goalService.archiveGoal(goalId).catch(() => null);
  revalidatePath("/goals");
  revalidatePath("/overview");
}
