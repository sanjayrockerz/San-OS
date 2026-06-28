import { requireContext } from "@/lib/server/context";
import { PageTransition } from "@/components/layout/page-transition";
import { PageHeader } from "@/components/layout/page-header";
import { InvoiceListClient } from "@/components/business-os/invoice-list-client";

async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch {
    return fallback;
  }
}

export default async function InvoicesPage() {
  const { user, services } = await requireContext("/invoices");

  // Sync overdue status for any sent invoices past their due date
  void services.invoice.syncOverdue(user.id).catch(() => null);

  const [invoices, clients, projects] = await Promise.all([
    safe(services.invoice.listForUser(user.id), []),
    safe(services.client.listForUser(user.id), []),
    safe(services.project.listForUser(user.id), []),
  ]);

  return (
    <PageTransition>
      <div className="px-4 py-6 md:px-6 lg:px-8 max-w-6xl mx-auto space-y-6">
        <PageHeader title="Invoices" description="Bill clients and track payment status" />
        <InvoiceListClient invoices={invoices} clients={clients} projects={projects} />
      </div>
    </PageTransition>
  );
}
