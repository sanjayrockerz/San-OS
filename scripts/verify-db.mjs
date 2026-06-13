/**
 * Connectivity + schema-presence check against the live Supabase project.
 *
 * Uses ONLY the public anon key (RLS-protected) loaded from .env.local — never
 * the service-role key. For each table it issues a `select=id&limit=0` request:
 *   200            -> table exists and PostgREST is reachable (rows hidden by RLS)
 *   404 / PGRST205 -> table is MISSING (migration not applied)
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

const tables = [
  "users_profile",
  "topics",
  "patterns",
  "problems",
  "problem_attempts",
  "problem_reflections",
  "problem_code_versions",
  "revision_queue",
  "concept_notes",
  "roadmaps",
  "roadmap_items",
  "roadmap_progress",
  "activity_logs",
  "study_sessions",
  "daily_logs",
  "iit_courses",
  "ai_daily_briefs",
  "ai_insights",
];

let missing = 0;
for (const t of tables) {
  try {
    const res = await fetch(`${url}/rest/v1/${t}?select=id&limit=0`, {
      headers: { apikey: anon, Authorization: `Bearer ${anon}` },
    });
    const ok = res.status === 200;
    if (!ok) missing++;
    console.log(`${ok ? "✓" : "✗"} ${t.padEnd(24)} ${res.status}`);
  } catch (err) {
    missing++;
    console.log(`✗ ${t.padEnd(24)} ERROR ${err.message}`);
  }
}

console.log(
  missing === 0
    ? "\nAll tables present and reachable."
    : `\n${missing} table(s) missing or unreachable.`,
);
process.exit(missing === 0 ? 0 : 2);
