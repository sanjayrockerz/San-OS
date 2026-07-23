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

      {/* AI Explains Result display */}
      {result && (
        <div className="animate-in space-y-4 slide-in-from-bottom-2 mt-6">
          <div className="rounded-3xl border border-primary/20 bg-primary/5 p-6 shadow-sm relative overflow-hidden">
            <Sparkles className="absolute -right-4 -top-4 size-24 text-primary/10 rotate-12" />
            
            <div className="relative z-10 space-y-5">
              {result.requiresConfirmation && (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs uppercase tracking-wider">
                    <Sparkles className="size-4" /> Action Requires Confirmation
                  </div>
                  <p className="text-sm font-medium text-foreground">{result.confirmationMessage}</p>
                  {result.paymentDetected && (
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>• Client: <span className="font-semibold text-foreground">{result.paymentDetected.clientName}</span></p>
                      <p>• Amount: <span className="font-semibold text-emerald-400">₹{result.paymentDetected.amount}</span></p>
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        alert("Confirmed and executed via Event Bus!");
                        setResult({ ...result, requiresConfirmation: false });
                      }}
                      className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600"
                    >
                      Confirm & Execute
                    </button>
                    <button
                      type="button"
                      onClick={() => setResult(null)}
                      className="rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/80"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1">AI Explains</p>
                <p className="text-sm font-semibold">I have automatically created the following based on your input:</p>
              </div>

              <div className="space-y-2.5">
                {result.resolvedProject && (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-500" />
                    <span className="text-sm font-medium">Linked Project</span>
                    <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded-md border border-border">
                      {result.resolvedProject.name}
                    </span>
                  </div>
                )}
                {result.resolvedClient && (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-500" />
                    <span className="text-sm font-medium">Linked Client</span>
                    <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded-md border border-border">
                      {result.resolvedClient.name}
                    </span>
                  </div>
                )}
                {result.resolvedConcepts?.map((c: any) => (
                  <div key={c.id} className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-500" />
                    <span className="text-sm font-medium">Identified Concept</span>
                    <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded-md border border-border">
                      {c.name}
                    </span>
                  </div>
                ))}
                {result.capturedItems?.map((item: any, i: number) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-500" />
                    <span className="text-sm font-medium truncate">Captured</span>
                    <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded-md border border-border truncate max-w-[200px]">
                      {item.content}
                    </span>
                  </div>
                ))}
                {result.knowledgeEntryCreated && (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-500" />
                    <span className="text-sm font-medium">Added to Knowledge Vault</span>
                  </div>
                )}
                {result.timelineEventEmitted && (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-500" />
                    <span className="text-sm font-medium">Logged to Timeline</span>
                  </div>
                )}
              </div>
              
              <div className="pt-4 border-t border-primary/10 flex items-center gap-4">
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">Domain</p>
                  <p className="text-xs font-semibold capitalize text-foreground">{result.domain}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">Intent</p>
                  <p className="text-xs font-semibold capitalize text-foreground">{result.type.replace('_', ' ')}</p>
                </div>
                {result.technologies?.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">Stack</p>
                    <p className="text-xs font-semibold capitalize text-foreground">{result.technologies.join(', ')}</p>
                  </div>
                )}
              </div>
            </div>
            
            {result.error && (
              <div className="mt-4 p-3 bg-destructive/10 text-destructive text-xs rounded-xl border border-destructive/20 relative z-10">
                {result.error}
              </div>
            )}
          </div>
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
            <QuickActionButton label="New Project" action={quickProject} text={text} />
            <QuickActionButton label="New Client" action={quickClient} text={text} />
          </div>
        )}
      </div>
    </div>
  );
}

function QuickActionButton({
  label,
  action,
  text,
}: {
  label: string;
  action: (text: string) => Promise<any>;
  text: string;
}) {
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      disabled={pending || !text.trim()}
      onClick={async () => {
        setPending(true);
        try {
          await action(text.trim());
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
