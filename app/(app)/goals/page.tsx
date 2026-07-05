import { requireContext } from "@/lib/server/context";
import { GoalsPageClient } from "./page-client";

export default async function GoalsPage() {
  const { user, services } = await requireContext("/goals");

  const summaries = await services.goalService.getActiveSummary(user.id).catch(() => []);

  return <GoalsPageClient summaries={summaries} />;
}
