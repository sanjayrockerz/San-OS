import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWorkflowEngine } from "@/lib/platform";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { workflowId, input } = body;

    if (!workflowId) {
      return NextResponse.json({ error: "workflowId required" }, { status: 400 });
    }

    const engine = getWorkflowEngine();
    const execution = await engine.start(workflowId, user.id, input);

    if (!execution) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    return NextResponse.json({ executionId: execution.id, status: execution.status });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Workflow failed" },
      { status: 500 },
    );
  }
}

export async function GET() {
  const engine = getWorkflowEngine();
  const workflows = engine.listDefinitions().map((w) => ({
    id: w.id,
    name: w.name,
    version: w.version,
    trigger: w.trigger.type,
  }));

  return NextResponse.json({ workflows, stats: engine.getStats() });
}
