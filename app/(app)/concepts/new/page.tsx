import { requireContext } from "@/lib/server/context";
import { NewConceptForm } from "@/components/concepts/new-concept-form";

export default async function NewConceptPage() {
  const { user, services } = await requireContext("/concepts/new");

  const [topics, patterns] = await Promise.all([
    services.taxonomy.listTopics(user.id),
    services.taxonomy.listPatterns(user.id),
  ]);

  return (
    <NewConceptForm
      topics={topics.map((t) => ({ id: t.id, name: t.name }))}
      patterns={patterns.map((p) => ({ id: p.id, name: p.name }))}
    />
  );
}
