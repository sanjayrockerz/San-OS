/**
 * Schema-parity check against the live Supabase project (Phase 5A).
 *
 * Uses ONLY the public anon key (RLS-protected) from .env.local — never the
 * service-role key. For each expected table it probes PostgREST:
 *   - table existence:  GET /rest/v1/<table>?select=<firstCol>&limit=0
 *                       200            -> table exists (rows hidden by RLS)
 *                       404 / PGRST205 -> table MISSING (migration not applied)
 *   - column existence: GET /rest/v1/<table>?select=<col,col,...>&limit=0
 *                       200 -> every listed column exists
 *                       400 / PGRST204 -> at least one column is MISSING
 *                       (i.e. an ALTER-TABLE migration like 0012 is behind)
 *
 * What this CANNOT see over REST with the anon key: indexes, foreign keys, RLS
 * policy bodies, and helper functions. Those live below PostgREST. They are
 * exercised end-to-end by scripts/verify-engine.mjs (which writes real rows and
 * relies on FKs/RLS/triggers actually being present) and asserted at apply time
 * in the SQL editor. This script's job is schema parity: are the tables and the
 * exact columns the code writes to actually there?
 *
 * Report legend:  ✅ ok   ❌ missing   ⚠ schema mismatch (table ok, column gap)
 * Exit code: 0 when everything matches, non-zero otherwise.
 *
 * Run: node scripts/verify-db.mjs
 */
import { config } from "dotenv";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anon) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / ANON_KEY in .env.local");
  process.exit(1);
}

/**
 * Expected schema: table -> the columns the application code actually writes to
 * or reads by name. We don't list every column — just enough to detect that a
 * given migration was applied. New columns from later migrations are the most
 * valuable probes (they catch a DB that has the table but not the ALTER).
 */
const SCHEMA = {
  // ---- Phase 3 (0001–0003): core ----
  users_profile: ["id", "display_name"],
  topics: ["id", "slug", "name", "user_id", "source", "status"], // user_id/source/status added by 0012
  patterns: ["id", "slug", "name", "user_id", "source", "status"], // 0012
  problems: ["id", "user_id", "title", "platform", "difficulty"],
  problem_attempts: ["id", "user_id", "problem_id", "time_taken_seconds", "solve_status"],
  problem_reflections: ["id", "user_id", "problem_id", "attempt_id", "final_takeaway"],
  problem_code_versions: ["id", "user_id", "problem_id", "language", "code", "is_final"],
  revision_queue: ["id", "user_id", "problem_id", "current_state", "next_revision", "success_count", "failure_count"],

  // ---- Phase 4 (0004): knowledge ----
  concept_notes: ["id", "user_id", "title", "status", "category"],
  concept_resources: ["id", "user_id", "concept_id", "type"],
  concept_problems: ["id", "user_id", "concept_id", "problem_id"],

  // ---- Phase 4 (0005): roadmaps ----
  roadmaps: ["id", "user_id", "kind", "title"],
  roadmap_items: ["id", "roadmap_id", "parent_item_id", "problem_id", "order_index", "is_section"],
  roadmap_progress: ["id", "user_id", "roadmap_id", "item_id", "status", "completed_at"],

  // ---- Phase 4 (0006): activity ----
  activity_logs: ["id", "user_id", "type", "entity_type", "entity_id"],
  study_sessions: ["id", "user_id", "started_at"],
  daily_logs: ["id", "user_id", "log_date", "problems_solved", "revisions_done"],

  // ---- Phase 4 (0007): iit ----
  iit_courses: ["id", "user_id", "name", "status"],
  iit_assignments: ["id", "user_id", "course_id", "status", "due_date"],
  iit_lectures: ["id", "user_id", "course_id", "status"],
  academic_documents: ["id", "user_id", "type"],

  // ---- Phase 4 (0008): ai ----
  ai_daily_briefs: ["id", "user_id", "brief_date"],
  ai_insights: ["id", "user_id", "type", "is_dismissed"],

  // ---- Phase 5 (0011): events ----
  events: ["id", "user_id", "event_type", "entity_type", "entity_id", "payload", "created_at"],

  // ---- Phase 5 (0012): dynamic taxonomy ----
  taxonomy_usage: ["id", "user_id", "entity_type", "entity_id", "usage_count", "last_used_at", "relevance_score"],
};

async function probe(table, columns) {
  const select = encodeURIComponent(columns.join(","));
  let res;
  try {
    res = await fetch(`${url}/rest/v1/${table}?select=${select}&limit=0`, {
      headers: { apikey: anon, Authorization: `Bearer ${anon}` },
    });
  } catch (err) {
    return { state: "missing", detail: `network error: ${err.message}` };
  }

  if (res.status === 200) return { state: "ok" };

  // Distinguish "table missing" from "column missing" via the PostgREST code.
  let body = {};
  try {
    body = await res.json();
  } catch {
    /* non-JSON body */
  }
  const code = body?.code ?? "";
  const msg = body?.message ?? `HTTP ${res.status}`;

  // PGRST205 = relation not found; 404 = same. Column problems surface as
  // PGRST204 / 42703 with a 400.
  if (res.status === 404 || code === "PGRST205") {
    return { state: "missing", detail: msg };
  }
  return { state: "mismatch", detail: msg };
}

const icon = { ok: "✅", missing: "❌", mismatch: "⚠ " };

console.log(`\nSanOS schema verification  →  ${url}`);
console.log("─".repeat(72));

let missing = 0;
let mismatch = 0;

for (const [table, columns] of Object.entries(SCHEMA)) {
  const { state, detail } = await probe(table, columns);
  if (state === "missing") missing++;
  if (state === "mismatch") mismatch++;
  const line = `${icon[state]} ${table.padEnd(24)}`;
  console.log(state === "ok" ? line : `${line} ${detail}`);
}

console.log("─".repeat(72));
const tableCount = Object.keys(SCHEMA).length;
const okCount = tableCount - missing - mismatch;
console.log(`${okCount}/${tableCount} ok   ${missing} missing   ${mismatch} mismatch`);

if (missing || mismatch) {
  console.log(
    "\nSchema is behind the code. Apply " +
      "database/migrations/_production_bundle_phase5.sql in the Supabase SQL " +
      "Editor, then re-run this script.",
  );
  process.exit(2);
}
console.log("\nSchema parity OK — every expected table and column is present.");
process.exit(0);
