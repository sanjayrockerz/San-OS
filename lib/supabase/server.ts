import { cookies } from "next/headers";

import { createServerClient } from "@supabase/ssr";

import type { Database } from "@/types/database";

/**
 * Server-side Supabase client (Server Components, Server Actions, Route
 * Handlers). Reads/writes the auth session from the Next.js cookie store.
 *
 * In Next.js 16 `cookies()` is async, so this factory is async too — always
 * `await createClient()`.
 *
 * Note: when called from a Server Component, cookie writes are a no-op (React
 * forbids mutating cookies during render). Session refresh is handled in
 * `proxy.ts` via `updateSession`, so the try/catch below is the expected path.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — safe to ignore because the
            // proxy/middleware refreshes the session cookie on every request.
          }
        },
      },
    },
  );
}

export type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;
