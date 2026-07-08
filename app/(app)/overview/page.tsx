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
      <div className="flex flex-col h-full max-w-5xl mx-auto py-8 lg:py-12">
        <GreetingShell name={name} />

        <div className="flex-1 space-y-8 max-w-3xl mx-auto w-full">
          <Suspense fallback={<SectionSkeleton />}>
            <TodayMissionSection userId={user.id} services={services} />
          </Suspense>

          <Suspense fallback={<SectionSkeleton />}>
            <PlannerSection userId={user.id} services={services} />
          </Suspense>

          <Suspense fallback={<SectionSkeleton />}>
            <ExecutionSection userId={user.id} services={services} />
          </Suspense>

          <Suspense fallback={<SectionSkeleton />}>
            <CoachAndAnalyticsSection userId={user.id} services={services} />
          </Suspense>
        </div>
      </div>
    </PageTransition>
  );
}
