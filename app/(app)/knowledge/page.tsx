import { requireContext } from "@/lib/server/context";
import { PageTransition } from "@/components/layout/page-transition";
import { PageHeader } from "@/components/layout/page-header";
import {
  KnowledgeCommandCenter,
  type KnowledgeCommandCenterData,
} from "@/components/dashboard/knowledge-command-center";

export default async function KnowledgePage() {
  const { user, services } = await requireContext("/knowledge");

  const [health, gaps, topResources, actions] = await Promise.all([
    services.knowledgeHealth.snapshot(user.id).catch(() => ({
      entities: [],
      conceptRetention: [],
      strong: [],
      weak: [],
      overallCoveragePercent: 0,
    })),
    services.learningGapEngine.gaps(user.id).catch(() => []),
    services.resourceEffectiveness.topResources(user.id).catch(() => []),
    services.knowledgeCoach.actions(user.id).catch(() => []),
  ]);

  const data: KnowledgeCommandCenterData = {
    overallCoveragePercent: health.overallCoveragePercent,
    strong: health.strong.map((e) => ({
      entityType: e.entityType,
      entityId: e.entityId,
      name: e.name,
      coveragePercent: e.coveragePercent,
      retentionStatus: e.retentionStatus,
    })),
    weak: health.weak.map((e) => ({
      entityType: e.entityType,
      entityId: e.entityId,
      name: e.name,
      coveragePercent: e.coveragePercent,
      retentionStatus: e.retentionStatus,
    })),
    gaps: gaps.map((g) => ({
      id: g.id,
      kind: g.kind,
      name: g.name,
      severity: g.severity,
      reason: g.reason,
      href: g.recommendedAction.href,
    })),
    actions,
    topResources: topResources
      .filter((r) => r.signal !== "unproven")
      .concat(topResources.filter((r) => r.signal === "unproven"))
      .map((r) => ({
        id: r.id,
        title: r.title,
        signal: r.signal,
        evidence: r.evidence,
      })),
  };

  return (
    <PageTransition>
      <PageHeader
        title="Knowledge OS"
        description="What you're missing, what you understand poorly, and what to do about it."
      />
      <KnowledgeCommandCenter data={data} />
    </PageTransition>
  );
}
