"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Sparkles, Library, Brain, RefreshCw, X, Loader2, Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createKnowledgeItem } from "@/app/(app)/vault/actions";

interface Props {
  problemId: string;
  problemTitle: string;
  inRevision: boolean;
}

export function PostSolvePanel({ problemId, problemTitle, inRevision }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const [showVaultForm, setShowVaultForm] = useState(false);
  const [vaultSaved, setVaultSaved] = useState(false);
  const [vaultError, setVaultError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (dismissed) return null;

  function submitVaultNote(formData: FormData) {
    setVaultError(null);
    formData.set("type", "algorithm");
    formData.set("linkEntityType", "problem");
    formData.set("linkEntityId", problemId);
    startTransition(async () => {
      const res = await createKnowledgeItem(null, formData);
      if (res.ok) {
        setVaultSaved(true);
        setShowVaultForm(false);
      } else {
        setVaultError(res.error);
      }
    });
  }

  return (
    <div className="surface-card relative mt-6 overflow-hidden rounded-2xl border border-primary/20 p-5">
      <div
        className="pointer-events-none absolute inset-0 opacity-5"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -20%, #7c7dff, transparent)",
        }}
      />
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Dismiss"
      >
        <X className="size-4" />
      </button>

      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="size-4 text-primary" />
        <p className="text-sm font-semibold text-primary">What&apos;s next?</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <button
          onClick={() => setShowVaultForm(!showVaultForm)}
          disabled={vaultSaved}
          className={cn(
            "flex items-center gap-2.5 rounded-xl border p-3 text-left text-sm transition-colors",
            vaultSaved
              ? "border-success/30 bg-success/5 text-success"
              : "border-border hover:border-primary/40 hover:bg-primary/5",
          )}
        >
          {vaultSaved ? (
            <Check className="size-4 shrink-0 text-success" />
          ) : (
            <Library className="size-4 shrink-0 text-primary" />
          )}
          <span className="font-medium">
            {vaultSaved ? "Saved to vault" : "Save algorithm note"}
          </span>
        </button>

        <Link
          href="/concepts/new"
          className="flex items-center gap-2.5 rounded-xl border border-border p-3 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-primary/5"
        >
          <Brain className="size-4 shrink-0 text-primary" />
          Write a concept note
        </Link>

        <Link
          href="/revision"
          className={cn(
            "flex items-center gap-2.5 rounded-xl border p-3 text-sm font-medium transition-colors",
            inRevision
              ? "border-success/30 bg-success/5 text-success"
              : "border-border hover:border-primary/40 hover:bg-primary/5",
          )}
        >
          <RefreshCw className="size-4 shrink-0" />
          {inRevision ? "In revision queue" : "Go to revision"}
        </Link>
      </div>

      {showVaultForm && (
        <form
          action={submitVaultNote}
          className="mt-4 space-y-3 rounded-xl border border-border bg-background-subtle/40 p-4"
        >
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Note title
            </label>
            <Input
              name="title"
              required
              defaultValue={`Algorithm: ${problemTitle}`}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Algorithm / approach
            </label>
            <Textarea
              name="content"
              rows={3}
              placeholder="Write your algorithm in your own words…"
              className="min-h-[80px]"
            />
          </div>
          {vaultError && (
            <p className="text-xs text-danger">{vaultError}</p>
          )}
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              Save to Vault
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowVaultForm(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
