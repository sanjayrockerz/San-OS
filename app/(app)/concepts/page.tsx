import Link from "next/link";
import { Plus, Brain } from "lucide-react";

import { requireContext } from "@/lib/server/context";
import { PageTransition, Section } from "@/components/layout/page-transition";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ConceptsClient } from "@/components/concepts/concepts-client";
import {
  CONCEPT_STATUS_CATEGORY,
  CONCEPT_STATUS_LABEL,
  type ConceptStatus,
} from "@/lib/design/status";

export default async function ConceptsPage() {
  const { user, services } = await requireContext("/concepts");

  const [concepts, topics, patterns] = await Promise.all([
    services.concepts.list(user.id).catch(() => []),
    services.taxonomy.listTopics(user.id).catch(() => []),
    services.taxonomy.listPatterns(user.id).catch(() => []),
  ]);

  const topicMap = new Map(topics.map((t) => [t.id, t.name]));
  const patternMap = new Map(patterns.map((p) => [p.id, p.name]));

  const views = concepts.map((c) => ({
    id: c.id,
    title: c.title,
    category: c.category,
    status: c.status,
    statusLabel: CONCEPT_STATUS_LABEL[c.status as ConceptStatus] ?? c.status,
    statusCategory: CONCEPT_STATUS_CATEGORY[c.status as ConceptStatus] ?? "mission",
    confidence: c.confidence,
    topicName: c.topic_id ? topicMap.get(c.topic_id) ?? null : null,
    patternName: c.pattern_id ? patternMap.get(c.pattern_id) ?? null : null,
    updatedAt: c.updated_at,
  }));

  return (
    <PageTransition>
      <PageHeader
        title="Concepts"
        description="Your second brain for algorithms — write in your own words, link to problems."
        actions={
          <Link href="/concepts/new">
            <Button>
              <Plus className="size-4" /> New Concept
            </Button>
          </Link>
        }
      />

      {views.length === 0 ? (
        <Section>
          <EmptyState
            icon={Brain}
            title="No concepts yet"
            description="Write your first algorithm note in your own words."
          />
          <div className="mt-4 flex justify-center">
            <Link href="/concepts/new">
              <Button>
                <Plus className="size-4" /> New Concept
              </Button>
            </Link>
          </div>
        </Section>
      ) : (
        <ConceptsClient concepts={views} />
      )}
    </PageTransition>
  );
}
