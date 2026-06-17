import { notFound } from "next/navigation";

import { requireContext } from "@/lib/server/context";
import { ConceptDetail } from "@/components/concepts/concept-detail";

async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try { return await p; } catch { return fallback; }
}

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ConceptDetailPage({ params }: Props) {
  const { id } = await params;
  const { user, services } = await requireContext(`/concepts/${id}`);

  const detail = await safe(services.concepts.detail(id), null);
  if (!detail) notFound();

  const [topics, patterns, relatedKnowledge, problems] = await Promise.all([
    safe(services.taxonomy.listTopics(user.id), []),
    safe(services.taxonomy.listPatterns(user.id), []),
    safe(services.knowledge.forEntity(user.id, "concept", id), []),
    safe(services.repos.problems.listVisible(user.id), []),
  ]);

  const topicMap = new Map(topics.map((t) => [t.id, t.name]));
  const patternMap = new Map(patterns.map((p) => [p.id, p.name]));
  const problemMap = new Map(problems.map((p) => [p.id, { title: p.title, difficulty: p.difficulty }]));

  return (
    <ConceptDetail
      concept={{
        id: detail.concept.id,
        title: detail.concept.title,
        category: detail.concept.category,
        status: detail.concept.status,
        confidence: detail.concept.confidence,
        personalExplanation: detail.concept.personal_explanation,
        recognitionClues: detail.concept.recognition_clues ?? [],
        whenToUse: detail.concept.when_to_use,
        commonMistakes: detail.concept.common_mistakes ?? [],
        topicId: detail.concept.topic_id,
        patternId: detail.concept.pattern_id,
        topicName: detail.concept.topic_id ? topicMap.get(detail.concept.topic_id) ?? null : null,
        patternName: detail.concept.pattern_id ? patternMap.get(detail.concept.pattern_id) ?? null : null,
        updatedAt: detail.concept.updated_at,
      }}
      resources={detail.resources.map((r) => ({
        id: r.id,
        type: r.type,
        title: r.title,
        url: r.url,
      }))}
      linkedProblems={detail.linkedProblemIds
        .map((pid) => {
          const p = problemMap.get(pid);
          return p ? { id: pid, title: p.title, difficulty: p.difficulty } : null;
        })
        .filter((x): x is NonNullable<typeof x> => x !== null)}
      relatedKnowledge={relatedKnowledge.map((k) => ({
        id: k.id,
        type: k.type,
        title: k.title,
        url: k.url,
      }))}
      allProblems={problems.map((p) => ({ id: p.id, title: p.title }))}
    />
  );
}
