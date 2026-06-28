import { notFound } from "next/navigation";

import { requireContext } from "@/lib/server/context";
import { PageTransition } from "@/components/layout/page-transition";
import { ClientWorkspaceClient } from "@/components/business-os/client-workspace-client";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ClientWorkspacePage({ params }: Props) {
  const { id } = await params;
  const { user, services } = await requireContext(`/clients/${id}`);

  const workspace = await services.client.workspace(id).catch(() => null);
  if (!workspace || workspace.client.user_id !== user.id) notFound();

  return (
    <PageTransition>
      <ClientWorkspaceClient workspace={workspace} />
    </PageTransition>
  );
}
