"use client";

import { useState } from "react";
import { Brain, Sparkles, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { quickProject } from "@/app/(app)/actions/intake";

export function ProjectCreateForm() {
  const [pending, setPending] = useState(false);
  const [text, setText] = useState("");
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setPending(true);
    try {
      const res = await quickProject(text);
      setResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 pt-10">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">New Workspace</h1>
        <p className="text-sm text-muted-foreground">
          Describe the project naturally. The AI will generate milestones, tasks, estimates, and client links.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="relative mt-8">
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={"Lalith wants a CRM dashboard for Cenexa. Budget ₹45,000. Needs invoice, authentication, dashboard, reports. Delivery in four weeks..."}
            className="min-h-[160px] w-full resize-none bg-transparent px-4 py-4 text-base placeholder:text-muted-foreground focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                handleSubmit(e as any);
              }
            }}
          />
          <div className="flex items-center justify-between border-t border-border/50 bg-muted/30 px-4 py-3">
            <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-primary" />
              AI Project Generation
            </span>
            <Button
              type="submit"
              disabled={pending || !text.trim()}
              size="sm"
              className="h-8 gap-1.5"
            >
              {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Brain className="size-3.5" />}
              {pending ? "Generating workspace..." : "Generate"}
            </Button>
          </div>
        </div>
      </form>

      {result && (
        <div className="animate-in slide-in-from-bottom-2 fade-in mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
          <h3 className="font-medium text-emerald-400 flex items-center gap-2">
            <Sparkles className="size-4" /> Workspace Generated!
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Created the project workspace with {result.milestonesCount || 3} milestones, {result.tasksCount || 3} starter tasks, and {result.pipelineEntryId ? "a pipeline entry" : "project tracking"}.
          </p>
          {result.clientName && (
            <p className="mt-1 text-xs text-muted-foreground">
              Client linked: {result.clientName}{result.createdClient ? " (new CRM record created)" : ""}.
            </p>
          )}
          <Button
            className="mt-4 gap-1.5"
            variant="outline"
            onClick={() => window.location.href = `/projects/${result.projectId}`}
          >
            Open Workspace <ArrowRight className="size-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
