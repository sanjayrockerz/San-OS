import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getEventBus } from "@/lib/platform";

const subscriptions = new Map<string, Set<string>>();

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { eventType, webhookUrl } = body;

    if (!eventType || !webhookUrl) {
      return NextResponse.json({ error: "eventType and webhookUrl required" }, { status: 400 });
    }

    const userKey = `${user.id}:${eventType}`;
    if (!subscriptions.has(userKey)) subscriptions.set(userKey, new Set());
    subscriptions.get(userKey)!.add(webhookUrl);

    const bus = getEventBus();
    bus.on(eventType, async (event) => {
      try {
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(event),
          signal: AbortSignal.timeout(5000),
        });
      } catch {
        // webhook failure is non-critical
      }
    });

    return NextResponse.json({ subscribed: true, eventType, webhookUrl });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Subscription failed" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { eventType, webhookUrl } = body;

    if (eventType && webhookUrl) {
      const userKey = `${user.id}:${eventType}`;
      subscriptions.get(userKey)?.delete(webhookUrl);
    }

    return NextResponse.json({ unsubscribed: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unsubscribe failed" },
      { status: 500 },
    );
  }
}
