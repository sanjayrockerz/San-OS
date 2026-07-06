"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { Brain, Sparkles, ArrowRight, BookOpen, FolderKanban, Users, Globe, CheckCircle2, Loader2, Target, Code2, Plus } from "lucide-react";
import { submitIntake, quickProject, quickClient } from "@/app/(app)/actions/intake";
import { cn } from "@/lib/utils";

const TYPE_BADGES: Record<string, { label: string; color: string }> = {
  problem_solve: { label: "Problem Solve", color: "text-purple-400 border-purple-500/30 bg-purple-500/10" },
  project_work: { label: "Project Work", color: "text-blue-400 border-blue-500/30 bg-blue-500/10" },
  learning: { label: "Learning", color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
  task: { label: "Task", color: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
  meeting: { label: "Meeting", color: "text-rose-400 border-rose-500/30 bg-rose-500/10" },
  note: { label: "Note", color: "text-gray-400 border-gray-500/30 bg-gray-500/10" },
  unknown: { label: "Note", color: "text-muted-foreground border-border bg-muted/30" },
};

const DOMAIN_BADGES: Record<string, string> = {
  learning: "text-purple-400",
  project: "text-blue-400",
  business: "text-amber-400",
  academic: "text-emerald-400",
  finance: "text-green-400",
  health: "text-rose-400",
  personal: "text-muted-foreground",
};

export function UniversalIntake() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<any>(null);
  const [text, setText] = useState("");
  const [showQuickActions, setShowQuickActions] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const entityCount = (result?.resolvedProject ? 1 : 0) + (result?.resolvedClient ? 1 : 0) + (result?.resolvedConcepts?.length || 0);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!text.trim() || pending) return;

    startTransition(async () => {
      try {
        const res = await submitIntake({ text });
        if (res.success) {
          setResult(res.result);
          setText("");
        }
      } catch (err) {
        console.error(err);
      }
    });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="space-y-3"
      >
        <div className="relative">
          <textarea
            name="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={"What happened? Dump it naturally — I'll figure out where it goes.\n\nWorked on the Dashboard UI for Acme Corp\nFixed a bug in the auth flow\nLearned about React Server Components\nMet with Priya about the Q4 roadmap"}
            className="min-h-[160px] w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                formRef.current?.requestSubmit();
              }
            }}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">⌘↵ to process · I auto-detect projects, clients, and concepts</span>
          <button
            type="submit"
            disabled={pending || !text.trim()}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 disabled:opacity-50"
          >
            {pending ? <Loader2 className="size-3 animate-spin" /> : <Brain className="size-3" />}
            {pending ? "Processing…" : "Process"}
          </button>
        </div>
      </form>

      {/* Result display */}
      {result && (
        <div className="animate-in space-y-3 slide-in-from-bottom-2">
          {/* Type + Domain badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-medium",
              TYPE_BADGES[result.type]?.color ?? TYPE_BADGES.unknown.color,
            )}>
              <Target className="size-2.5" />
              {TYPE_BADGES[result.type]?.label ?? "Note"}
            </span>
            <span className={cn(
              "inline-flex items-center gap-1 text-[10px] font-medium",
              DOMAIN_BADGES[result.domain] ?? "text-muted-foreground",
            )}>
              <Globe className="size-2.5" />
              {result.domain}
            </span>
            {result.technologies.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-0.5 text-[10px] font-medium text-sky-400">
                <Code2 className="size-2.5" />
                {result.technologies.join(", ")}
              </span>
            )}
          </div>

          {/* Entity resolutions */}
          {(result.resolvedProject || result.resolvedClient || result.resolvedConcepts.length > 0) && (
            <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
              <p className="mb-2 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                <Sparkles className="size-2.5" />
                {entityCount} entit{entityCount === 1 ? "y" : "ies"} resolved
              </p>
              <div className="flex flex-wrap gap-2">
                {result.resolvedProject && (
                  <a
                    href={`/projects/${result.resolvedProject.id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-[11px] font-medium text-blue-400 hover:bg-blue-500/20 transition-colors"
                  >
                    <FolderKanban className="size-3" />
                    {result.resolvedProject.name}
                  </a>
                )}
                {result.resolvedClient && (
                  <a
                    href={`/clients/${result.resolvedClient.id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-400 hover:bg-amber-500/20 transition-colors"
                  >
                    <Users className="size-3" />
                    {result.resolvedClient.name}
                  </a>
                )}
                {result.resolvedConcepts.map((c) => (
                  <span
                    key={c.id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-400"
                  >
                    <BookOpen className="size-3" />
                    {c.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Captured items preview */}
          {result.capturedItems.length > 0 && (
            <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
              <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Captured items
              </p>
              <div className="space-y-1">
                {result.capturedItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-[11px]">
                    <CheckCircle2 className="size-3 shrink-0 text-primary" />
                    <span className="min-w-0 flex-1 truncate">{item.content}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action feedback */}
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            {result.knowledgeEntryCreated && (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="size-3 text-emerald-400" />
                Saved to vault
              </span>
            )}
            {result.timelineEventEmitted && (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="size-3 text-blue-400" />
                Logged to timeline
              </span>
            )}
          </div>

          {result.error && (
            <p className="text-xs text-destructive">{result.error}</p>
          )}
        </div>
      )}

      {/* Quick actions */}
      <div className="border-t border-border/40 pt-4">
        <button
          type="button"
          onClick={() => setShowQuickActions(!showQuickActions)}
          className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowRight className={cn("size-3 transition-transform", showQuickActions && "rotate-90")} />
          Quick create
        </button>
        {showQuickActions && (
          <div className="mt-2 flex gap-2">
            <QuickActionButton label="New Project" action={quickProject} />
            <QuickActionButton label="New Client" action={quickClient} />
          </div>
        )}
      </div>
    </div>
  );
}

function QuickActionButton({ label, action }: { label: string; action: (text: string) => Promise<any> }) {
  const [pending, setPending] = useState(false);
  const text = "";

  return (
    <button
      type="button"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        try {
          await action(text || label);
        } finally {
          setPending(false);
        }
      }}
      className="flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-1.5 text-[11px] text-muted-foreground hover:bg-accent hover:text-foreground transition-colors disabled:opacity-50"
    >
      {pending ? <Loader2 className="size-3 animate-spin" /> : <Plus className="size-3" />}
      {label}
    </button>
  );
}
