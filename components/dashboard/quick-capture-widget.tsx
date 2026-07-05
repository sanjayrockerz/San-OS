"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import { Plus, Zap, Lightbulb, CheckSquare, FileText, Link as Link2, Code, CalendarIcon, Target, Folder, Bell, Sparkles, Brain } from "lucide-react";
import { Section } from "@/components/layout/page-transition";
import { quickCapture, brainDump, processDailyInbox, type InboxActionResult } from "@/app/(app)/execution/actions";
import { parseBrainDump, type CaptureType } from "@/lib/execution/brain-dump";
import { inferCompletionSignal } from "@/lib/execution/completion-inference";
import { cn } from "@/lib/utils";

const TYPE_META: Record<CaptureType, { icon: typeof Plus; label: string }> = {
  idea: { icon: Lightbulb, label: "Idea" },
  task: { icon: CheckSquare, label: "Task" },
  note: { icon: FileText, label: "Note" },
  link: { icon: Link2, label: "Link" },
  code: { icon: Code, label: "Code" },
  meeting: { icon: CalendarIcon, label: "Meeting" },
  goal: { icon: Target, label: "Goal" },
  project: { icon: Folder, label: "Project" },
  event: { icon: CalendarIcon, label: "Event" },
  notification: { icon: Bell, label: "Alert" },
};

const TYPES: CaptureType[] = ["idea", "task", "note", "link", "code", "meeting"];

function QuickMode() {
  const [result, formAction, pending] = useActionState(quickCapture, null);
  const [type, setType] = useState<CaptureType>("idea");
  const [content, setContent] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <>
      <div className="mb-2 flex flex-wrap gap-1">
        {TYPES.map((t) => {
          const { icon: Icon, label } = TYPE_META[t];
          return (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={cn(
                "flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium transition-colors",
                type === t
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <Icon className="size-2.5" />
              {label}
            </button>
          );
        })}
      </div>

      <form
        ref={formRef}
        action={formAction}
        onSubmit={() => result?.ok && setContent("")}
        className="space-y-2"
      >
        <input type="hidden" name="type" value={type} />
        <textarea
          name="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`Capture a ${TYPE_META[type].label.toLowerCase()}…`}
          className="min-h-[60px] w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              formRef.current?.requestSubmit();
            }
          }}
        />
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">⌘↵ to capture</span>
          <button
            type="submit"
            disabled={pending || !content.trim()}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 disabled:opacity-50"
          >
            <Plus className="size-3" />
            {pending ? "Capturing…" : "Capture"}
          </button>
        </div>
        {result && !result.ok && <p className="text-xs text-destructive">{result.error}</p>}
        {result?.ok && <p className="text-xs text-success">Captured!</p>}
      </form>
    </>
  );
}

function BrainDumpMode() {
  const [result, formAction, pending] = useActionState(brainDump, null);
  const [raw, setRaw] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  // Live, client-side preview using the same deterministic parser the server runs.
  const preview = useMemo(() => (raw.trim() ? parseBrainDump(raw) : []), [raw]);

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={() => result?.ok && setRaw("")}
      className="space-y-2"
    >
      <textarea
        name="raw"
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        placeholder={"Dump everything on your mind — one thought per line:\n\nWeDrip UI\nDeploy\nMeeting 4PM\nCold calling\nDSA\nGym\nCall parents"}
        className="min-h-[120px] w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
      />

      {preview.length > 0 && (
        <div className="space-y-1 rounded-lg border border-border bg-muted/30 p-2">
          <p className="mb-1 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            <Sparkles className="size-2.5" /> {preview.length} detected
          </p>
          <div className="max-h-40 space-y-1 overflow-y-auto">
            {preview.map((item, i) => {
              const { icon: Icon } = TYPE_META[item.type];
              return (
                <div key={i} className="flex items-center gap-2 text-[11px]">
                  <Icon className="size-3 shrink-0 text-primary" />
                  <span className="min-w-0 flex-1 truncate">{item.content}</span>
                  <span className="shrink-0 rounded bg-background px-1.5 py-0.5 text-[9px] text-muted-foreground">
                    {item.destination}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 tabular text-[9px] font-semibold",
                      item.priority >= 70 ? "text-danger" : item.priority >= 50 ? "text-warning" : "text-muted-foreground",
                    )}
                    title="Priority score"
                  >
                    {item.priority}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">Auto-classified & prioritised</span>
        <button
          type="submit"
          disabled={pending || preview.length === 0}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 disabled:opacity-50"
        >
          <Brain className="size-3" />
          {pending ? "Parsing…" : `Capture ${preview.length || ""}`.trim()}
        </button>
      </div>
      {result && !result.ok && <p className="text-xs text-destructive">{result.error}</p>}
      {result?.ok && <p className="text-xs text-success">Captured {result.created} items!</p>}
    </form>
  );
}

function InboxMode() {
  const [result, formAction, pending] = useActionState(processDailyInbox, null as InboxActionResult | null);
  const [raw, setRaw] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const preview = useMemo(() => {
    if (!raw.trim()) return { items: [], completion: null };
    return {
      items: parseBrainDump(raw),
      completion: inferCompletionSignal(raw),
    };
  }, [raw]);

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={() => result?.ok && setRaw("")}
      className="space-y-2"
    >
      <textarea
        name="raw"
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        placeholder={"Paste a plan, a brain dump, or a completion note:\n\nTomorrow 7-8 Gym\nCollege\nFinish Shawarma UI\nCompleted DP 2 hours"}
        className="min-h-[120px] w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
      />

      {preview.items.length > 0 && (
        <div className="space-y-1 rounded-lg border border-border bg-muted/30 p-2">
          <p className="mb-1 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            <Sparkles className="size-2.5" /> {preview.items.length} detected
          </p>
          <div className="max-h-40 space-y-1 overflow-y-auto">
            {preview.items.map((item, i) => {
              const { icon: Icon } = TYPE_META[item.type];
              return (
                <div key={i} className="flex items-center gap-2 text-[11px]">
                  <Icon className="size-3 shrink-0 text-primary" />
                  <span className="min-w-0 flex-1 truncate">{item.content}</span>
                  <span className="shrink-0 rounded bg-background px-1.5 py-0.5 text-[9px] text-muted-foreground">
                    {item.destination}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {preview.completion?.completed && (
        <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
          Detected completion signal for <span className="font-medium text-foreground">{preview.completion.task ?? "this work"}</span>
          {preview.completion.durationMinutes ? ` · ${preview.completion.durationMinutes}m` : ""}
          {preview.completion.confidence ? ` · confidence ${(preview.completion.confidence * 100).toFixed(0)}%` : ""}
        </div>
      )}

      {result?.needsClarification && result.choices && result.choices.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {result.choices.map((choice) => (
            <button
              key={choice}
              type="submit"
              name="minutes"
              value={String(choice)}
              className="rounded-full border border-border px-3 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
            >
              {choice >= 60 ? `${choice / 60} hour${choice > 60 ? "s" : ""}` : `${choice} min`}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">One inbox for plans, dumps, and completion notes</span>
        <button
          type="submit"
          disabled={pending || !raw.trim()}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 disabled:opacity-50"
        >
          <Brain className="size-3" />
          {pending ? "Processing…" : "Process"}
        </button>
      </div>
      {result && !result.ok && !result.needsClarification && <p className="text-xs text-destructive">{result.error}</p>}
      {result?.ok && <p className="text-xs text-success">{result.kind} accepted · {result.detectedItems} item(s)</p>}
      {result?.message && !result.ok && <p className="text-xs text-muted-foreground">{result.message}</p>}
    </form>
  );
}

export function QuickCaptureWidget() {
  const [mode, setMode] = useState<"inbox" | "quick" | "dump">("inbox");

  return (
    <Section>
      <div className="surface-card rounded-2xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="size-4 text-primary" />
            <p className="text-title">Daily Inbox</p>
          </div>
          <div className="flex gap-0.5 rounded-lg bg-muted p-0.5">
            <button
              type="button"
              onClick={() => setMode("inbox")}
              className={cn(
                "rounded-md px-2 py-0.5 text-[10px] font-medium transition-colors",
                mode === "inbox" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
              )}
            >
              Inbox
            </button>
            <button
              type="button"
              onClick={() => setMode("quick")}
              className={cn(
                "rounded-md px-2 py-0.5 text-[10px] font-medium transition-colors",
                mode === "quick" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
              )}
            >
              Quick
            </button>
            <button
              type="button"
              onClick={() => setMode("dump")}
              className={cn(
                "flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium transition-colors",
                mode === "dump" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
              )}
            >
              <Brain className="size-2.5" /> Brain Dump
            </button>
          </div>
        </div>

        {mode === "inbox" ? <InboxMode /> : mode === "quick" ? <QuickMode /> : <BrainDumpMode />}
      </div>
    </Section>
  );
}
