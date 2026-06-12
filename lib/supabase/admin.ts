import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

/**
 * Service-role Supabase client. SERVER ONLY.
 *
 * Bypasses Row Level Security — use exclusively for trusted server-side work
 * such as seed scripts, background jobs, or admin maintenance. Never import
 * this into a Client Component or expose its results to an unauthenticated
 * caller. The `server-only` import makes a client-side import a build error.
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set — admin client unavailable.",
    );
  }

  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

export type SupabaseAdminClient = ReturnType<typeof createAdminClient>;
