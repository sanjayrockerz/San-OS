import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createServices } from "@/lib/services";
import { EVENT_TYPES } from "@/lib/services/event.service";

/** Signs the user out (emitting an auth.logout event first) and returns to login. */
export async function POST(request: Request) {
  const { origin } = new URL(request.url);
  const supabase = await createClient();

  // Emit while still authenticated (RLS needs auth.uid()).
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    await createServices(supabase)
      .events.emit(user.id, { eventType: EVENT_TYPES.AuthLogout })
      .catch((err) => console.error("[signout] event emit failed", err));
  }

  await supabase.auth.signOut();
  return NextResponse.redirect(`${origin}/login`, { status: 303 });
}
