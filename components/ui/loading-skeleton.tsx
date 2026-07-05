"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function PageSkeleton({
  title = true,
  layout = "grid",
}: {
  title?: boolean;
  layout?: "grid" | "list";
}) {
  return (
    <div className="mx-auto max-w-6xl animate-fade-in p-4 sm:p-6 lg:p-8">
      {title && (
        <div className="mb-8 flex items-center gap-4">
          <Skeleton className="h-8 w-48 shimmer" />
          <Skeleton className="h-6 w-24 rounded-full shimmer" />
        </div>
      )}

      {layout === "grid" ? (
        <div className="stagger grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-fade-up surface-card rounded-2xl space-y-4 p-5">
              <Skeleton className="h-5 w-3/4 shimmer" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full shimmer" />
                <Skeleton className="h-4 w-5/6 shimmer" />
              </div>
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-6 w-16 rounded-full shimmer" />
                <Skeleton className="h-6 w-20 rounded-full shimmer" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="stagger space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-fade-up surface-card flex gap-4 rounded-xl p-4">
              <Skeleton className="size-12 shrink-0 rounded-lg shimmer" />
              <div className="flex-1 space-y-2 py-1">
                <Skeleton className="h-4 w-1/3 shimmer" />
                <Skeleton className="h-3 w-1/4 shimmer" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
