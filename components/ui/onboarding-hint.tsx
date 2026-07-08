"use client";

import { useState } from "react";
import { X, Sparkles } from "lucide-react";

export function OnboardingHint({ storageKey = "sanos_onboarding_seen" }: { storageKey?: string }) {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem(storageKey) === "true";
  });

  if (dismissed) return null;

  return (
    <div className="relative mb-6 rounded-2xl border border-primary/20 bg-primary/5 p-5">
      <button
        onClick={() => { localStorage.setItem(storageKey, "true"); setDismissed(true); }}
        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
      >
        <X className="size-4" />
      </button>
      <div className="flex items-start gap-3">
        <Sparkles className="size-5 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-sm">Welcome to SanOS</p>
          <p className="text-sm text-muted-foreground mt-1">
            Start by adding a problem, creating a concept, or importing your LeetCode history.
            Press <kbd className="font-mono text-xs bg-muted px-1 py-0.5 rounded">&lrm;&#8984;K</kbd> anytime to search.
          </p>
        </div>
      </div>
    </div>
  );
}
