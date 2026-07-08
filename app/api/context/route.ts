import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createServices } from "@/lib/services";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const path = req.nextUrl.searchParams.get("path") || "";
    const services = createServices(await createClient());

    // Parse path to determine context
    // e.g., /projects/123 → load project, /clients/456 → load client
    const segments = path.split("/").filter(Boolean);
    let currentClient = null;
    let currentProject = null;
    let currentTask = null;

    if (segments[0] === "projects" && segments[1]) {
      currentProject = await services.repos.projects.findById(segments[1]).catch(() => null);
      if (currentProject?.client_id) {
        currentClient = await services.repos.clients.findById(currentProject.client_id).catch(() => null);
      }
    } else if (segments[0] === "clients" && segments[1]) {
      currentClient = await services.repos.clients.findById(segments[1]).catch(() => null);
    }

    // Find next deadline
    const [projects, invoices, assignments] = await Promise.all([
      services.repos.projects.findByUser(user.id),
      services.repos.invoices.findByUser(user.id).catch(() => []),
      services.repos.iitAssignments.findByUser(user.id).catch(() => []),
    ]);

    const deadlines = [
      ...projects.filter(p => p.deadline).map(p => ({ date: p.deadline!, title: p.title })),
      ...invoices.filter(i => i.due_date && i.status !== 'paid').map(i => ({ date: i.due_date!, title: i.invoice_number })),
      ...assignments.filter(a => a.due_date && a.status !== 'submitted').map(a => ({ date: a.due_date!, title: a.title })),
    ];

    deadlines.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const nextDeadline = deadlines[0] ?? null;

    // Count related resources
    const resources = await services.repos.resources.findByUser(user.id).catch(() => []);

    return NextResponse.json({
      currentClient,
      currentProject,
      currentTask: null,
      nextDeadline,
      relatedResourcesCount: resources.length,
      openRisksCount: 0,
      recentMeetingsCount: 0,
      path,
    });
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}