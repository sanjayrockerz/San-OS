"use client";

import { Search, Bell } from "lucide-react";

import { useUIStore } from "@/store/ui-store";
import { ThemeToggle } from "./theme-toggle";

export function TopHeader() {
  const setOpen = useUIStore((s) => s.setCommandOpen);

  const today = new Date(2025, 4, 25).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <header className="glass sticky top-0 z-30 hidden h-16 items-center gap-4 border-b border-border px-6 lg:flex">
      {/* Search / command trigger */}
      <button
        onClick={() => setOpen(true)}
        className="group flex h-9 w-full max-w-md items-center gap-2.5 rounded-lg border border-border bg-card px-3 text-sm text-muted-foreground transition-colors hover:border-border-strong"
      >
        <Search className="size-4" />
        <span className="flex-1 text-left">Search problems, concepts, roadmaps…</span>
        <kbd className="flex items-center gap-0.5 rounded border border-border px-1.5 py-0.5 text-[10px] font-medium">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-2">
        <span className="hidden text-xs font-medium text-muted-foreground xl:block">{today}</span>
        <ThemeToggle />
        <button className="relative flex size-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
          <Bell className="size-[18px]" />
          <span className="absolute right-2 top-2 size-1.5 rounded-full bg-primary" />
        </button>
        <div className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[#a855f7] text-xs font-semibold text-white">
          S
        </div>
      </div>
    </header>
  );
}
