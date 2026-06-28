import { requireContext } from "@/lib/server/context";
import { PageTransition } from "@/components/layout/page-transition";
import { PageHeader } from "@/components/layout/page-header";
import { ClientListClient } from "@/components/business-os/client-list-client";

async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch {
    return fallback;
  }
}

export default async function ClientsPage() {
  const { user, services } = await requireContext("/clients");

  const clients = await safe(services.client.listForUser(user.id), []);

  return (
    <PageTransition>
      <div className="px-4 py-6 md:px-6 lg:px-8 max-w-6xl mx-auto space-y-6">
        <PageHeader
          title="Clients"
          description="Manage relationships, contacts, and account health"
        />
        <ClientListClient clients={clients} />
      </div>
    </PageTransition>
  );
}
