/**
 * Small helpers for reading and validating Supabase environment variables.
 * Centralised so the client/server/admin factories and the proxy agree on what
 * "configured" means.
 */

/** True when the public Supabase env vars needed for auth are present. */
export function hasSupabaseEnv(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

/** Throws a descriptive error if the public Supabase env vars are missing. */
export function assertSupabaseEnv(): void {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error("Missing env var: NEXT_PUBLIC_SUPABASE_URL");
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("Missing env var: NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
}
