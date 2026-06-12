"use client";

import { Terminal, Search } from "lucide-react";

import { useUIStore } from "@/store/ui-store";
import { ThemeToggle } from "./theme-toggle";

export function TopBar() {
  const setOpen = useUIStore((s) => s.setCommandOpen);

  return (
    <header className="glass sticky top-0 z-30 flex h-[56px] items-center justify-between gap-3 border-b border-border px-4 lg:hidden">
      <div className="flex items-center gap-2.5">
        <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Terminal className="size-4" />
        </div>
        <span className="text-sm font-semibold tracking-tight">DSA OS</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setOpen(true)}
          className="flex size-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground"
        >
          <Search className="size-[18px]" />
        </button>
        <ThemeToggle />
      </div>
    </header>
  );
}
