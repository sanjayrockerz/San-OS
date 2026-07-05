"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createServices } from "@/lib/services";
import type { PlannerProvider } from "@/lib/execution/planner-provider";

export type ActionResult = { ok: true } | { ok: false; error: string };

export type InboxActionResult =
  | {
      ok: true;
      kind: "planning" | "completion";
      message: string;
      confidence: number;
      detectedItems: number;
      needsClarification?: false;
      choices?: number[];
    }
  | {
      ok: false;
      error: string;
      needsClarification?: boolean;
      choices?: number[];
      message?: string;
    };

export async function startFocusSession(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult & { sessionId?: string }> {
  const user = await requireUser("/overview");
  const title = formData.get("title") as string | null;
  const plannedMinutes = Number(formData.get("plannedMinutes") ?? 25);

  const services = createServices(await createClient());
  try {
    const session = await services.executionEngine.startFocusSession(
      user.id,
      title ?? "Focus Session",
      plannedMinutes,
    );
    return { ok: true, sessionId: (session as any).id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to start session" };
  }
}

export async function completeFocusSession(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireUser("/overview");
  const sessionId = formData.get("sessionId") as string;
  const actualMinutes = Number(formData.get("actualMinutes") ?? 0);
  const interruptions = Number(formData.get("interruptions") ?? 0);

  if (!sessionId) return { ok: false, error: "No session ID" };

  const services = createServices(await createClient());
  try {
    await services.executionEngine.completeFocusSession(sessionId, actualMinutes, interruptions);
    revalidatePath("/overview");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to complete session" };
  }
}

export async function createTimeBlock(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser("/overview");
  const title = formData.get("title") as string;
  const domain = (formData.get("domain") as string) ?? "personal";
  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;
  const estimatedMinutes = Number(formData.get("estimatedMinutes") ?? 60);

  if (!title || !startTime || !endTime) {
    return { ok: false, error: "Title, start time and end time are required" };
  }

  const today = new Date().toISOString().slice(0, 10);
  const services = createServices(await createClient());
  try {
    await services.repos.timeBlocks.create({
      user_id: user.id,
      title,
      domain,
      date: today,
      start_time: startTime,
      end_time: endTime,
      estimated_minutes: estimatedMinutes,
    });
    revalidatePath("/overview");
    revalidatePath("/execution");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to create block" };
  }
}

export async function updateBlockStatus(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser("/overview");
  const blockId = formData.get("blockId") as string;
  const action = formData.get("action") as "start" | "complete" | "skip";

  if (!blockId || !action) return { ok: false, error: "Invalid input" };

  const services = createServices(await createClient());
  try {
    if (action === "start") {
      await services.executionEngine.startBlock(user.id, blockId);
    } else if (action === "complete") {
      const actualMinutes = Number(formData.get("actualMinutes") ?? 60);
      await services.executionEngine.completeBlock(user.id, blockId, actualMinutes);
    } else {
      await services.executionEngine.skipBlock(blockId);
    }
    revalidatePath("/overview");
    revalidatePath("/execution");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to update block" };
  }
}

export type PlannerPhase = "tomorrow" | "morning" | "replan" | "review";

export async function runPlannerPhase(
  _prev: (ActionResult & { message?: string }) | null,
  formData: FormData,
): Promise<ActionResult & { message?: string }> {
  const user = await requireUser("/overview");
  const phase = formData.get("phase") as PlannerPhase;

  const services = createServices(await createClient());
  // Depend on the PlannerProvider contract, not the concrete engine (§ provider-based).
  const planner: PlannerProvider = services.dailyPlanner;
  try {
    let message: string;
    switch (phase) {
      case "tomorrow":
        message = (await planner.generateTomorrowPlan(user.id)).message;
        break;
      case "morning":
        message = (await planner.applyMorningAdjustment(user.id)).message;
        break;
      case "replan":
        message = (await planner.replanRemainder(user.id)).message;
        break;
      case "review": {
        const { review, tomorrow } = await planner.generateEndOfDayReview(user.id);
        message = `${(review as any).review_notes ?? "Day reviewed."} Tomorrow: ${(tomorrow as any).plan.focus_theme ?? "open"}.`;
        break;
      }
      default:
        return { ok: false, error: "Unknown planner phase" };
    }
    revalidatePath("/execution");
    revalidatePath("/overview");
    return { ok: true, message };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Planner failed" };
  }
}

export async function brainDump(
  _prev: (ActionResult & { created?: number }) | null,
  formData: FormData,
): Promise<ActionResult & { created?: number }> {
  const user = await requireUser("/overview");
  const raw = (formData.get("raw") as string | null)?.trim();

  if (!raw) return { ok: false, error: "Paste something to parse" };

  const services = createServices(await createClient());
  try {
    const { created } = await services.executionEngine.captureBrainDump(user.id, raw);
    if (created === 0) return { ok: false, error: "Nothing parseable found" };
    revalidatePath("/execution");
    revalidatePath("/overview");
    return { ok: true, created };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to parse brain dump" };
  }
}

export async function quickCapture(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser("/overview");
  const content = (formData.get("content") as string | null)?.trim();
  const type = (formData.get("type") as string) ?? "idea";

  if (!content) return { ok: false, error: "Content required" };

  const services = createServices(await createClient());
  try {
    await services.repos.captureItems.create({
      user_id: user.id,
      content,
      type: type as "idea" | "task" | "note" | "link" | "code" | "meeting",
    });
    revalidatePath("/execution");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to capture" };
  }
}

export async function processDailyInbox(
  _prev: InboxActionResult | null,
  formData: FormData,
): Promise<InboxActionResult> {
  const user = await requireUser("/overview");
  const raw = (formData.get("raw") as string | null)?.trim();
  const minutesValue = formData.get("minutes");
  const minutes = typeof minutesValue === "string" && minutesValue.trim().length > 0 ? Number(minutesValue) : null;

  if (!raw) return { ok: false, error: "Paste something into the inbox" };

  const services = createServices(await createClient());
  try {
    const result = await services.naturalLanguagePlanning.processInboxEntry(user.id, raw, {
      minutes: Number.isNaN(minutes as number) ? null : minutes,
    });

    if (result.kind === "clarification" && result.clarification) {
      return {
        ok: false,
        error: result.message,
        needsClarification: true,
        choices: result.clarification.choices,
        message: result.message,
      };
    }

    revalidatePath("/execution");
    revalidatePath("/overview");
    return {
      ok: true,
      kind: result.kind as "planning" | "completion",
      message: result.message,
      confidence: result.confidence,
      detectedItems: result.detectedItems,
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to process inbox" };
  }
}
