import { requireContext } from "@/lib/server/context";
import { PageTransition } from "@/components/layout/page-transition";
import { PageHeader } from "@/components/layout/page-header";

export default async function CoachPage() {
  const { user, services } = await requireContext("/coach");
  const brief = await services.studentCoach.dailyBrief(user.id, "none").catch(() => null);
  const actions = brief?.today?.recommendedPlan ?? [];
  return <PageTransition><div className="mx-auto max-w-3xl space-y-6 px-4 py-6 md:px-6"><PageHeader title="Personal Coach" description="Your next best actions, with the reason behind each recommendation." /><section className="mission-surface rounded-3xl p-5 sm:p-6"><p className="eyebrow">Today&apos;s guidance</p><h2 className="mt-2 text-2xl font-semibold">{brief?.today?.insight ?? "Start with one small, important action."}</h2><p className="mt-2 text-sm text-muted-foreground">{brief?.today?.estimatedMinutes ? `About ${brief.today.estimatedMinutes} minutes of focused work is recommended.` : "Your coach will learn from completed work and adjust the plan."}</p></section><div className="grid gap-3">{actions.length ? actions.map((action) => <article key={action.id} className="rounded-2xl border bg-card p-4"><p className="font-medium">{action.title}</p><p className="mt-1 text-sm text-muted-foreground">{action.detail}</p></article>) : <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">No urgent recommendations. You&apos;re clear to choose your next priority.</div>}</div></div></PageTransition>;
}
