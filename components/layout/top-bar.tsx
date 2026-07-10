"use client";

import { Search, Menu } from "lucide-react";

import { useUIStore } from "@/store/ui-store";
import { ThemeToggle } from "./theme-toggle";

export function TopBar() {
  const setCommandOpen = useUIStore((s) => s.setCommandOpen);
  const setMobileNavOpen = useUIStore((s) => s.setMobileNavOpen);

  return (
    <header className="glass sticky top-0 z-30 flex h-[56px] items-center justify-between gap-3 border-b border-border px-4 lg:hidden">
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Open navigation menu"
          onClick={() => setMobileNavOpen(true)}
          className="flex size-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Menu className="size-[18px]" />
        </button>
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex size-7 overflow-hidden shrink-0 items-center justify-center rounded-md bg-white/10 shadow shadow-primary/20 border border-white/10">
            <img src="/logo.png" alt="San OS" className="size-full object-cover" />
          </div>
          <span className="text-sm font-semibold tracking-tight bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent truncate">San OS</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setCommandOpen(true)}
          className="flex size-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground"
        >
          <Search className="size-[18px]" />
        </button>
        <ThemeToggle />
      </div>
    </header>
  );
}
