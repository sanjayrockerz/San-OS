import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { requireContext } from "@/lib/server/context";
import { ProgressRing } from "@/components/charts/progress-ring";
import { Badge } from "@/components/ui/badge";
import { RoadmapTree } from "@/components/roadmaps/roadmap-tree";
import type { RoadmapNode } from "@/lib/services";
import { cn } from "@/lib/utils";
import { CATEGORY_TINT } from "@/lib/design/category";
import { ROADMAP_KIND_CATEGORY, ROADMAP_KIND_LABEL, type RoadmapKind } from "@/lib/design/status";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function RoadmapDetailPage({ params }: Props) {
  const { id } = await params;
  const { user, services } = await requireContext(`/roadmaps/${id}`);

  const tree = await services.roadmaps.tree(user.id, id).catch(() => null);
  if (!tree) notFound();

  const pct = tree.total > 0 ? Math.round((tree.completed / tree.total) * 100) : 0;
  const category = ROADMAP_KIND_CATEGORY[tree.roadmap.kind as RoadmapKind] ?? "mission";

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      {/* Back + header */}
      <div className="mb-6 flex items-start gap-4">
        <Link
          href="/roadmaps"
          className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className={cn("text-[10px]", CATEGORY_TINT[category])}>
              {ROADMAP_KIND_LABEL[tree.roadmap.kind as RoadmapKind] ?? tree.roadmap.kind}
            </Badge>
            {tree.roadmap.tier && (
              <Badge variant="outline" className="text-[10px] bg-background">
                {tree.roadmap.tier}
              </Badge>
            )}
          </div>
          <h1 className="mt-1 text-xl font-bold tracking-tight">{tree.roadmap.title}</h1>
          {tree.roadmap.description && (
            <p className="mt-0.5 text-sm text-muted-foreground">{tree.roadmap.description}</p>
          )}
        </div>
        <div className="shrink-0">
          <ProgressRing value={pct} size={64} stroke={6} color={`var(--category-${category})`}>
            <span className="text-xs font-bold tabular">{pct}%</span>
          </ProgressRing>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6 surface-card rounded-2xl p-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted-foreground">Overall Progress</span>
          <span className="font-semibold tabular">{tree.completed} / {tree.total} items</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: `var(--category-${category})` }}
          />
        </div>
      </div>

      {/* Tree */}
      <RoadmapTree
        roadmapId={id}
        nodes={tree.nodes as RoadmapNode[]}
      />
    </div>
  );
}
