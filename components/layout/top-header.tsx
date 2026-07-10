"use client";

import Link from "next/link";
import { Search, Bell, Plus, PanelRightClose, PanelRightOpen } from "lucide-react";

import { useUIStore } from "@/store/ui-store";
import { ThemeToggle } from "./theme-toggle";

export function TopHeader({ unreadCount = 0 }: { unreadCount?: number }) {
  const setOpen = useUIStore((s) => s.setCommandOpen);
  const setAddEntryOpen = useUIStore((s) => s.setAddEntryOpen);
  const contextDrawerOpen = useUIStore((s) => s.contextDrawerOpen);
  const toggleContextDrawer = useUIStore((s) => s.toggleContextDrawer);

  const today = new Date().toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <header className="glass sticky top-0 z-30 hidden h-16 items-center gap-3 border-b border-border px-4 lg:flex xl:px-6">
      {/* Search / command trigger */}
      <button
        onClick={() => setOpen(true)}
        className="group flex h-9 min-w-0 flex-1 max-w-sm items-center gap-2.5 rounded-lg border border-border bg-card px-3 text-sm text-muted-foreground transition-colors hover:border-border-strong"
      >
        <Search className="size-4 shrink-0" />
        <span className="flex-1 min-w-0 truncate text-left hidden sm:block">Search problems, concepts, roadmaps…</span>
        <span className="flex-1 min-w-0 truncate text-left sm:hidden">Search…</span>
        <kbd className="hidden items-center gap-0.5 rounded border border-border px-1.5 py-0.5 text-[10px] font-medium xl:flex">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-2 shrink-0">
        <button
          onClick={() => setAddEntryOpen(true)}
          className="flex h-9 items-center gap-2 rounded-lg bg-primary px-3.5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 active:scale-[0.98]"
        >
          <Plus className="size-4" />
          <span className="hidden xl:inline">Add Entry</span>
        </button>
        <span className="hidden xl:block text-xs font-medium text-muted-foreground">{today}</span>
        <ThemeToggle />
        <button
          onClick={toggleContextDrawer}
          title={contextDrawerOpen ? "Close Context Drawer" : "Open Context Drawer"}
          className="hidden lg:flex size-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          {contextDrawerOpen ? <PanelRightClose className="size-4" /> : <PanelRightOpen className="size-4" />}
        </button>
        <Link
          href="/notifications"
          aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : "Notifications"}
          className="relative flex size-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Bell className="size-[18px]" />
          {unreadCount > 0 && (
            <span className="absolute right-2 top-2 size-1.5 rounded-full bg-primary" />
          )}
        </Link>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            title="Sign out"
            className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[#a855f7] text-xs font-semibold text-white transition-opacity hover:opacity-80"
          >
            S
          </button>
        </form>
      </div>
    </header>
  );
}
