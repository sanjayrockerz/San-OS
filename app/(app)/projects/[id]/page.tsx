import { notFound } from "next/navigation";

import { requireContext } from "@/lib/server/context";
import { PageTransition } from "@/components/layout/page-transition";
import { ProjectWorkspaceClient } from "@/components/project-os/project-workspace-client";

async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch {
    return fallback;
  }
}

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function ProjectWorkspacePage({ params, searchParams }: Props) {
  const { id } = await params;
  const { tab = "overview" } = await searchParams;
  const { user, services } = await requireContext(`/projects/${id}`);

  const project = await safe(services.project.findById(id), null);
  if (!project || project.user_id !== user.id) notFound();

  const [tasks, milestones, timeEntries, documents, changeRequests, quotes, health] =
    await Promise.all([
      safe(services.project.listTasks(id), []),
      safe(services.project.listMilestones(id), []),
      safe(services.project.listTimeEntries(id), []),
      safe(services.project.listDocuments(id), []),
      safe(services.project.listChangeRequests(id), []),
      safe(services.project.listQuotesByProject(id), []),
      safe(services.project.healthScore(id), null),
    ]);

  const minutesByCategory = await safe(
    services.repos.projectTimeEntries.minutesByCategory(id),
    {},
  );

  return (
    <PageTransition>
      <ProjectWorkspaceClient
        project={project}
        tasks={tasks}
        milestones={milestones}
        timeEntries={timeEntries}
        documents={documents}
        changeRequests={changeRequests}
        quotes={quotes}
        health={health}
        minutesByCategory={minutesByCategory}
        initialTab={tab}
      />
    </PageTransition>
  );
}
