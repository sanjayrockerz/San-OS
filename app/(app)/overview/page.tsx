import { Suspense } from "react";
import { requireContext } from "@/lib/server/context";
import { PageTransition } from "@/components/layout/page-transition";
import {
  GreetingShell,
  TodayMissionSection,
  PlannerSection,
  ExecutionSection,
  CoachAndAnalyticsSection,
  SectionSkeleton,
} from "./streaming";

export default async function OverviewPage() {
  const { user, services } = await requireContext("/overview");

  const name = user.email?.split("@")[0] ?? "there";

  return (
    <PageTransition>
      <div className="relative mx-auto flex h-full max-w-6xl flex-col overflow-hidden py-8 lg:py-12">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_34%),radial-gradient(circle_at_top_right,rgba(251,191,36,0.18),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.08),transparent_70%)]" />
        <GreetingShell name={name} />

        <div className="flex-1 space-y-8 w-full">
          <Suspense fallback={<SectionSkeleton />}>
            <TodayMissionSection userId={user.id} services={services} />
          </Suspense>

          <div className="mx-auto grid w-full max-w-6xl gap-8 xl:grid-cols-[1.05fr_0.95fr]">
            <Suspense fallback={<SectionSkeleton />}>
              <PlannerSection userId={user.id} services={services} />
            </Suspense>

            <Suspense fallback={<SectionSkeleton />}>
              <ExecutionSection userId={user.id} services={services} />
            </Suspense>
          </div>

          <div className="mx-auto w-full max-w-6xl">
            <Suspense fallback={<SectionSkeleton />}>
              <CoachAndAnalyticsSection userId={user.id} services={services} />
            </Suspense>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
