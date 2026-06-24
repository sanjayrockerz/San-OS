import Link from "next/link";
import { Brain, Sparkles, AlertTriangle } from "lucide-react";

import { Section } from "@/components/layout/page-transition";
import { SectionHeading } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { ProgressRing } from "@/components/charts/progress-ring";
import { cn } from "@/lib/utils";
import type { KnowledgeAction } from "@/lib/services/knowledge-coach.service";
import type { GapKind, GapSeverity } from "@/lib/services/learning-gap-engine.service";
import type { ResourceSignal } from "@/lib/services/resource-effectiveness.service";
import { CATEGORY_TEXT, CATEGORY_TINT } from "@/lib/design/category";
import { GAP_KIND_META, RISK_LEVEL_META } from "@/lib/design/status";
import { ActionRow } from "./action-row";

export interface KnowledgeEntityView {
  entityType: "topic" | "pattern";
  entityId: string;
  name: string;
  coveragePercent: number;
  retentionStatus: string;
}

export interface KnowledgeGapView {
  id: string;
  kind: GapKind;
  name: string;
  severity: GapSeverity;
  reason: string;
  href: string;
}

export interface ResourceEffectivenessView {
  id: string;
  title: string;
  signal: ResourceSignal;
  evidence: string;
}

export interface KnowledgeCommandCenterData {
  overallCoveragePercent: number;
  strong: KnowledgeEntityView[];
  weak: KnowledgeEntityView[];
  gaps: KnowledgeGapView[];
  actions: KnowledgeAction[];
  topResources: ResourceEffectivenessView[];
}

const SIGNAL_BADGE_VARIANT: Record<ResourceSignal, "success" | "default" | "warning" | "secondary"> = {
  strong: "success",
  neutral: "default",
  weak: "warning",
  unproven: "secondary",
};

/**
 * Knowledge Command Center — the diagnosis surface for "what am I missing /
 * what do I understand poorly", as opposed to /concepts (CRUD) or /revision
 * (do the work). Pure props-in presentational component, mirroring
 * MissionControlPanel's shape so the two stay visually consistent.
 */
export function KnowledgeCommandCenter({ data }: { data: KnowledgeCommandCenterData }) {
  return (
    <div className="space-y-5">
      <CoverageOverview overallCoveragePercent={data.overallCoveragePercent} strong={data.strong} weak={data.weak} />
      <StrongWeakKnowledge strong={data.strong} weak={data.weak} />
      <Gaps gaps={data.gaps} />
      <RecommendedActions actions={data.actions} />
      {data.topResources.length > 0 && <ResourceEffectiveness resources={data.topResources} />}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Coverage overview                                                           */
/* -------------------------------------------------------------------------- */

function CoverageOverview({
  overallCoveragePercent,
  strong,
  weak,
}: {
  overallCoveragePercent: number;
  strong: KnowledgeEntityView[];
  weak: KnowledgeEntityView[];
}) {
  return (
    <Section>
      <div className="surface-card rounded-2xl border-category-knowledge/25 p-5">
        <div className="mb-4 flex items-center gap-2">
          <Brain className={cn("size-4.5", CATEGORY_TEXT.knowledge)} />
          <h2 className="text-section">Coverage Overview</h2>
        </div>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
          <ProgressRing value={overallCoveragePercent} size={88} stroke={8}>
            <span className="text-lg font-bold tabular">{overallCoveragePercent}</span>
            <span className="text-[10px] text-muted-foreground">coverage</span>
          </ProgressRing>
          <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border p-3 text-center">
              <p className="text-2xl font-bold tabular text-success">{strong.length}</p>
              <p className="text-xs text-muted-foreground">strong topics/patterns</p>
            </div>
            <div className="rounded-xl border border-border p-3 text-center">
              <p className="text-2xl font-bold tabular text-danger">{weak.length}</p>
              <p className="text-xs text-muted-foreground">weak topics/patterns</p>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/* Strong / Weak Knowledge                                                     */
/* -------------------------------------------------------------------------- */

function StrongWeakKnowledge({
  strong,
  weak,
}: {
  strong: KnowledgeEntityView[];
  weak: KnowledgeEntityView[];
}) {
  if (strong.length === 0 && weak.length === 0) return null;

  return (
    <Section>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="surface-card rounded-2xl p-5">
          <SectionHeading title="Strong Knowledge" />
          {strong.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">Nothing fully covered yet.</p>
          ) : (
            <div className="space-y-1.5">
              {strong.slice(0, 6).map((e) => (
                <EntityRow key={`${e.entityType}-${e.entityId}`} entity={e} tone="success" />
              ))}
            </div>
          )}
        </div>
        <div className="surface-card rounded-2xl p-5">
          <SectionHeading title="Weak Knowledge" />
          {weak.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">Nothing critically weak right now.</p>
          ) : (
            <div className="space-y-1.5">
              {weak.slice(0, 6).map((e) => (
                <EntityRow key={`${e.entityType}-${e.entityId}`} entity={e} tone="danger" />
              ))}
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}

function EntityRow({ entity, tone }: { entity: KnowledgeEntityView; tone: "success" | "danger" }) {
  const href = entity.entityType === "topic" ? "/taxonomy" : "/taxonomy";
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-xl border border-border p-2.5 transition-colors hover:bg-accent"
    >
      <span className="min-w-0 flex-1 truncate text-xs font-medium">{entity.name}</span>
      <Badge variant={tone === "success" ? "success" : "danger"}>{entity.coveragePercent}%</Badge>
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/* Gaps                                                                        */
/* -------------------------------------------------------------------------- */

function Gaps({ gaps }: { gaps: KnowledgeGapView[] }) {
  if (gaps.length === 0) return null;

  return (
    <Section>
      <div className="surface-card rounded-2xl p-5">
        <SectionHeading title="Learning Gaps" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {gaps.slice(0, 9).map((gap) => {
            const meta = GAP_KIND_META[gap.kind];
            const Icon = meta.icon;
            return (
              <Link
                key={gap.id}
                href={gap.href}
                className="lift group flex flex-col gap-2 rounded-xl border border-border bg-card p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-lg",
                      CATEGORY_TINT[meta.category],
                    )}
                  >
                    <Icon className="size-3.5" />
                  </span>
                  <Badge variant={RISK_LEVEL_META[gap.severity].badgeVariant}>
                    {RISK_LEVEL_META[gap.severity].label}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-semibold line-clamp-1">{gap.name}</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground mt-0.5">{gap.reason}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/* Recommended actions                                                         */
/* -------------------------------------------------------------------------- */

function RecommendedActions({ actions }: { actions: KnowledgeAction[] }) {
  if (actions.length === 0) {
    return (
      <Section>
        <div className="surface-card rounded-2xl p-5">
          <div className="mb-1 flex items-center gap-2">
            <Sparkles className={cn("size-4.5", CATEGORY_TEXT.knowledge)} />
            <h2 className="text-section">Recommended Actions</h2>
          </div>
          <p className="text-xs text-muted-foreground py-2">
            Nothing to act on right now — your knowledge base looks well-connected.
          </p>
        </div>
      </Section>
    );
  }

  return (
    <Section>
      <div className="surface-card rounded-2xl p-5">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className={cn("size-4.5", CATEGORY_TEXT.knowledge)} />
          <h2 className="text-section">Recommended Actions</h2>
        </div>
        <div className="space-y-2">
          {actions.slice(0, 6).map((action) => (
            <ActionRow key={action.id} action={action} />
          ))}
        </div>
      </div>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/* Resource effectiveness                                                      */
/* -------------------------------------------------------------------------- */

function ResourceEffectiveness({ resources }: { resources: ResourceEffectivenessView[] }) {
  return (
    <Section>
      <div className="surface-card rounded-2xl p-5">
        <div className="mb-3 flex items-center gap-2">
          <AlertTriangle className={cn("size-4.5", CATEGORY_TEXT.warning)} />
          <h2 className="text-section">Resource Effectiveness</h2>
        </div>
        <div className="space-y-1.5">
          {resources.slice(0, 6).map((r) => (
            <div
              key={r.id}
              className={cn(
                "flex items-center gap-2.5 rounded-xl border p-2.5",
                r.signal === "unproven" ? "border-border opacity-60" : "border-border",
              )}
            >
              <span className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">{r.title}</p>
                <p className="truncate text-[11px] text-muted-foreground">{r.evidence}</p>
              </span>
              <Badge variant={SIGNAL_BADGE_VARIANT[r.signal]}>{r.signal}</Badge>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
