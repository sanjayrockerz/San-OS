import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "@/types/database";

import { hasSupabaseEnv } from "./env";

/**
 * Refreshes the Supabase auth session on every matched request.
 *
 * This MUST run in `proxy.ts` so the session cookie stays fresh for Server
 * Components, which cannot write cookies themselves. Adapted from the official
 * `@supabase/ssr` Next.js App Router guide.
 *
 * Route ENFORCEMENT (redirecting anonymous users) is intentionally NOT done
 * here yet — the login UI does not exist in this phase, and a global redirect
 * would break the existing frontend shell. Per-page protection is available
 * via `requireUser()` in `lib/auth/session.ts` and can be opted into later.
 *
 * When Supabase env vars are absent (e.g. the frontend shell running without a
 * backend), this is a no-op so the app keeps working unchanged.
 */
export async function updateSession(
  request: NextRequest,
): Promise<NextResponse> {
  if (!hasSupabaseEnv()) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: do not run code between createServerClient and getUser(), and do
  // not remove this call — it refreshes the token. getUser() revalidates the
  // session against the Supabase Auth server (unlike getSession()).
  await supabase.auth.getUser();

  // IMPORTANT: return `supabaseResponse` as-is to keep cookies in sync. If you
  // ever build a new response, copy `supabaseResponse.cookies` over first.
  return supabaseResponse;
}
