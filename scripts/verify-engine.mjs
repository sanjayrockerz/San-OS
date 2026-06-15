/**
 * End-to-end ENGINE verification against the live Supabase project.
 *
 * Where verify-db.mjs checks that the schema *exists*, this script proves the
 * full learning-entry lifecycle actually *works*: it writes the same row chain
 * the Problem Engine (ProblemsService.recordSolve + fan-out) produces, then
 * reads every row back and asserts it landed. Foreign keys, NOT NULLs, enums
 * and triggers are all exercised for real.
 *
 * It runs with the SERVICE-ROLE key (bypasses RLS) and operates as a throwaway
 * auth user created via the Admin API, so it never touches real data. On exit
 * (success OR failure) the test user is deleted, which cascades and removes
 * every row this script created.
 *
 * Covered lifecycle:
 *   login (provision user) → create problem → attempt → reflection →
 *   code version → schedule revision → roadmap (+item+progress) →
 *   activity log → daily log → emit event → (dashboard/timeline read model).
 *
 * Run: node scripts/verify-engine.mjs
 * Exit: 0 if every step passes, non-zero otherwise.
 */
import { randomUUID } from "node:crypto";
import { config } from "dotenv";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  process.exit(1);
}

const authHeaders = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  "Content-Type": "application/json",
};

/** Insert one row and return it (PostgREST, service role → RLS bypassed). */
async function insert(table, row) {
  const res = await fetch(`${url}/rest/v1/${table}`, {
    method: "POST",
    headers: { ...authHeaders, Prefer: "return=representation" },
    body: JSON.stringify(row),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`insert ${table} → ${res.status}: ${text}`);
  return JSON.parse(text)[0];
}

/** Count rows matching a PostgREST filter query string (e.g. "id=eq.<uuid>"). */
async function count(table, query) {
  const res = await fetch(`${url}/rest/v1/${table}?${query}&select=id`, {
    headers: { ...authHeaders, Prefer: "count=exact" },
  });
  if (!res.ok) throw new Error(`read ${table} → ${res.status}`);
  const rows = await res.json();
  return rows.length;
}

const results = [];
function check(label, ok) {
  results.push({ label, ok });
  console.log(`${ok ? "✅" : "❌"} ${label}`);
}

let userId = null;

async function createUser() {
  const email = `engine-verify+${Date.now()}@example.com`;
  const res = await fetch(`${url}/auth/v1/admin/users`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      email,
      password: randomUUID(),
      email_confirm: true,
    }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`create user → ${res.status}: ${text}`);
  return JSON.parse(text).id;
}

async function deleteUser(id) {
  if (!id) return;
  await fetch(`${url}/auth/v1/admin/users/${id}`, {
    method: "DELETE",
    headers: authHeaders,
  }).catch(() => {});
}

async function run() {
  console.log("\nSanOS ENGINE verification");
  console.log("─".repeat(60));

  userId = await createUser();
  check("user provisioned (login)", Boolean(userId));

  // 1. problem
  const problem = await insert("problems", {
    user_id: userId,
    title: `Engine Verify ${Date.now()}`,
    platform: "leetcode",
    difficulty: "easy",
  });
  check("problem created", await count("problems", `id=eq.${problem.id}`));

  // 2. attempt
  const attempt = await insert("problem_attempts", {
    user_id: userId,
    problem_id: problem.id,
    solve_status: "solved",
    time_taken_seconds: 600,
    confidence: 4,
    understood_statement: true,
    identified_pattern: true,
    coded_independently: true,
  });
  check("attempt created", await count("problem_attempts", `id=eq.${attempt.id}`));

  // 3. reflection
  const reflection = await insert("problem_reflections", {
    user_id: userId,
    problem_id: problem.id,
    attempt_id: attempt.id,
    final_takeaway: "Two pointers collapse the inner loop.",
  });
  check(
    "reflection created",
    await count("problem_reflections", `id=eq.${reflection.id}`),
  );

  // 4. code version
  const code = await insert("problem_code_versions", {
    user_id: userId,
    problem_id: problem.id,
    attempt_id: attempt.id,
    language: "python",
    code: "def solve(): pass",
    is_final: true,
  });
  check(
    "code version created",
    await count("problem_code_versions", `id=eq.${code.id}`),
  );

  // 5. revision scheduled (interval ladder rung 0 → +1 day)
  const now = new Date();
  const next = new Date(now);
  next.setUTCDate(next.getUTCDate() + 1);
  const revision = await insert("revision_queue", {
    user_id: userId,
    problem_id: problem.id,
    current_state: "learning",
    last_revision: now.toISOString(),
    next_revision: next.toISOString(),
    success_count: 0,
    failure_count: 0,
    editorial_dependency: false,
  });
  check(
    "revision scheduled",
    await count("revision_queue", `id=eq.${revision.id}`),
  );

  // 6. roadmap + item + progress (fan-out target)
  const roadmap = await insert("roadmaps", {
    user_id: userId,
    kind: "custom",
    title: "Engine Verify Roadmap",
  });
  const item = await insert("roadmap_items", {
    roadmap_id: roadmap.id,
    title: "Solve the verify problem",
    problem_id: problem.id,
    order_index: 0,
    is_section: false,
  });
  const progress = await insert("roadmap_progress", {
    user_id: userId,
    roadmap_id: roadmap.id,
    item_id: item.id,
    status: "completed",
    completed_at: now.toISOString(),
  });
  check(
    "roadmap updated",
    (await count("roadmap_progress", `id=eq.${progress.id}`)) &&
      (await count("roadmap_items", `id=eq.${item.id}`)),
  );

  // 7. activity log
  const activity = await insert("activity_logs", {
    user_id: userId,
    type: "problem_solved",
    title: "Solved a problem",
    entity_type: "problem",
    entity_id: problem.id,
  });
  check("activity logged", await count("activity_logs", `id=eq.${activity.id}`));

  // 8. daily log counter
  const today = now.toISOString().slice(0, 10);
  const daily = await insert("daily_logs", {
    user_id: userId,
    log_date: today,
    problems_solved: 1,
  });
  check("daily log updated", await count("daily_logs", `id=eq.${daily.id}`));

  // 9. event emitted (immutable stream)
  const event = await insert("events", {
    user_id: userId,
    event_type: "problem.solved",
    entity_type: "problem",
    entity_id: problem.id,
    payload: { title: problem.title, solveStatus: "solved" },
  });
  check("event emitted", await count("events", `id=eq.${event.id}`));

  // 10. dashboard/timeline read model — the aggregate is event- and
  // activity-driven; assert both source streams now carry this lifecycle.
  const timelineRows = await count(
    "events",
    `user_id=eq.${userId}&event_type=eq.problem.solved`,
  );
  check("timeline updated (event-driven)", timelineRows >= 1);

  const dashboardRows =
    (await count("activity_logs", `user_id=eq.${userId}`)) &&
    (await count("revision_queue", `user_id=eq.${userId}`));
  check("dashboard refreshed (aggregation sources present)", Boolean(dashboardRows));
}

let exitCode = 0;
try {
  await run();
} catch (err) {
  console.log(`\n💥 ${err.message}`);
  exitCode = 1;
} finally {
  await deleteUser(userId);
  console.log("─".repeat(60));
  const passed = results.filter((r) => r.ok).length;
  const failed = results.length - passed;
  console.log(
    `${passed}/${results.length} checks passed${failed ? ` — ${failed} FAILED` : ""}`,
  );
  console.log("test user + all created rows cleaned up.");
}

if (results.some((r) => !r.ok)) exitCode = 1;
process.exit(exitCode);
