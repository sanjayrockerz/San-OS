"use client";

import { useState, useEffect } from "react";
import { UniversalCapture } from "@/components/ui/universal-capture";
import { VoiceRecorder } from "@/components/ui/media-recorder";
import {
  Clock,
  Target,
  Plus,
  X,
  Zap,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

function LiveClock() {
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    function update() {
      setTime(
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
      );
    }
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  if (!time) return null;
  return <span className="tabular font-mono text-xs text-muted-foreground">{time}</span>;
}

function LiveDate() {
  const d = new Date();
  return (
    <span className="text-xs text-muted-foreground">
      {d.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      })}
    </span>
  );
}

export function ContextPanel() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Toggle button — only visible on mobile / small screens */}
      <button
        id="context-panel-toggle"
        onClick={() => setIsOpen(true)}
        aria-label="Open context panel"
        className="fixed bottom-20 right-4 z-40 flex items-center justify-center rounded-full bg-primary p-3 text-primary-foreground shadow-lg transition-all hover:scale-105 hover:bg-primary/90 active:scale-95 lg:hidden"
      >
        <Plus className="h-5 w-5" />
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Panel */}
      <div
        id="context-panel"
        className={[
          "fixed inset-y-0 right-0 z-50 flex w-80 flex-col border-l bg-card/95 shadow-2xl backdrop-blur-xl",
          "transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full",
          "lg:hidden",
        ].join(" ")}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-card/80 p-4 backdrop-blur-md">
          <div className="flex flex-col gap-0.5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Target className="h-4 w-4 text-primary" />
              Active Context
            </h2>
            <LiveDate />
          </div>
          <div className="flex items-center gap-2">
            <LiveClock />
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-4">
          {/* Quick capture */}
          <section className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5" />
              Quick Capture
            </h3>
            <UniversalCapture />
            <VoiceRecorder />
          </section>

          {/* Today at a glance */}
          <section>
            <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              Today at a Glance
            </h3>
            <div className="rounded-xl border border-border bg-background/60 p-3">
              <p className="text-xs text-muted-foreground">
                Open{" "}
                <a href="/execution" className="text-primary underline-offset-2 hover:underline">
                  Execution
                </a>{" "}
                to see your time blocks, or{" "}
                <a href="/goals" className="text-primary underline-offset-2 hover:underline">
                  Goals
                </a>{" "}
                for active objectives.
              </p>
            </div>
          </section>

          {/* Navigation shortcuts */}
          <section>
            <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Jump To
            </h3>
            <nav className="flex flex-col gap-1">
              {[
                { href: "/revision", label: "Revision Queue" },
                { href: "/execution", label: "Execution Engine" },
                { href: "/goals", label: "Active Goals" },
                { href: "/projects", label: "/Projects" },
                { href: "/finance", label: "Finance" },
              ].map(({ href, label }) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  {label}
                </a>
              ))}
            </nav>
          </section>
        </div>

        {/* Footer */}
        <div className="border-t p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">SanOS 3.0</span>
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        </div>
      </div>
    </>
  );
}
