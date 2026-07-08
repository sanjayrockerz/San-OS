import { Skeleton } from "@/components/ui/skeleton";
import { SectionSkeleton } from "./streaming";

export default function OverviewLoading() {
  return (
    <div className="mx-auto flex h-full max-w-6xl flex-col py-8 lg:py-12">
      <div className="mb-8 w-full overflow-hidden rounded-[2rem] border border-border/60 bg-card/80 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-6 w-32 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="mt-6 space-y-4">
          <Skeleton className="h-12 w-72 rounded-2xl" />
          <Skeleton className="h-4 w-full rounded-full" />
          <Skeleton className="h-4 w-3/4 rounded-full" />
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Skeleton className="h-20 rounded-[1.4rem]" />
          <Skeleton className="h-20 rounded-[1.4rem]" />
          <Skeleton className="h-20 rounded-[1.4rem]" />
        </div>
      </div>
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Skeleton className="h-32 rounded-[1.6rem]" />
          <Skeleton className="h-32 rounded-[1.6rem]" />
          <Skeleton className="h-32 rounded-[1.6rem]" />
          <Skeleton className="h-32 rounded-[1.6rem]" />
        </div>
        <SectionSkeleton />
        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
          <SectionSkeleton />
          <SectionSkeleton />
        </div>
      </div>
    </div>
  );
}
