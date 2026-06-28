import { requireContext } from "@/lib/server/context";
import { PageTransition } from "@/components/layout/page-transition";
import { PageHeader } from "@/components/layout/page-header";
import { PipelineBoard } from "@/components/business-os/pipeline-board";

async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch {
    return fallback;
  }
}

export default async function PipelinePage() {
  const { user, services } = await requireContext("/pipeline");

  const [entries, clients, value] = await Promise.all([
    safe(services.pipeline.listForUser(user.id), []),
    safe(services.client.listForUser(user.id), []),
    safe(services.pipeline.pipelineValue(user.id), { total: 0, weighted: 0 }),
  ]);

  return (
    <PageTransition>
      <div className="px-4 py-6 md:px-6 lg:px-8 max-w-6xl mx-auto space-y-6">
        <PageHeader
          title="Pipeline"
          description="Track leads through discovery, proposal, and negotiation"
        />
        <PipelineBoard entries={entries} clients={clients} pipelineValue={value} />
      </div>
    </PageTransition>
  );
}
