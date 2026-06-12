import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/types/database";

/**
 * Browser-side Supabase client (Client Components).
 *
 * Uses the public anon key — all access is constrained by Row Level Security.
 * Safe to call repeatedly; `createBrowserClient` memoises a singleton per tab.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

export type SupabaseBrowserClient = ReturnType<typeof createClient>;
