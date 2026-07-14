import { HeroSkeleton } from "@/components/mission-control/mission-control-streaming";

export default function OverviewLoading() {
  return (
    <div className="relative mx-auto h-full max-w-4xl">
      <HeroSkeleton />
      <div className="mb-6">
        <div className="mb-3 h-4 w-24 animate-pulse rounded-full bg-muted" />
        <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 md:grid md:grid-cols-2 md:overflow-visible md:px-0 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="w-[260px] shrink-0 snap-start rounded-2xl bg-muted/30 p-4 md:w-auto"
            >
              <div className="flex items-center gap-2">
                <div className="size-8 animate-pulse rounded-xl bg-muted" />
                <div className="h-3 w-20 animate-pulse rounded-full bg-muted" />
              </div>
              <div className="mt-3 h-8 w-24 animate-pulse rounded-lg bg-muted" />
              <div className="mt-1 h-3 w-32 animate-pulse rounded-full bg-muted" />
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-3 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="h-48 animate-pulse rounded-3xl bg-muted/30" />
        <div className="h-48 animate-pulse rounded-3xl bg-muted/30" />
        <div className="h-28 animate-pulse rounded-3xl bg-muted/30 lg:col-span-2" />
      </div>
    </div>
  );
}
