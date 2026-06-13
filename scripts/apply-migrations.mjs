/**
 * Applies the Phase-4 migration bundle to the live Supabase project via the
 * Supabase Management API (the same endpoint the dashboard SQL Editor uses).
 *
 * Credentials are read from .env.local (gitignored) — never passed on the CLI:
 *   SUPABASE_ACCESS_TOKEN = a Personal Access Token (https://supabase.com/dashboard/account/tokens)
 *   SUPABASE_PROJECT_ID   = project ref (already present)
 *
 * Run: node scripts/apply-migrations.mjs
 */
import { readFileSync } from "node:fs";
import { config } from "dotenv";

config({ path: ".env.local" });

const token = process.env.SUPABASE_ACCESS_TOKEN;
const ref = process.env.SUPABASE_PROJECT_ID;

if (!token) {
  console.error(
    "Missing SUPABASE_ACCESS_TOKEN in .env.local.\n" +
      "Create one at https://supabase.com/dashboard/account/tokens and add:\n" +
      "  SUPABASE_ACCESS_TOKEN=sbp_xxx",
  );
  process.exit(1);
}
if (!ref) {
  console.error("Missing SUPABASE_PROJECT_ID in .env.local");
  process.exit(1);
}

const sql = readFileSync("database/migrations/_phase4_bundle.sql", "utf8");

console.log(`Applying Phase-4 bundle to project ${ref} …`);
const res = await fetch(
  `https://api.supabase.com/v1/projects/${ref}/database/query`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  },
);

const text = await res.text();
if (!res.ok) {
  console.error(`Failed (${res.status}):\n${text}`);
  process.exit(2);
}

console.log("Migration applied successfully.");
console.log(text.slice(0, 500));
