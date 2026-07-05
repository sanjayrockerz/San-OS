import { requireContext } from "@/lib/server/context";
import { PageTransition } from "@/components/layout/page-transition";
import { PageHeader } from "@/components/layout/page-header";
import { ResourceCenterClient } from "@/components/resources/resource-center-client";

async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch {
    return fallback;
  }
}

export default async function ResourcesPage() {
  const { user, services } = await requireContext("/resources");

  const resources = await safe(services.resource.listRecent(user.id, 100), []);

  return (
    <PageTransition>
      <div className="h-[calc(100vh-4rem)] flex flex-col">
        <div className="px-4 py-4 md:px-6 shrink-0 border-b">
          <PageHeader
            title="Resource Center"
            description="Universal storage and memory for all your files, notes, and media"
          />
        </div>
        <div className="flex-1 overflow-hidden relative">
          <ResourceCenterClient initialResources={resources} />
        </div>
      </div>
    </PageTransition>
  );
}
