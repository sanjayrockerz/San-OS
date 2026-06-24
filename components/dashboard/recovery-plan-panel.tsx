import { CalendarClock } from "lucide-react";

import { Section } from "@/components/layout/page-transition";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { RecoveryPlan } from "@/lib/services";
import { CATEGORY_TEXT } from "@/lib/design/category";
import { MissedWorkPanel } from "./missed-work-panel";

const LABEL_OVERRIDES: Record<string, string> = {
  learning: "DSA & Revision",
  academic: "Academic",
  project: "Projects",
  personal: "Personal",
  health: "Health",
  general: "General",
};

/**
 * Recovery Plan — turns HabitEngineService's flat missed-work queue into
 * achievable time blocks ("30 min DP, 20 min Cloud") instead of a bare
 * overdue list. Each item still resolves through the existing
 * MissedWorkPanel/completeNotification flow — no new mutation path.
 */
export function RecoveryPlanPanel({ recovery }: { recovery: RecoveryPlan }) {
  if (recovery.totalMissed === 0) return null;

  return (
    <Section>
      <div className="surface-card rounded-2xl border-warning/30 p-5">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CalendarClock className={cn("size-4.5", CATEGORY_TEXT.warning)} />
            <h2 className="text-section">Recovery Plan</h2>
          </div>
          <Badge variant="warning">~{recovery.totalMinutes} min total</Badge>
        </div>
        <p className="mb-4 text-xs text-muted-foreground">
          You missed {recovery.totalMissed} item{recovery.totalMissed === 1 ? "" : "s"}. Here&apos;s an
          achievable way to catch up, broken into short blocks.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recovery.blocks.map((block) => (
            <div key={block.label} className="rounded-xl border border-border p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold">{LABEL_OVERRIDES[block.label] ?? block.label}</p>
                <span className="text-xs font-medium text-muted-foreground">{block.minutes} min</span>
              </div>
              <MissedWorkPanel items={block.items} bare />
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
