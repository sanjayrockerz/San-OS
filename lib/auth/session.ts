import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

/**
 * Server-side authentication helpers.
 *
 * Use `getUser()` when an anonymous visitor is acceptable, and `requireUser()`
 * to protect a Server Component / Server Action — it redirects unauthenticated
 * callers to the (future) login route.
 */

/**
 * Returns the current authenticated user, or `null` if there is no session.
 * Always validated against the Supabase Auth server (not just the cookie).
 */
export async function getUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Protected-route guard. Returns the authenticated user or redirects to
 * `/login` (preserving the originating path). Call at the top of any Server
 * Component or Server Action that must not be reached anonymously.
 *
 * The login UI is built in a later phase; until then this guard simply has no
 * pages to protect, so existing routes are unaffected.
 */
export async function requireUser(redirectTo?: string): Promise<User> {
  const user = await getUser();
  if (!user) {
    const target = redirectTo
      ? `/login?redirectedFrom=${encodeURIComponent(redirectTo)}`
      : "/login";
    redirect(target);
  }
  return user;
}

/**
 * Convenience inverse of `requireUser` — redirect already-authenticated users
 * away from auth pages (e.g. `/login`) to the app. Used by the auth UI later.
 */
export async function redirectIfAuthenticated(
  destination = "/overview",
): Promise<void> {
  const user = await getUser();
  if (user) {
    redirect(destination);
  }
}
