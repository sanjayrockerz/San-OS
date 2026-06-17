import { Moon } from "lucide-react";

import { Section } from "@/components/layout/page-transition";
import { SectionHeading } from "@/components/layout/page-header";
import type { EveningReview } from "@/lib/services";

/** Read-only end-of-day summary — distinct from the mood/notes reflection modal. */
export function EveningReviewPanel({ review }: { review: EveningReview }) {
  return (
    <Section>
      <div className="surface-card rounded-2xl p-5">
        <SectionHeading title="Today's Progress" />
        <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Moon className="size-3.5" />
          <span>Evening review</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border p-3">
            <p className="text-2xl font-bold tabular">{review.completedCount}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
          <div className="rounded-xl border border-border p-3">
            <p className="text-2xl font-bold tabular">{review.missedCount}</p>
            <p className="text-xs text-muted-foreground">Missed</p>
          </div>
          <div className="rounded-xl border border-border p-3">
            <p className="text-2xl font-bold tabular">{review.streak}</p>
            <p className="text-xs text-muted-foreground">Day streak</p>
          </div>
        </div>
        {review.topMissed.length > 0 && (
          <div className="mt-4 space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Unfinished:</p>
            {review.topMissed.map((m) => (
              <p key={m.notificationId} className="text-sm">
                • {m.title}
              </p>
            ))}
          </div>
        )}
      </div>
    </Section>
  );
}
