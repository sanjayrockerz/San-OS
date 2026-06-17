"use client";

import { useActionState, useEffect } from "react";
import { Target } from "lucide-react";

import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui-store";
import { setFocusMode, type ActionResult } from "@/app/(app)/settings/actions";
import { Constants, type Database } from "@/types/database";

type FocusMode = Database["public"]["Enums"]["focus_mode"];

const LABELS: Record<string, string> = {
  work: "Work",
  academic: "Academic",
  personal: "Personal",
  family: "Family",
  recovery: "Recovery",
  deep_focus: "Deep Focus",
  none: "All",
};

const initialResult: ActionResult | null = null;

export function FocusModeSwitcher({ initialMode }: { initialMode: string }) {
  const focusModeDisplay = useUIStore((s) => s.focusModeDisplay);
  const setFocusModeDisplay = useUIStore((s) => s.setFocusModeDisplay);
  const [, action] = useActionState(setFocusMode, initialResult);

  useEffect(() => {
    setFocusModeDisplay(initialMode as FocusMode);
    // Hydrate from server props on mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const modes = Constants.public.Enums.focus_mode;

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border bg-card p-1">
      <Target className="ml-1.5 size-3.5 shrink-0 text-muted-foreground" />
      {modes.map((mode) => (
        <form key={mode} action={action}>
          <input type="hidden" name="mode" value={mode} />
          <button
            type="submit"
            onClick={() => setFocusModeDisplay(mode)}
            className={cn(
              "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
              focusModeDisplay === mode
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {LABELS[mode] ?? mode}
          </button>
        </form>
      ))}
    </div>
  );
}
