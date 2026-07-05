import { NextResponse } from "next/server";
import { getCalendarProvider } from "@/lib/calendar/calendar-provider";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createServices } from "@/lib/services";

export async function POST() {
  try {
    const user = await requireUser();
    const provider = getCalendarProvider();

    if (!provider.isConfigured()) {
      return NextResponse.json(
        { error: "Calendar provider not configured." },
        { status: 503 },
      );
    }

    // Get events for today
    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    
    const events = await provider.getEvents(now.toISOString(), endOfDay.toISOString());
    const services = createServices(await createClient());

    // Map Google Calendar Events to TimeBlocks
    let createdCount = 0;
    for (const event of events) {
      if (event.startTime && event.endTime) {
        const start = new Date(event.startTime);
        const end = new Date(event.endTime);
        const estimatedMinutes = Math.round((end.getTime() - start.getTime()) / 60000);

        // Simple sync strategy: create time block for events
        // Note: For a robust implementation, we should check if the block already exists
        // based on the event.id or title/time to avoid duplicates.
        try {
          await services.repos.timeBlocks.create({
            user_id: user.id,
            title: event.title,
            domain: "personal",
            date: start.toISOString().slice(0, 10),
            start_time: start.toISOString().substring(11, 16),
            end_time: end.toISOString().substring(11, 16),
            estimated_minutes: estimatedMinutes,
          });
          createdCount++;
        } catch (e) {
          console.warn("Failed to create time block for event:", event.title, e);
        }
      }
    }

    return NextResponse.json({
      success: true,
      syncedEvents: events.length,
      createdBlocks: createdCount,
    });
  } catch (error) {
    console.error("Calendar sync error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
