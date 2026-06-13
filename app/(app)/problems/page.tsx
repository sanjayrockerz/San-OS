import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";
import { createServices } from "@/lib/services";
import { ProblemsClient } from "@/components/problems/problems-client";

/**
 * Problems — live. Server Component: guards the route, loads the user's visible
 * problems (catalog + own) plus the topic/pattern taxonomy, and hands them to
 * the interactive client. Data flows in via props; mutations go out via the
 * Server Actions in `./actions.ts`.
 */
export default async function ProblemsPage() {
  const user = await requireUser("/problems");
  const supabase = await createClient();
  const services = createServices(supabase);

  const [problems, topics, patterns] = await Promise.all([
    services.problems.list(user.id),
    services.repos.topics.listOrdered(),
    services.repos.patterns.findAll(),
  ]);

  return (
    <ProblemsClient
      problems={problems}
      topics={topics.map((t) => ({ id: t.id, name: t.name }))}
      patterns={patterns.map((p) => ({ id: p.id, name: p.name }))}
    />
  );
}
