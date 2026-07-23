import { NextResponse } from "next/server";
import { getContext } from "@/lib/server/context";

export async function GET(request: Request) {
  try {
    const { user, services } = await getContext();
    const userId = user?.id ?? "dev-user";

    const result = await services.reminderEngine.generateAutomatedCoachReminders(userId);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      userId,
      createdCount: result.created,
      reminders: result.reminders,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message ?? "Failed to run automated coach reminders" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
