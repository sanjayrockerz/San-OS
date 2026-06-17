import Link from "next/link";
import { Plus, Brain } from "lucide-react";

import { requireContext } from "@/lib/server/context";
import { PageTransition, Section } from "@/components/layout/page-transition";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ConceptsClient } from "@/components/concepts/concepts-client";

const STATUS_COLOR: Record<string, string> = {
  learning: "#fbbf24",
  understood: "#60a5fa",
  weak: "#f87171",
  forgotten: "#a78bfa",
  mastered: "#34d399",
};

const STATUS_LABEL: Record<string, string> = {
  learning: "Learning",
  understood: "Understood",
  weak: "Weak",
  forgotten: "Forgotten",
  mastered: "Mastered",
};

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
    statusLabel: STATUS_LABEL[c.status] ?? c.status,
    statusColor: STATUS_COLOR[c.status] ?? "#7c7dff",
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
