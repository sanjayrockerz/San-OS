"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";
import { createServices, DashboardAggregationService } from "@/lib/services";
import { Constants } from "@/types/database";

const PLATFORMS = [
  "leetcode",
  "codeforces",
  "hackerrank",
  "codechef",
  "geeksforgeeks",
  "atcoder",
  "interviewbit",
  "other",
] as const;

const DIFFICULTIES = ["easy", "medium", "hard"] as const;

const createProblemSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  url: z.string().trim().url("Must be a valid URL").or(z.literal("")).optional(),
  platform: z.enum(PLATFORMS).default("leetcode"),
  difficulty: z.enum(DIFFICULTIES).optional(),
  topic_id: z.string().uuid().optional().or(z.literal("")),
  pattern_id: z.string().uuid().optional().or(z.literal("")),
  estimated_minutes: z.coerce.number().int().positive().max(600).optional(),
});

export type ActionResult = { ok: true } | { ok: false; error: string };

/** Creates a user-authored problem from the Add Problem form. */
export async function createProblem(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser("/problems");

  const parsed = createProblemSchema.safeParse({
    title: formData.get("title"),
    url: formData.get("url") ?? "",
    platform: formData.get("platform") || "leetcode",
    difficulty: formData.get("difficulty") || undefined,
    topic_id: formData.get("topic_id") || "",
    pattern_id: formData.get("pattern_id") || "",
    estimated_minutes: formData.get("estimated_minutes") || undefined,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const v = parsed.data;
  const supabase = await createClient();
  const services = createServices(supabase);

  try {
    await services.problems.create(user.id, {
      title: v.title,
      url: v.url ? v.url : null,
      platform: v.platform,
      difficulty: v.difficulty ?? null,
      topic_id: v.topic_id ? v.topic_id : null,
      pattern_id: v.pattern_id ? v.pattern_id : null,
      estimated_minutes: v.estimated_minutes ?? null,
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to save" };
  }

  revalidatePath("/problems");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Add Learning Entry — the full DSA workflow that drives the Problem Engine.
// ---------------------------------------------------------------------------

const E = Constants.public.Enums;

/** A FormData checkbox is present (`"on"`) only when ticked. */
function checked(form: FormData, name: string): boolean {
  const v = form.get(name);
  return v === "on" || v === "true" || v === "1";
}

function str(form: FormData, name: string): string | undefined {
  const v = form.get(name);
  const s = typeof v === "string" ? v.trim() : "";
  return s.length > 0 ? s : undefined;
}

const learningEntrySchema = z.object({
  // Metadata
  title: z.string().trim().min(1, "Title is required").max(200),
  platform: z.enum(E.problem_platform).default("leetcode"),
  url: z.string().trim().url("Must be a valid URL").optional(),
  difficulty: z.enum(E.difficulty_level).optional(),
  topic_id: z.uuid().optional(),
  pattern_id: z.uuid().optional(),
  language: z.string().trim().max(40).optional(),
  timeTakenMinutes: z.coerce.number().int().min(0).max(100000).optional(),
  confidence: z.coerce.number().int().min(1).max(5).optional(),
  solveStatus: z.enum(E.solve_status).default("solved"),
  // Cognitive pipeline (booleans)
  understoodStatement: z.boolean(),
  identifiedPattern: z.boolean(),
  derivedAlgorithm: z.boolean(),
  wrotePseudocode: z.boolean(),
  codedIndependently: z.boolean(),
  syntaxError: z.boolean(),
  runtimeError: z.boolean(),
  logicError: z.boolean(),
  comparedWithOptimal: z.boolean(),
  // Reflection
  myExplanation: z.string().trim().max(20000).optional(),
  algorithmInWords: z.string().trim().max(20000).optional(),
  bugThatStoppedMe: z.string().trim().max(5000).optional(),
  finalTakeaway: z.string().trim().max(5000).optional(),
  // Code vault
  code: z.string().max(100000).optional(),
  codeLanguage: z.string().trim().max(40).optional(),
});

/**
 * Creates a complete DSA learning entry and runs the Problem Engine in one
 * server roundtrip:
 *   create problem → record attempt → reflection → code version →
 *   schedule revision → fan out to roadmaps → activity log → daily counters.
 * On success, redirects to the problem's detail workspace.
 */
export async function createLearningEntry(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser("/problems/new");

  const parsed = learningEntrySchema.safeParse({
    title: formData.get("title"),
    platform: formData.get("platform") || "leetcode",
    url: str(formData, "url"),
    difficulty: str(formData, "difficulty"),
    topic_id: str(formData, "topic_id"),
    pattern_id: str(formData, "pattern_id"),
    language: str(formData, "language"),
    timeTakenMinutes: str(formData, "timeTakenMinutes"),
    confidence: str(formData, "confidence"),
    solveStatus: formData.get("solveStatus") || "solved",
    understoodStatement: checked(formData, "understoodStatement"),
    identifiedPattern: checked(formData, "identifiedPattern"),
    derivedAlgorithm: checked(formData, "derivedAlgorithm"),
    wrotePseudocode: checked(formData, "wrotePseudocode"),
    codedIndependently: checked(formData, "codedIndependently"),
    syntaxError: checked(formData, "syntaxError"),
    runtimeError: checked(formData, "runtimeError"),
    logicError: checked(formData, "logicError"),
    comparedWithOptimal: checked(formData, "comparedWithOptimal"),
    myExplanation: str(formData, "myExplanation"),
    algorithmInWords: str(formData, "algorithmInWords"),
    bugThatStoppedMe: str(formData, "bugThatStoppedMe"),
    finalTakeaway: str(formData, "finalTakeaway"),
    code: str(formData, "code"),
    codeLanguage: str(formData, "codeLanguage"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const v = parsed.data;
  const supabase = await createClient();
  const services = createServices(supabase);

  let problemId: string;
  try {
    const problem = await services.problems.create(user.id, {
      title: v.title,
      platform: v.platform,
      url: v.url ?? null,
      difficulty: v.difficulty ?? null,
      topic_id: v.topic_id ?? null,
      pattern_id: v.pattern_id ?? null,
    });
    problemId = problem.id;

    const hasReflection = Boolean(
      v.myExplanation ||
        v.algorithmInWords ||
        v.bugThatStoppedMe ||
        v.finalTakeaway,
    );
    const hasCode = Boolean(v.code);

    await services.problems.recordSolve(user.id, {
      problemId,
      language: v.language ?? null,
      timeTakenSeconds:
        v.timeTakenMinutes != null ? v.timeTakenMinutes * 60 : null,
      solveStatus: v.solveStatus,
      confidence: v.confidence ?? null,
      editorialUsed: v.comparedWithOptimal,
      journey: {
        understoodStatement: v.understoodStatement,
        identifiedPattern: v.identifiedPattern,
        derivedAlgorithm: v.derivedAlgorithm,
        wrotePseudocode: v.wrotePseudocode,
        codedIndependently: v.codedIndependently,
        syntaxError: v.syntaxError,
        runtimeError: v.runtimeError,
        logicError: v.logicError,
      },
      reflection: hasReflection
        ? {
            myExplanation: v.myExplanation ?? null,
            algorithmInWords: v.algorithmInWords ?? null,
            bugThatStoppedMe: v.bugThatStoppedMe ?? null,
            finalTakeaway: v.finalTakeaway ?? null,
          }
        : undefined,
      code: hasCode
        ? {
            language: v.codeLanguage || v.language || "text",
            code: v.code!,
            isFinal: true,
          }
        : undefined,
    });
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to save entry",
    };
  }

  // Keep the per-user taxonomy alive: re-rank topics/patterns from this fresh
  // attempt and mine any emergent ones. evolve() is idempotent and self-healing
  // (it recomputes from the source of truth), so running it on every solve is
  // safe. Fail-soft: taxonomy growth must never block saving the entry, and it
  // no-ops gracefully until migration 0012 (dynamic taxonomy) is applied.
  try {
    await services.taxonomy.evolve(user.id);
  } catch {
    // best-effort; the next solve (or a nightly job) will catch up
  }

  try {
    await services.memoryIntelligence.evolve(user.id);
  } catch {
    // best-effort; recall strength stays stale until the next solve/revision
  }

  try {
    await services.context.touch(user.id, {
      active_entity_type: "problem",
      active_entity_id: problemId,
      active_session_type: "solve",
      pending_action: "write_reflection",
    });
    await DashboardAggregationService.invalidate(user.id);
  } catch {
    // best effort
  }

  revalidatePath("/problems");
  revalidatePath("/overview");
  redirect(`/problems/${problemId}?prompt=after-solve`);
}

/** Records a solve attempt for a problem (status = solved) and its side effects. */
export async function markSolved(problemId: string): Promise<ActionResult> {
  const user = await requireUser("/problems");
  const supabase = await createClient();
  const services = createServices(supabase);

  try {
    await services.problems.recordSolve(user.id, {
      problemId,
      solveStatus: "solved",
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to record" };
  }

  try {
    await services.context.touch(user.id, {
      active_entity_type: "problem",
      active_entity_id: problemId,
      active_session_type: "solve",
    });
    await DashboardAggregationService.invalidate(user.id);
  } catch {
    // best effort
  }

  revalidatePath("/problems");
  revalidatePath("/overview");
  return { ok: true };
}
