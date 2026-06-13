import { requireContext } from "@/lib/server/context";
import {
  OverviewClient,
  type LiveActivityItem,
} from "@/components/dashboard/overview-client";

const SOLVED = new Set(["solved", "solved_with_help", "partial"]);
const WEEKLY_TARGET = 21;

async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch {
    return fallback;
  }
}

/** A short ascending sparkline that ends at `value` (we lack true history yet). */
function spark(value: number): number[] {
  const n = 8;
  return Array.from({ length: n }, (_, i) =>
    Math.max(0, Math.round((value * (i + 1)) / n)),
  );
}

/** Epoch ms for 7 days ago — wrapped so the impure clock read is out of render. */
function weekAgoMs(): number {
  return Date.now() - 7 * 24 * 60 * 60 * 1000;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
  });
}

/**
 * Overview dashboard — live simple metrics. Counts come from the core tables
 * (problems, attempts, revision_queue) that are already applied; reads from the
 * Phase-4 activity stream are resilient (fall back to attempts) so the page
 * renders before/after the Phase-4 migrations land. Advanced analytics
 * (radar/performance/pattern confidence) remain visual previews for Phase 5.
 */
export default async function OverviewPage() {
  const { user, services } = await requireContext("/overview");

  const [profile, problems, attempts, due, activityRows] = await Promise.all([
    safe(services.repos.profile.findByUserId(user.id), null),
    safe(services.problems.list(user.id), []),
    safe(services.repos.attempts.findByUser(user.id), []),
    safe(services.repos.revision.findDue(user.id, new Date().toISOString()), []),
    safe(services.repos.activity.recent(user.id, 6), []),
  ]);

  const name =
    profile?.display_name?.split(" ")[0] ??
    user.email?.split("@")[0] ??
    "there";

  const solvedAttempts = attempts.filter(
    (a) => a.solve_status && SOLVED.has(a.solve_status),
  );
  const solved = new Set(solvedAttempts.map((a) => a.problem_id)).size;

  const weekAgo = weekAgoMs();
  const solvedThisWeek = solvedAttempts.filter(
    (a) => new Date(a.attempted_at).getTime() >= weekAgo,
  ).length;

  // Activity: prefer the real stream; fall back to deriving from attempts.
  const titleByProblem = new Map(problems.map((p) => [p.id, p.title]));
  let activity: LiveActivityItem[];
  if (activityRows.length > 0) {
    activity = activityRows.map((a) => ({
      id: a.id,
      text: a.title ?? a.type.replace(/_/g, " "),
      time: relativeTime(a.occurred_at),
    }));
  } else {
    activity = attempts.slice(0, 6).map((a) => ({
      id: a.id,
      text: `Logged ${titleByProblem.get(a.problem_id) ?? "a problem"}`,
      time: relativeTime(a.attempted_at),
    }));
  }

  return (
    <OverviewClient
      name={name}
      latestTitle={problems[0]?.title ?? null}
      activity={activity}
      metrics={{
        totalProblems: problems.length,
        solved,
        revisionDue: due.length,
        solvedThisWeek,
        weeklyTarget: WEEKLY_TARGET,
        trends: {
          total: spark(problems.length),
          solved: spark(solved),
          revision: spark(due.length),
        },
      }}
    />
  );
}
