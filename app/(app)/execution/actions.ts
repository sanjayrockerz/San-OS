"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createServices } from "@/lib/services";

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
    return { ok: true, sessionId: session.id };
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

import type { DraftPlannerResult } from "@/lib/services/daily-planner.service";
import { timeToMinutes } from "@/lib/execution/scheduler";

type PlannerActionFailure = { ok: false; error: string };
type PlannerDraftSuccess =
  | {
      ok: true;
      draft: DraftPlannerResult;
      conversationalMessage?: string;
    }
  | {
      ok: true;
      message: string;
    };
type PlannerDraftActionResult = PlannerDraftSuccess | PlannerActionFailure;
type PlannerCommitActionResult = { ok: true; message: string } | PlannerActionFailure;

export async function draftPlannerPhase(
  _prev: PlannerDraftActionResult | null,
  formData: FormData,
): Promise<PlannerDraftActionResult> {
  const user = await requireUser("/overview");
  const phase = formData.get("phase") as PlannerPhase;
  const context = (formData.get("context") as string | null)?.trim();

  const services = createServices(await createClient());
  
  if (context) {
    await services.executionEngine.captureBrainDump(user.id, context);
  }

  const planner = services.dailyPlanner;
  try {
    if (phase === "morning") {
      const draft = await planner.draftMorningAdjustment(user.id);
      
      let conversationalMessage = "I've organized this for you. How does this look?";
      if (draft.scheduled.length > 0) {
        const first = draft.scheduled[0];
        const second = draft.scheduled.length > 1 ? draft.scheduled[1] : null;
        
        const formatTime = (mins: number) => {
          const h = Math.floor(mins / 60);
          const m = mins % 60;
          const ampm = h >= 12 ? 'PM' : 'AM';
          const hr12 = h % 12 || 12;
          return `${hr12}:${m.toString().padStart(2, '0')} ${ampm}`;
        };
        
        conversationalMessage = `I've organized this for you. Can we plan '${first.title}' by ${formatTime(first.startMinutes)}${second ? ` and '${second.title}' by ${formatTime(second.startMinutes)}` : ''}?`;
      }
      
      return { ok: true, draft, conversationalMessage };
    }
    
    // Fallbacks for the other phases (they just execute immediately for now)
    let message: string;
    switch (phase) {
      case "tomorrow":
        message = (await planner.generateTomorrowPlan(user.id)).message;
        break;
      case "replan":
        message = (await planner.replanRemainder(user.id)).message;
        break;
      case "review": {
        const { review, tomorrow } = await planner.generateEndOfDayReview(user.id);
        message = `${review.review_notes ?? "Day reviewed."} Tomorrow: ${tomorrow.plan.focus_theme ?? "open"}.`;
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

export async function commitPlannerPhase(
  _prev: PlannerCommitActionResult | null,
  formData: FormData,
): Promise<PlannerCommitActionResult> {
  const user = await requireUser("/overview");
  const draftJson = formData.get("draft") as string;
  if (!draftJson) return { ok: false, error: "Missing draft plan data" };
  
  try {
    const draft = JSON.parse(draftJson) as DraftPlannerResult;
    
    // We need to apply any modified timings from formData
    const scheduled = draft.scheduled.map((task, i) => {
      const startStr = formData.get(`start_${i}`) as string;
      const endStr = formData.get(`end_${i}`) as string;
      if (startStr && endStr) {
        return {
          ...task,
          startMinutes: timeToMinutes(startStr + ":00"),
          endMinutes: timeToMinutes(endStr + ":00"),
        };
      }
      return task;
    });

    const services = createServices(await createClient());
    const result = await services.dailyPlanner.commitSchedule(
      user.id,
      draft.date,
      scheduled,
      { phase: draft.phase, status: "active" },
      draft.unscheduledCount
    );

    revalidatePath("/execution");
    revalidatePath("/overview");
    return { ok: true, message: result.message };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to commit plan" };
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
