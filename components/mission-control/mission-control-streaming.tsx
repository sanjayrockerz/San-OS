import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Services } from "@/lib/services";
import { getHeroTheme } from "@/lib/mission-control/hero-theme-engine";
import { getCachedDashboardData, getCriticalDashboardData } from "./dashboard-data-fetcher";
import { getDevDashboardData } from "./dev-dashboard-data";
import { MissionHeroV2 } from "./mission-hero-v2";
import { KpiCarousel } from "./kpi-carousel";
import { WIDGET_CONFIG } from "@/lib/mission-control/dashboard-widgets";
import { TodayMission } from "./today-mission";
import { VoiceMessagesVault } from "@/components/dashboard/voice-messages-vault";

function getHour(): number {
  return new Date().getHours();
}

function getFormattedTime(): string {
  return new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function HeroSkeleton() {
  return (
    <div className="mb-6 h-[280px] w-full animate-pulse rounded-3xl bg-muted/30">
      <div className="flex h-full flex-col justify-between p-5">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-28 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-8 w-3/4 rounded-lg" />
          <Skeleton className="h-5 w-1/2 rounded-lg" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}

function KpiCarouselSkeleton() {
  return (
    <section className="mb-6">
      <Skeleton className="mb-3 h-4 w-24 rounded-full" />
      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 md:grid md:grid-cols-2 md:overflow-visible md:px-0 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="w-[260px] shrink-0 snap-start rounded-2xl bg-muted/30 p-4 md:w-auto"
          >
            <div className="flex items-center gap-2">
              <Skeleton className="size-8 rounded-xl" />
              <Skeleton className="h-3 w-20 rounded-full" />
            </div>
            <Skeleton className="mt-3 h-8 w-24 rounded-lg" />
            <Skeleton className="mt-1 h-3 w-32 rounded-full" />
          </div>
        ))}
      </div>
    </section>
  );
}

const SIGNAL_WIDGETS = WIDGET_CONFIG.filter((w) => ["readiness", "dsa", "projects", "finance"].includes(w.id));

async function HeroSection({
  userId,
  services,
  name,
  useDevData,
}: {
  userId: string;
  services: Services;
  name: string;
  useDevData?: boolean;
}) {
  const hour = getHour();
  const formattedTime = getFormattedTime();
  const data = useDevData
    ? getDevDashboardData()
    : await getCriticalDashboardData(userId, services);
  const theme = getHeroTheme(
    name,
    hour,
    data.yesterdayCompleted,
    data.topPriorityTitle,
  );

  return (
    <MissionHeroV2
      theme={theme}
      time={formattedTime}
      coachInsight={data.coachInsight}
      estimatedMinutes={data.estimatedMinutes}
      priorityCount={data.priorityCount}
      mission={data.topPriorityTitle}
      planner={data.planner}
    />
  );
}

async function MissionSection({ userId, services, useDevData }: Omit<StreamingProps, "name">) {
  const data = useDevData ? getDevDashboardData() : await getCachedDashboardData(userId, services);
  return <TodayMission data={data} />;
}

async function KpiGridSection({
  userId,
  services,
  useDevData,
}: {
  userId: string;
  services: Services;
  useDevData?: boolean;
}) {
  const data = useDevData
    ? getDevDashboardData()
    : await getCachedDashboardData(userId, services);

  return (
    <section className="mb-6">
      <h2 className="mb-3 px-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Key Metrics
      </h2>
      <KpiCarousel widgets={SIGNAL_WIDGETS} data={data.kpis} />
    </section>
  );
}

interface StreamingProps {
  userId: string;
  services: Services;
  name: string;
  useDevData?: boolean;
}

export function MissionControlStream({
  userId,
  services,
  name,
  useDevData = false,
}: StreamingProps) {
  return (
    <>
      <Suspense fallback={<HeroSkeleton />}>
        <HeroSection
          userId={userId}
          services={services}
          name={name}
          useDevData={useDevData}
        />
      </Suspense>

      <Suspense fallback={<KpiCarouselSkeleton />}>
        <MissionSection userId={userId} services={services} useDevData={useDevData} />
      </Suspense>

      <VoiceMessagesVault />

      <Suspense fallback={<KpiCarouselSkeleton />}>
        <KpiGridSection
          userId={userId}
          services={services}
          useDevData={useDevData}
        />
      </Suspense>

    </>
  );
}
