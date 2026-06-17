"use client";

import { useActionState, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { saveReflection } from "@/app/(app)/overview/actions";

const MOOD_LABELS = ["", "Rough", "Meh", "Okay", "Good", "Great"];
const MOOD_EMOJIS = ["", "😞", "😐", "🙂", "😊", "🔥"];

const STORAGE_KEY = "sanos:reflected";

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

interface Props {
  solvedToday: number;
  threshold?: number;
}

export function DailyReflectionModal({ solvedToday, threshold = 3 }: Props) {
  const [open, setOpen] = useState(false);
  const [mood, setMood] = useState<number | null>(null);

  useEffect(() => {
    if (solvedToday < threshold) return;
    try {
      const last = localStorage.getItem(STORAGE_KEY);
      if (last === getTodayKey()) return;
    } catch {
      // localStorage unavailable
    }
    const timer = setTimeout(() => setOpen(true), 2000);
    return () => clearTimeout(timer);
  }, [solvedToday, threshold]);

  type ReflectionResult = { ok: true } | { ok: false; error: string };
  const [result, action, pending] = useActionState(
    async (_prev: ReflectionResult | null, formData: FormData) => {
      const res = await saveReflection(_prev, formData);
      if (res.ok) {
        try { localStorage.setItem(STORAGE_KEY, getTodayKey()); } catch {}
        setOpen(false);
      }
      return res;
    },
    null as ReflectionResult | null,
  );

  function dismiss() {
    try { localStorage.setItem(STORAGE_KEY, getTodayKey()); } catch {}
    setOpen(false);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-end justify-center px-4 pb-6 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={dismiss}
          />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
          >
            <div className="flex items-start justify-between p-5 pb-0">
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Sparkles className="size-4" />
                </span>
                <div>
                  <h2 className="text-sm font-semibold">Daily Reflection</h2>
                  <p className="text-xs text-muted-foreground">
                    You&apos;ve solved {solvedToday} problem{solvedToday === 1 ? "" : "s"} today.
                  </p>
                </div>
              </div>
              <button
                onClick={dismiss}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            <form action={action} className="p-5 space-y-5">
              {/* Mood picker */}
              <div>
                <Label className="mb-2 block text-xs">How did today feel?</Label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMood(m)}
                      className={`flex-1 rounded-xl border py-2.5 text-center text-lg transition-all ${
                        mood === m
                          ? "border-primary bg-primary/10 scale-105"
                          : "border-border hover:border-border-strong"
                      }`}
                      title={MOOD_LABELS[m]}
                    >
                      {MOOD_EMOJIS[m]}
                      <span className="mt-0.5 block text-[9px] text-muted-foreground">
                        {MOOD_LABELS[m]}
                      </span>
                    </button>
                  ))}
                </div>
                {mood && (
                  <input type="hidden" name="mood" value={mood} />
                )}
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <Label htmlFor="reflection-notes" className="text-xs">
                  Quick note <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Textarea
                  id="reflection-notes"
                  name="notes"
                  rows={3}
                  placeholder="What went well? What felt hard? Any breakthrough?"
                />
              </div>

              {result && !result.ok && (
                <p className="text-xs text-danger">{result.error}</p>
              )}

              <div className="flex gap-2">
                <Button type="submit" className="flex-1" disabled={pending}>
                  {pending ? "Saving…" : "Save Reflection"}
                </Button>
                <Button type="button" variant="secondary" onClick={dismiss}>
                  Skip
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
