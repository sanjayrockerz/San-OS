import { Suspense } from "react";
import { PageTransition } from "@/components/layout/page-transition";
import { createClient } from "@/lib/supabase/server";
import { createServices } from "@/lib/services";
import {
  MissionControlStream,
  HeroSkeleton,
} from "@/components/mission-control/mission-control-streaming";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const supabase = await createClient();
  const services = createServices(supabase);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const isAuthed = session?.user != null;
  const name = session?.user?.email?.split("@")[0] ?? "Sanjay";
  const userId = session?.user?.id ?? "dev-user";

  return (
    <PageTransition>
      <div className="relative mx-auto h-full max-w-4xl">
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