import Link from "next/link";
import { Map } from "lucide-react";

import { requireContext } from "@/lib/server/context";
import { PageTransition, Section } from "@/components/layout/page-transition";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressRing } from "@/components/charts/progress-ring";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CATEGORY_TINT } from "@/lib/design/category";
import { ROADMAP_KIND_CATEGORY, ROADMAP_KIND_LABEL, type RoadmapKind } from "@/lib/design/status";

export default async function RoadmapsPage() {
  const { user, services } = await requireContext("/roadmaps");

  const roadmaps = await services.roadmaps.list(user.id).catch(() => []);

  // Load progress summaries in parallel (one tree call per roadmap for item count)
  const summaries = await Promise.all(
    roadmaps.map(async (r) => {
      try {
        const tree = await services.roadmaps.tree(user.id, r.id);
        return {
          id: r.id,
          title: r.title,
          description: r.description,
          kind: r.kind,
          tier: r.tier,
          slug: r.slug,
          total: tree?.total ?? 0,
          completed: tree?.completed ?? 0,
          progress: tree && tree.total > 0 ? Math.round((tree.completed / tree.total) * 100) : 0,
        };
      } catch {
        return {
          id: r.id,
          title: r.title,
          description: r.description,
          kind: r.kind,
          tier: r.tier,
          slug: r.slug,
          total: 0,
          completed: 0,
          progress: 0,
        };
      }
    }),
  );

  return (
    <PageTransition>
      <PageHeader
        title="Roadmaps"
        description="Structured paths from fundamentals to interview-ready. Track every milestone."
      />

      {summaries.length === 0 ? (
        <Section>
          <EmptyState
            icon={Map}
            title="No roadmaps yet"
            description="Roadmap templates will appear here once the database seed is applied."
          />
        </Section>
      ) : (
        <Section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {summaries.map((r) => {
            const category = ROADMAP_KIND_CATEGORY[r.kind as RoadmapKind] ?? "mission";
            return (
              <Link
                key={r.id}
                href={`/roadmaps/${r.id}`}
                className="surface-card group flex flex-col rounded-2xl p-5 transition-shadow hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  <ProgressRing
                    value={r.progress}
                    size={72}
                    stroke={7}
                    color={`var(--category-${category})`}
                  >
                    <span className="text-sm font-bold tabular">{r.progress}%</span>
                  </ProgressRing>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={cn("text-[10px]", CATEGORY_TINT[category])}>
                        {ROADMAP_KIND_LABEL[r.kind as RoadmapKind] ?? r.kind}
                      </Badge>
                      {r.tier && (
                        <Badge variant="outline" className="text-[10px] bg-background">
                          {r.tier}
                        </Badge>
                      )}
                    </div>
                    <h3 className="mt-1.5 text-[15px] font-semibold tracking-tight transition-colors group-hover:text-primary">
                      {r.title}
                    </h3>
                    {r.description && (
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                        {r.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                  <span className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{r.completed}</span> / {r.total} items
                  </span>
                  <Button variant="secondary" size="sm" className="pointer-events-none">
                    Continue →
                  </Button>
                </div>
              </Link>
            );
          })}
        </Section>
      )}
    </PageTransition>
  );
}
