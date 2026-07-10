import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createServices } from "@/lib/services";

export async function POST() {
  try {
    const user = await requireUser();
    const services = createServices(await createClient());

    const result = await services.calendarSync.sync(user.id);

    return NextResponse.json({
      success: true,
      pulled: result.pull.pulled,
      pushed: result.push.pushed,
      errors: [...result.pull.errors, ...result.push.errors],
    });
  } catch (error) {
    console.error("Calendar sync error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
