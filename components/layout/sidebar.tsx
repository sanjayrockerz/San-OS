"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { Flame, PanelLeftClose, PanelLeft, Zap } from "lucide-react";

import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui-store";
import { NAV_GROUPS } from "./nav-config";

interface SidebarUser {
  displayName: string;
  email: string | null;
}

export function Sidebar({ user }: { user: SidebarUser }) {
  const pathname = usePathname();
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggle = useUIStore((s) => s.toggleSidebar);
  const initial = user.displayName.charAt(0).toUpperCase() || "U";

  // Auto-collapse on tablet screens (< 1024px) on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 1023px)");
    const stored = localStorage.getItem("san-os:sidebar-collapsed");
    // Only auto-collapse if no user preference stored
    if (stored === null && mq.matches) {
      document.documentElement.style.setProperty("--sidebar-collapsed", "true");
      useUIStore.getState().toggleSidebar();
    }
  }, []);

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-border bg-card/70 backdrop-blur-xl transition-[width] duration-200 ease-out lg:flex",
        collapsed ? "w-[72px]" : "w-[248px]"
      )}
    >
      {/* Brand */}
      <div className={cn("flex h-16 items-center gap-3 px-4", collapsed && "justify-center px-0")}>
        <div className="flex size-9 shrink-0 overflow-hidden items-center justify-center rounded-xl bg-white/10 shadow-lg shadow-primary/20 border border-white/10">
          <img src="/logo.png" alt="San OS Logo" className="size-full object-cover" />
        </div>
        {!collapsed && (
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold tracking-tight bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">San OS</p>
            <p className="truncate text-[11px] text-primary/80 font-medium">Personal Engine</p>
          </div>
        )}
      </div>

      {/* Profile */}
      <div className={cn("mx-3 mb-2 flex items-center gap-3 rounded-xl border border-border bg-background-subtle/50 p-2.5", collapsed && "mx-2 justify-center")}>
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[#a855f7] text-xs font-semibold text-white">
          {initial}
        </div>
        {!collapsed && (
          <div className="min-w-0 leading-tight">
            <p className="truncate text-xs font-semibold capitalize">{user.displayName}</p>
            {user.email && (
              <p className="truncate text-[10px] text-muted-foreground">{user.email}</p>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-2">
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi} className="space-y-1">
            {group.heading && !collapsed && (
              <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                {group.heading}
              </p>
            )}
            {group.items.map((item) => {
              const active = pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-medium transition-all duration-150",
                    collapsed && "justify-center px-0",
                    active
                      ? "bg-primary/10 text-primary shadow-[var(--surface-highlight)]"
                      : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                  )}
                >
                  <Icon
                    className={cn(
                      "size-[18px] shrink-0 transition-colors",
                      active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Streak / readiness — see the Overview page for live numbers; the
          sidebar doesn't have this data without an extra layout-level fetch,
          so it links there instead of showing stale or fake figures. */}
      <div className="p-3">
        {!collapsed ? (
          <Link
            href="/overview"
            className="block rounded-xl border border-border bg-gradient-to-br from-primary/10 to-transparent p-3.5 transition-colors hover:border-border-strong"
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Flame className="size-3.5 text-warning" /> Streak &amp; readiness
              </span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Zap className="size-3 text-primary" /> See your live numbers on Overview
            </div>
          </Link>
        ) : (
          <Link href="/overview" className="flex justify-center">
            <Flame className="size-5 text-warning" />
          </Link>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={toggle}
        className="m-3 mt-0 flex items-center justify-center gap-2 rounded-lg border border-border py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        {collapsed ? <PanelLeft className="size-4" /> : (
          <>
            <PanelLeftClose className="size-4" /> Collapse
          </>
        )}
      </button>
    </aside>
  );
}
