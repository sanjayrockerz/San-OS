import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createServices, EVENT_TYPES } from "@/lib/services";
import { captureException } from "@/lib/observability/logger";

/**
 * OAuth callback. Google redirects here with a `?code=...`; we exchange it for
 * a session cookie, ensure a `users_profile` row exists (first login), then
 * forward to the page the user originally wanted (`?next=`), defaulting to the
 * dashboard.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/overview";

  const consentError = searchParams.get("error");
  if (consentError) {
    return NextResponse.redirect(
      `${origin}/login?error=${consentError === "access_denied" ? "consent_denied" : "oauth_failed"}`,
    );
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=exchange_failed`);
  }

  // Ensure a profile row exists for this user (idempotent on first login).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // Auth already succeeded at this point — never let a profile/event hiccup
    // turn a successful sign-in into a 500. ensureProfile-style upsert is
    // idempotent and retried on the next page load via the layout guard.
    try {
      const { data: existing } = await supabase
        .from("users_profile")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!existing) {
        const meta = user.user_metadata ?? {};
        await supabase.from("users_profile").insert({
          user_id: user.id,
          display_name: meta.full_name ?? meta.name ?? null,
          avatar_url: meta.avatar_url ?? meta.picture ?? null,
        });
      }
    } catch (err) {
      captureException(err, { scope: "auth/callback", step: "profile-ensure" });
    }

    try {
      await createServices(supabase).events.emit(user.id, {
        eventType: EVENT_TYPES.AuthLogin,
        payload: { method: "oauth" },
      });
    } catch (err) {
      captureException(err, { scope: "auth/callback", step: "event-emit" });
    }
  }

  // Avoid open-redirects: only honour same-origin relative paths.
  const dest = next.startsWith("/") ? next : "/overview";
  return NextResponse.redirect(`${origin}${dest}`);
}
