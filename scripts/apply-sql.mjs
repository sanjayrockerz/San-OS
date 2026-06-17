/**
 * Applies a single SQL file to the live Supabase project via the Supabase
 * Management API (the same endpoint the dashboard SQL Editor uses). A general
 * companion to apply-migrations.mjs (which applies the fixed Phase-4 bundle).
 *
 * Credentials are read from .env.local (gitignored) — never passed on the CLI:
 *   SUPABASE_ACCESS_TOKEN = a Personal Access Token
 *   SUPABASE_PROJECT_ID   = project ref
 *
 * Usage: node scripts/apply-sql.mjs database/migrations/0013_knowledge_vault.sql
 */
import { readFileSync } from "node:fs";
import { config } from "dotenv";

config({ path: ".env.local" });

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/apply-sql.mjs <path-to-sql-file>");
  process.exit(1);
}

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

const sql = readFileSync(file, "utf8");

console.log(`Applying ${file} to project ${ref} …`);
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
