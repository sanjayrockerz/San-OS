import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "@/types/database";

import { hasSupabaseEnv } from "./env";
import { captureException } from "@/lib/observability/logger";

/**
 * Refreshes the Supabase auth session on every matched request AND enforces
 * authentication: anonymous visitors to any non-public route are redirected to
 * `/login` (preserving where they were headed via `?next=`).
 *
 * This MUST run in `proxy.ts` so the session cookie stays fresh for Server
 * Components, which cannot write cookies themselves. Adapted from the official
 * `@supabase/ssr` Next.js App Router guide.
 *
 * Public routes (no auth required): `/login` and the `/auth/*` OAuth handlers.
 *
 * When Supabase env vars are absent (e.g. the frontend shell running without a
 * backend), this is a no-op so the app keeps working unchanged.
 */
export async function updateSession(
  request: NextRequest,
): Promise<NextResponse> {
  if (!hasSupabaseEnv()) {
    // In production this means every route is wide open with no auth wall —
    // never let that fail silently. Local/dev frontend-shell work without a
    // backend is the only intended use of this fallback.
    if (process.env.NODE_ENV === "production") {
      captureException(
        new Error("SUPABASE env vars are missing in production — auth is DISABLED for all routes."),
        { scope: "middleware" },
      );
    }
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Enforce auth: bounce anonymous visitors to /login (except on public routes).
  const path = request.nextUrl.pathname;
  const isPublic = path === "/login" || path.startsWith("/auth");
  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", path);
    const redirect = NextResponse.redirect(url);
    // Carry over any refreshed auth cookies so the session stays in sync.
    supabaseResponse.cookies.getAll().forEach((c) => {
      redirect.cookies.set(c.name, c.value);
    });
    return redirect;
  }

  // IMPORTANT: return `supabaseResponse` as-is to keep cookies in sync. If you
  // ever build a new response, copy `supabaseResponse.cookies` over first.
  return supabaseResponse;
}
