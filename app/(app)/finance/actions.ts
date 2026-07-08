"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createServices, StudentIntelligenceCoreService } from "@/lib/services";
import { createExpenseEntrySchema, createIncomeEntrySchema } from "@/lib/validators/business";

export type ActionResult = { ok: true } | { ok: false; error: string };
export type FinanceNoteResult =
  | {
      ok: true;
      message: string;
      created: number;
      income: number;
      expense: number;
      net: number;
    }
  | { ok: false; error: string };

const INCOME_HINTS = /\b(got|received|earned|collected|credited|refund(?:ed)?|deposit(?:ed)?|sold|paid by|from)\b/i;
const EXPENSE_HINTS = /\b(gave|paid|spent|bought|sent|transferred|lent|purchase(?:d)?|reimbursed|to)\b/i;

function normaliseAmount(amountText: string): number {
  const compact = amountText.toLowerCase().replace(/[,\s₹]/g, "");
  const match = compact.match(/^(\d+(?:\.\d+)?)(k|m|l|lac|lakh|cr|crore)?$/i);
  if (!match) return Number(compact);

  const base = Number(match[1] ?? 0);
  const suffix = (match[2] ?? "").toLowerCase();
  const multiplier =
    suffix === "k"
      ? 1_000
      : suffix === "m"
        ? 1_000_000
        : suffix === "l" || suffix === "lac" || suffix === "lakh"
          ? 100_000
          : suffix === "cr" || suffix === "crore"
            ? 10_000_000
            : 1;
  return base * multiplier;
}

function splitFinanceClauses(raw: string): string[] {
  return raw
    .replace(/\s+(?:and then|then)\s+/gi, ".")
    .split(/[\n.;]+/g)
    .flatMap((line) => line.split(/\s+\band\b\s+/i))
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseFinanceClause(clause: string): { kind: "income" | "expense"; amount: number; description: string; category: string } | null {
  const amountMatch = clause.match(/(?:₹|rs\.?|inr)?\s*([0-9][0-9,]*(?:\.[0-9]+)?(?:\s*(?:k|m|l|lac|lakh|cr|crore))?)/i);
  if (!amountMatch) return null;

  const amount = normaliseAmount(amountMatch[1] ?? "");
  if (!Number.isFinite(amount) || amount <= 0) return null;

  const incomeScore = (clause.match(INCOME_HINTS)?.length ?? 0) + (/\bfrom\b/i.test(clause) ? 1 : 0);
  const expenseScore = (clause.match(EXPENSE_HINTS)?.length ?? 0) + (/\bto\b/i.test(clause) ? 1 : 0);
  const kind: "income" | "expense" = incomeScore >= expenseScore ? "income" : "expense";
  const lower = clause
    .replace(amountMatch[0], "")
    .replace(/\b(₹|rs\.?|inr)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  const description = lower || clause;
  const category = kind === "income" ? "other_income" : "other";

  return { kind, amount, description, category };
}

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

export async function recordFinanceNote(
  _prev: FinanceNoteResult | null,
  formData: FormData,
): Promise<FinanceNoteResult> {
  const user = await requireUser("/finance");
  const raw = (formData.get("raw") as string | null)?.trim();
  if (!raw) return { ok: false, error: "Type a finance note first" };

  const clauses = splitFinanceClauses(raw);
  const parsed = clauses.map(parseFinanceClause).filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
  if (parsed.length === 0) return { ok: false, error: "I couldn't detect an income or expense amount" };

  const services = createServices(await createClient());
  let income = 0;
  let expense = 0;

  try {
    const today = new Date().toISOString().slice(0, 10);
    for (const entry of parsed) {
      if (entry.kind === "income") {
        income += entry.amount;
        await services.finance.recordIncome(user.id, {
          amount: entry.amount,
          currency: "INR",
          category: entry.category,
          description: entry.description,
          received_at: today,
          client_id: null,
          project_id: null,
          invoice_id: null,
        });
      } else {
        expense += entry.amount;
        await services.finance.recordExpense(user.id, {
          amount: entry.amount,
          currency: "INR",
          category: entry.category,
          description: entry.description,
          occurred_at: today,
        });
      }
    }

    StudentIntelligenceCoreService.invalidate(user.id);
    revalidatePath("/finance");
    revalidatePath("/overview");

    const net = income - expense;
    return {
      ok: true,
      created: parsed.length,
      income,
      expense,
      net,
      message: `Recorded ${parsed.length} transaction${parsed.length === 1 ? "" : "s"} from your text. Net ${net >= 0 ? "+" : "-"}₹${Math.abs(net).toLocaleString("en-IN")}.`,
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to record finance note" };
  }
}
