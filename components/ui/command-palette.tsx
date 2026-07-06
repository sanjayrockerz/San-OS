"use client";

import { useEffect, useState, useRef, useTransition } from "react";
import { Search, Loader2, Sparkles, Command, CheckCircle2 } from "lucide-react";
import { useUniversalContext } from "@/lib/context/universal-context";
import { submitIntake } from "@/app/(app)/actions/intake";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<any>(null);
  const { context } = useUniversalContext();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setInput("");
      setResult(null);
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    startTransition(async () => {
      try {
        const res = await submitIntake({
          text: input,
          currentProjectId: context.currentProject?.id,
          currentClientId: context.currentClient?.id,
        });
        setResult(res.result);
        setTimeout(() => setOpen(false), 2000);
      } catch (err) {
        console.error(err);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <form onSubmit={handleSubmit} className="flex items-center gap-3 border-b border-border px-4 py-4">
          <Command className="h-5 w-5 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a command or ask a question..."
            className="flex-1 bg-transparent text-lg outline-none placeholder:text-muted-foreground"
            disabled={isPending}
          />
          {isPending && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
        </form>
        
        {result ? (
          <div className="bg-emerald-500/10 px-4 py-4">
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">Action processed successfully</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground ml-7">
              Identified as: {result.type.replace('_', ' ')}.
              {result.resolvedProject ? ` Linked to ${result.resolvedProject.name}.` : ''}
            </p>
          </div>
        ) : (
          <>
            <div className="bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span>
                  Context: {context.currentProject?.name ?? "Global"} {context.currentClient ? `· ${context.currentClient.name}` : ""}
                </span>
              </div>
            </div>

            {!input && (
              <div className="p-2">
                <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">Suggestions</div>
                <div className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-accent hover:text-accent-foreground">
                  <Search className="h-4 w-4" /> Plan tomorrow
                </div>
                <div className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-accent hover:text-accent-foreground">
                  <Search className="h-4 w-4" /> Open DP roadmap
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
