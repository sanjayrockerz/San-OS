"use client";

import { useUniversalContext } from "@/lib/context/universal-context";
import { FolderKanban, Users, Calendar, AlertTriangle, FileText, BrainCircuit, Activity, Link as LinkIcon, Sparkles } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function ContextDrawer() {
  const { context } = useUniversalContext();

  // If there's no active context, we could show a smart empty state
  const hasContext = context.currentProject || context.currentClient;

  return (
    <aside className="hidden xl:flex w-[320px] flex-col border-l border-border bg-card/40 backdrop-blur-2xl h-screen sticky top-0 shrink-0 overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <BrainCircuit className="size-4 text-primary" />
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Active Context</h3>
        </div>

        {context.isLoading ? (
          <div className="space-y-4">
            <div className="h-16 w-full rounded-2xl shimmer" />
            <div className="h-12 w-full rounded-2xl shimmer" />
            <div className="h-24 w-full rounded-2xl shimmer" />
          </div>
        ) : !hasContext ? (
          <div className="rounded-3xl border border-border/60 bg-muted/20 p-6 text-center shadow-sm">
            <Activity className="size-6 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm font-semibold">Global Scope</p>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              Press <kbd className="font-mono text-[10px] bg-background border border-border px-1.5 py-0.5 rounded">⌘K</kbd> and type to create a project, or drop a file anywhere to start building.
            </p>
          </div>
        ) : (
          <div className="space-y-8 animate-fade-in">
            {/* Identity */}
            <div className="space-y-4">
              {context.currentClient && (
                <div className="flex items-start gap-4">
                  <div className="size-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                    <Users className="size-5 text-amber-500" />
                  </div>
                  <div className="pt-0.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Client</p>
                    <Link href={`/clients/${context.currentClient.id}`} className="text-[15px] font-bold hover:text-primary transition-colors">
                      {context.currentClient.name}
                    </Link>
                  </div>
                </div>
              )}
              
              {context.currentProject && (
                <div className="flex items-start gap-4">
                  <div className="size-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                    <FolderKanban className="size-5 text-blue-500" />
                  </div>
                  <div className="pt-0.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Project</p>
                    <Link href={`/projects/${context.currentProject.id}`} className="text-[15px] font-bold hover:text-primary transition-colors">
                      {context.currentProject.name}
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Vital Signs */}
            <div className="grid grid-cols-2 gap-3 pt-6 border-t border-border/40">
              <div className="rounded-2xl border border-border/50 bg-background/50 p-4 shadow-sm">
                <Calendar className="size-4 text-muted-foreground mb-2" />
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Next Deadline</p>
                <p className="text-sm font-bold truncate">
                  {context.nextDeadline ? new Date(context.nextDeadline).toLocaleDateString() : 'None'}
                </p>
              </div>
              <div className={cn("rounded-2xl border p-4 shadow-sm", context.openRisksCount > 0 ? "border-warning/30 bg-warning/5" : "border-border/50 bg-background/50")}>
                <AlertTriangle className={cn("size-4 mb-2", context.openRisksCount > 0 ? "text-warning" : "text-muted-foreground")} />
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Open Risks</p>
                <p className="text-sm font-bold">{context.openRisksCount}</p>
              </div>
            </div>

            {/* Relations */}
            <div className="pt-6 border-t border-border/40 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-4">Linked Knowledge</p>
              
              <Link href="#" className="group flex items-center justify-between p-3 rounded-2xl border border-transparent hover:border-border hover:bg-background/50 hover:shadow-sm transition-all">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-xl bg-muted flex items-center justify-center group-hover:bg-background transition-colors">
                    <FileText className="size-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm font-semibold">Resources</span>
                </div>
                <span className="text-xs font-bold text-muted-foreground bg-muted group-hover:bg-background px-2 py-1 rounded-lg transition-colors">{context.relatedResourcesCount}</span>
              </Link>
              <Link href="#" className="group flex items-center justify-between p-3 rounded-2xl border border-transparent hover:border-border hover:bg-background/50 hover:shadow-sm transition-all">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-xl bg-muted flex items-center justify-center group-hover:bg-background transition-colors">
                    <LinkIcon className="size-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm font-semibold">Timeline Events</span>
                </div>
                <span className="text-xs font-bold text-muted-foreground bg-muted group-hover:bg-background px-2 py-1 rounded-lg transition-colors">{context.recentMeetingsCount}</span>
              </Link>
            </div>
            
            {/* Coach Advice */}
            <div className="pt-6 border-t border-border/40">
               <div className="rounded-3xl bg-primary/5 border border-primary/10 p-6 relative overflow-hidden shadow-sm">
                 <Sparkles className="size-24 text-primary/10 absolute -right-6 -bottom-6 rotate-12" />
                 <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-2 relative z-10">AI Chief of Staff</p>
                 <p className="text-sm font-medium text-foreground/80 leading-relaxed relative z-10">
                   You have logged 14 hours on this workspace recently. Based on typical patterns, an invoice milestone might be reached. 
                 </p>
                 <button className="mt-4 relative z-10 text-xs font-bold text-primary hover:underline">Draft Invoice →</button>
               </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
