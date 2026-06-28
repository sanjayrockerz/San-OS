"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createServices, StudentIntelligenceCoreService } from "@/lib/services";
import { createInvoiceSchema } from "@/lib/validators/business";
import { uuidSchema } from "@/lib/validators/common";

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

function revalidate() {
  revalidatePath("/invoices");
  revalidatePath("/finance");
  revalidatePath("/overview");
}

export async function createInvoice(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser("/invoices");

  const description = String(formData.get("description") ?? "Services rendered");
  const quantity = Number(formData.get("quantity") ?? 1);
  const unitPrice = Number(formData.get("unit_price") ?? 0);
  const totalAmount = quantity * unitPrice;

  const raw = {
    client_id: formData.get("client_id"),
    project_id: formData.get("project_id") || null,
    invoice_number: formData.get("invoice_number"),
    line_items: [{ description, quantity, unitPrice }],
    total_amount: totalAmount,
    currency: formData.get("currency") || "INR",
    status: "draft",
    due_date: formData.get("due_date") || null,
  };

  const parsed = createInvoiceSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const services = createServices(await createClient());
  try {
    const invoice = await services.invoice.create(user.id, parsed.data);
    StudentIntelligenceCoreService.invalidate(user.id);
    revalidate();
    return { ok: true, id: invoice.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to create invoice" };
  }
}

export async function sendInvoice(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser("/invoices");
  const id = uuidSchema.safeParse(formData.get("invoiceId"));
  if (!id.success) return { ok: false, error: "Invalid invoice" };

  const services = createServices(await createClient());
  try {
    await services.invoice.send(user.id, id.data);
    revalidate();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to send invoice" };
  }
}

export async function markInvoicePaid(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser("/invoices");
  const id = uuidSchema.safeParse(formData.get("invoiceId"));
  if (!id.success) return { ok: false, error: "Invalid invoice" };

  const services = createServices(await createClient());
  try {
    await services.invoice.markPaid(user.id, id.data);
    StudentIntelligenceCoreService.invalidate(user.id);
    revalidate();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to mark invoice paid" };
  }
}

export async function cancelInvoice(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser("/invoices");
  const id = uuidSchema.safeParse(formData.get("invoiceId"));
  if (!id.success) return { ok: false, error: "Invalid invoice" };

  const services = createServices(await createClient());
  try {
    await services.invoice.cancel(user.id, id.data);
    revalidate();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to cancel invoice" };
  }
}
