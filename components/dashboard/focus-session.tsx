"use client";

import { useActionState, useState } from "react";
import { CheckCircle2, PartyPopper } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { FocusStep } from "@/lib/services";
import { completeFocusStep, startFocusAction, type ActionResult } from "@/app/(app)/overview/actions";

const initialResult: ActionResult | null = null;

function StepRow({
  step,
  state,
  onDone,
}: {
  step: FocusStep;
  state: "done" | "current" | "upcoming";
  onDone: () => void;
}) {
  const [, action, pending] = useActionState(
    async (_prev: ActionResult | null, formData: FormData) => {
      const res = await completeFocusStep(_prev, formData);
      if (res.ok) onDone();
      return res;
    },
    initialResult,
  );

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border p-3 transition-colors",
        state === "done" && "border-success/30 bg-success/5",
        state === "current" && "border-primary/40 bg-primary/5",
        state === "upcoming" && "border-border opacity-50",
      )}
    >
      <span
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-semibold",
          state === "done"
            ? "border-success bg-success text-success-foreground"
            : "border-border text-muted-foreground",
        )}
      >
        {state === "done" ? <CheckCircle2 className="size-3.5" /> : step.stepNumber}
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-medium", state === "done" && "line-through text-muted-foreground")}>
          {step.action.title}
        </p>
        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{step.action.detail}</p>
        {state === "current" && (
          <div className="mt-2 flex items-center gap-2">
            <form action={startFocusAction}>
              <input type="hidden" name="actionId" value={step.action.id} />
              <input type="hidden" name="actionKind" value={step.action.kind} />
              <input type="hidden" name="actionSource" value={step.action.source} />
              <input type="hidden" name="href" value={step.action.href} />
              <Button type="submit" size="sm" variant="secondary">
                Start Now
              </Button>
            </form>
            <form action={action}>
              <input type="hidden" name="actionId" value={step.action.id} />
              <input type="hidden" name="actionKind" value={step.action.kind} />
              <input type="hidden" name="actionSource" value={step.action.source} />
              <Button type="submit" size="sm" disabled={pending}>
                {pending ? "Saving…" : "Mark done"}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Guided multi-step session — steps are derived from the already
 * focus-mode-gated recommended plan (no extra fetch). Only the first
 * not-yet-done step is interactive; earlier steps show as completed, later
 * ones are dimmed until reached. "Start Now" always opens the action's real
 * href — there is no in-app substitute workflow, satisfying "no dead-end
 * recommendations".
 */
export function FocusSession({ steps }: { steps: FocusStep[] }) {
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());

  if (steps.length === 0) {
    return <p className="text-xs text-muted-foreground py-2">Nothing to focus on right now.</p>;
  }

  const currentIndex = steps.findIndex((s) => !doneIds.has(s.action.id));
  const allDone = currentIndex === -1;

  if (allDone) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
        <PartyPopper className="size-6 text-success" />
        <p className="text-sm font-medium">Session complete — nice work.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {steps.map((step, i) => (
        <StepRow
          key={step.action.id}
          step={step}
          state={i < currentIndex ? "done" : i === currentIndex ? "current" : "upcoming"}
          onDone={() => setDoneIds((prev) => new Set(prev).add(step.action.id))}
        />
      ))}
    </div>
  );
}
