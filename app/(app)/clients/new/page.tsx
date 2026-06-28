import { requireContext } from "@/lib/server/context";
import { PageTransition } from "@/components/layout/page-transition";
import { PageHeader } from "@/components/layout/page-header";
import { ClientCreateForm } from "@/components/business-os/client-create-form";

export default async function NewClientPage() {
  await requireContext("/clients/new");

  return (
    <PageTransition>
      <div className="px-4 py-6 md:px-6 lg:px-8 max-w-2xl mx-auto space-y-6">
        <PageHeader title="New Client" description="Add a client or prospect to your business workspace" />
        <ClientCreateForm />
      </div>
    </PageTransition>
  );
}
