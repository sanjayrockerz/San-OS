import "server-only";

import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { createServices, type Services } from "@/lib/services";
import type { Tables } from "@/types/database";

/**
 * Request-scoped server context: a Supabase server client, the validated user
 * (or null), and the full service bundle bound to that client. Server
 * Components and Server Actions call this instead of wiring the stack by hand,
 * keeping the UI → Server Action → Service → Repository → Supabase flow intact.
 */
export async function getContext(): Promise<{
  user: User | null;
  services: Services;
}> {
  const supabase = await createClient();
  // `proxy.ts` already calls `auth.getUser()` for this exact request (network
  // round-trip to Supabase Auth) and redirects unauthenticated visitors before
  // any page renders — its matcher covers every route except static assets. So
  // by the time a Server Component runs, the session cookie is already
  // server-verified for this request; re-validating here would just pay the
  // same network round-trip again on every single page load. `getSession()`
  // reads the already-verified cookie with no network call.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return { user: session?.user ?? null, services: createServices(supabase) };
}

/**
 * Like {@link getContext} but guarantees an authenticated user — redirects to
 * `/login` otherwise. Use at the top of any protected Server Component / Action.
 */
export async function requireContext(redirectTo?: string): Promise<{
  user: User;
  services: Services;
}> {
  const { user, services } = await getContext();
  if (!user) {
    redirect(
      redirectTo
        ? `/login?next=${encodeURIComponent(redirectTo)}`
        : "/login",
    );
  }
  return { user, services };
}

/**
 * Ensures a `users_profile` row exists for the user, creating one on first
 * sign-in. Idempotent; returns the profile.
 */
export async function ensureProfile(
  services: Services,
  user: User,
): Promise<Tables<"users_profile">> {
  const existing = await services.repos.profile.findByUserId(user.id);
  if (existing) return existing;

  const metadataName =
    typeof user.user_metadata?.display_name === "string"
      ? user.user_metadata.display_name
      : null;

  return services.repos.profile.create({
    user_id: user.id,
    display_name: metadataName ?? user.email?.split("@")[0] ?? null,
  });
}
