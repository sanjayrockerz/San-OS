import { requireContext } from "@/lib/server/context";
import { PageTransition } from "@/components/layout/page-transition";
import { PageHeader } from "@/components/layout/page-header";
import { ProjectListClient } from "@/components/project-os/project-list-client";

async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch {
    return fallback;
  }
}

export default async function ProjectsPage() {
  const { user, services } = await requireContext("/projects");

  const [projects, healthMap] = await Promise.all([
    safe(services.project.listForUser(user.id), []),
    safe(services.project.healthScoreForAll(user.id), new Map()),
  ]);

  const projectViews = projects.map((p) => ({
    project: p,
    health: healthMap.get(p.id) ?? null,
  }));

  return (
    <PageTransition>
      <div className="px-4 py-6 md:px-6 lg:px-8 max-w-6xl mx-auto space-y-6">
        <PageHeader
          title="Project OS"
          description="Manage your client work and personal projects"
        />
        <ProjectListClient projects={projectViews} />
      </div>
    </PageTransition>
  );
}
