import { Suspense } from "react";
import { PageTransition } from "@/components/layout/page-transition";
import { getContext } from "@/lib/server/context";
import {
  MissionControlStream,
  HeroSkeleton,
} from "@/components/mission-control/mission-control-streaming";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const { user, services } = await getContext();
  const isAuthed = user != null;
  const name = user?.email?.split("@")[0] ?? "Sanjay";
  const userId = user?.id ?? "dev-user";

  return (
    <PageTransition>
      <div className="relative mx-auto h-full max-w-[1200px]">
        <Suspense fallback={<HeroSkeleton />}>
          <MissionControlStream
            userId={userId}
            services={services}
            name={name}
            useDevData={!isAuthed}
          />
        </Suspense>
      </div>
    </PageTransition>
  );
}
