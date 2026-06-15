import { requireContext } from "@/lib/server/context";
import {
  OverviewClient,
  type LiveActivityItem,
} from "@/components/dashboard/overview-client";

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

  // The page consumes ONLY the aggregation service — no direct domain queries,
  // no analytics logic here. The service assembles every section (and is itself
  // fail-soft per section), so the page just maps the snapshot onto the client.
  const [profile, snapshot] = await Promise.all([
    safe(services.repos.profile.findByUserId(user.id), null),
    services.dashboardAggregation.snapshot(user.id),
  ]);

  const name =
    profile?.display_name?.split(" ")[0] ??
    user.email?.split("@")[0] ??
    "there";

  const { hero } = snapshot;

  const activity: LiveActivityItem[] = snapshot.activityTimeline
    .slice(0, 6)
    .map((item) => ({
      id: item.id,
      text: item.text,
      time: relativeTime(item.at),
    }));

  return (
    <OverviewClient
      name={name}
      latestTitle={snapshot.continueLearning[0]?.title ?? null}
      activity={activity}
      metrics={{
        totalProblems: hero.totalProblems,
        solved: hero.uniqueSolved,
        revisionDue: hero.revisionDue,
        solvedThisWeek: hero.solvedThisWeek,
        weeklyTarget: hero.weeklyTarget,
        trends: {
          total: spark(hero.totalProblems),
          solved: spark(hero.uniqueSolved),
          revision: spark(hero.revisionDue),
        },
      }}
    />
  );
}
