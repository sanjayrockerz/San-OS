import { NextRequest, NextResponse } from "next/server";
import { createServices } from "@/lib/services";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { type, input, options } = body;

    if (!type) return NextResponse.json({ error: "Job type required" }, { status: 400 });

    const services = createServices(supabase);
    const job = await services.jobQueue.enqueue(type, user.id, input, options);

    return NextResponse.json({ jobId: job.id, status: job.status });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Job failed" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const services = createServices(supabase);
    const stats = services.jobQueue.getStats();

    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get stats" },
      { status: 500 },
    );
  }
}
