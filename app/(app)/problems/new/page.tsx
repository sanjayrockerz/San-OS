import { requireContext } from "@/lib/server/context";
import { NewProblemForm } from "@/components/problems/new-problem-form";

/**
 * Add Learning Entry → DSA Problem workflow. A Server Component loads the global
 * topic/pattern taxonomy for the selects, then hands off to the client form
 * which posts to the `createLearningEntry` server action (the Problem Engine).
 */
export default async function NewProblemPage() {
  const { services } = await requireContext("/problems/new");

  const [topics, patterns] = await Promise.all([
    services.repos.topics.listOrdered(),
    services.repos.patterns.findAll(),
  ]);

  return (
    <NewProblemForm
      topics={topics.map((t) => ({ id: t.id, name: t.name }))}
      patterns={patterns
        .map((p) => ({ id: p.id, name: p.name }))
        .sort((a, b) => a.name.localeCompare(b.name))}
    />
  );
}
