import { requireContext } from "@/lib/server/context";
import { PageTransition } from "@/components/layout/page-transition";
import { PageHeader } from "@/components/layout/page-header";
import { ProjectCreateForm } from "@/components/project-os/project-create-form";

export default async function NewProjectPage() {
  const { user, services } = await requireContext("/projects/new");
  const clients = await services.client.listForUser(user.id).catch(() => []);

  return (
    <PageTransition>
      <div className="px-4 py-6 md:px-6 lg:px-8 max-w-2xl mx-auto space-y-6">
        <PageHeader title="New Project" description="Start a new project or client engagement" />
        <ProjectCreateForm clients={clients} />
      </div>
    </PageTransition>
  );
}
