"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createServices, StudentIntelligenceCoreService } from "@/lib/services";
import { createExpenseEntrySchema, createIncomeEntrySchema } from "@/lib/validators/business";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function recordIncome(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser("/finance");

  const parsed = createIncomeEntrySchema.safeParse({
    amount: Number(formData.get("amount") ?? 0),
    category: formData.get("category") || "project_revenue",
    description: formData.get("description") || null,
    received_at: formData.get("received_at") || undefined,
    client_id: formData.get("client_id") || null,
    project_id: formData.get("project_id") || null,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const services = createServices(await createClient());
  try {
    await services.finance.recordIncome(user.id, parsed.data);
    StudentIntelligenceCoreService.invalidate(user.id);
    revalidatePath("/finance");
    revalidatePath("/overview");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to record income" };
  }
}

export async function recordExpense(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser("/finance");

  const parsed = createExpenseEntrySchema.safeParse({
    amount: Number(formData.get("amount") ?? 0),
    category: formData.get("category") || "other",
    description: formData.get("description") || null,
    occurred_at: formData.get("occurred_at") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const services = createServices(await createClient());
  try {
    await services.finance.recordExpense(user.id, parsed.data);
    StudentIntelligenceCoreService.invalidate(user.id);
    revalidatePath("/finance");
    revalidatePath("/overview");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to record expense" };
  }
}
