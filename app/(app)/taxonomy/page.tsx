import { requireContext } from "@/lib/server/context";
import {
  TaxonomyClient,
  type ProposalView,
  type TaxonView,
} from "@/components/taxonomy/taxonomy-client";

async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch {
    return fallback;
  }
}

/**
 * Taxonomy Proposals workspace — exposes the existing evolve engine's output.
 * Reads come straight from TaxonomyService (proposals + ranked visible lists);
 * no analytics logic lives here.
 */
export default async function TaxonomyPage() {
  const { user, services } = await requireContext("/taxonomy");

  const [proposalGroups, topics, patterns] = await Promise.all([
    safe(services.taxonomy.listProposals(user.id), { topics: [], patterns: [] }),
    safe(services.taxonomy.listTopics(user.id), []),
    safe(services.taxonomy.listPatterns(user.id), []),
  ]);

  const proposals: ProposalView[] = [
    ...proposalGroups.topics.map((t) => ({
      entityType: "topic" as const,
      id: t.id,
      name: t.name,
      aiConfidence: t.ai_confidence,
      aiRationale: t.ai_rationale,
    })),
    ...proposalGroups.patterns.map((p) => ({
      entityType: "pattern" as const,
      id: p.id,
      name: p.name,
      aiConfidence: p.ai_confidence,
      aiRationale: p.ai_rationale,
    })),
  ].sort((a, b) => (b.aiConfidence ?? 0) - (a.aiConfidence ?? 0));

  const toView = (t: { id: string; name: string; source: string }): TaxonView => ({
    id: t.id,
    name: t.name,
    source: t.source,
  });

  return (
    <TaxonomyClient
      proposals={proposals}
      topics={topics.map(toView)}
      patterns={patterns.map(toView)}
    />
  );
}
