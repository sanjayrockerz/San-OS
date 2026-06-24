import { requireContext } from "@/lib/server/context";
import { ProblemsClient } from "@/components/problems/problems-client";

async function safe<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch {
    return fallback;
  }
}

/**
 * Problems — live. Server Component: guards the route, loads the user's visible
 * problems (catalog + own) plus the topic/pattern taxonomy, and hands them to
 * the interactive client. Data flows in via props; mutations go out via the
 * Server Actions in `./actions.ts`.
 */
export default async function ProblemsPage() {
  const { user, services } = await requireContext("/problems");

  const [problems, topics, patterns] = await Promise.all([
    safe(services.problems.list(user.id), []),
    safe(services.taxonomy.listTopics(user.id), []),
    safe(services.taxonomy.listPatterns(user.id), []),
  ]);

  return (
    <ProblemsClient
      problems={problems}
      topics={topics.map((t) => ({ id: t.id, name: t.name }))}
      patterns={patterns.map((p) => ({ id: p.id, name: p.name }))}
    />
  );
}
