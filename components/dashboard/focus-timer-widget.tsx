"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";

import { Section } from "@/components/layout/page-transition";
import { ProgressRing } from "@/components/charts/progress-ring";
import { Sparkline } from "@/components/charts/sparkline";
import { FocusModeSwitcher } from "./focus-mode-switcher";

const DEFAULT_MINUTES = 25;
const DEFAULT_SECONDS = DEFAULT_MINUTES * 60;

/** Decorative momentum trend — not tied to real metrics, purely ambient texture. */
const TREND = [3, 5, 4, 6, 5, 7, 6, 8];

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

/** Simple client-side Pomodoro-style focus timer. No backend wiring — it's a
 * standalone execution aid, not a tracked session (yet). */
export function FocusTimerWidget({ focusMode }: { focusMode: string }) {
  const [remaining, setRemaining] = useState(DEFAULT_SECONDS);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          setRunning(false);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const pct = Math.round(((DEFAULT_SECONDS - remaining) / DEFAULT_SECONDS) * 100);
  const finished = remaining === 0;

  return (
    <Section>
      <div className="surface-card rounded-2xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-title">Focus Mode</p>
        </div>
        <FocusModeSwitcher initialMode={focusMode} />

        <div className="mt-4 flex items-center gap-4">
          <ProgressRing value={pct} size={64} stroke={6}>
            <span className="text-sm font-bold tabular">{formatTime(remaining)}</span>
          </ProgressRing>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">
              {finished ? "Session complete" : running ? "Focusing…" : "Start to focus"}
            </p>
            <button
              type="button"
              onClick={() => {
                if (finished) {
                  setRemaining(DEFAULT_SECONDS);
                  setRunning(true);
                } else {
                  setRunning((r) => !r);
                }
              }}
              className="mt-2 inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 active:scale-[0.98]"
            >
              {running ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
              {running ? "Pause" : finished ? "Restart" : "Start"}
            </button>
            {!running && remaining < DEFAULT_SECONDS && remaining > 0 && (
              <button
                type="button"
                onClick={() => setRemaining(DEFAULT_SECONDS)}
                className="ml-2 inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <RotateCcw className="size-3.5" /> Reset
              </button>
            )}
          </div>
        </div>

        <Sparkline data={TREND} color="var(--primary)" width={280} height={32} className="mt-3 w-full" />
      </div>
    </Section>
  );
}
