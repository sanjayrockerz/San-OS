"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Terminal, Flame, PanelLeftClose, PanelLeft, Zap } from "lucide-react";

import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui-store";
import { NAV_GROUPS } from "./nav-config";

export function Sidebar() {
  const pathname = usePathname();
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggle = useUIStore((s) => s.toggleSidebar);

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-border bg-card/70 backdrop-blur-xl transition-[width] duration-200 ease-out lg:flex",
        collapsed ? "w-[72px]" : "w-[248px]"
      )}
    >
      {/* Brand */}
      <div className={cn("flex h-16 items-center gap-3 px-4", collapsed && "justify-center px-0")}>
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
          <Terminal className="size-5" />
        </div>
        {!collapsed && (
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold tracking-tight">DSA OS</p>
            <p className="truncate text-[11px] text-muted-foreground">Engineering OS</p>
          </div>
        )}
      </div>

      {/* Profile */}
      <div className={cn("mx-3 mb-2 flex items-center gap-3 rounded-xl border border-border bg-background-subtle/50 p-2.5", collapsed && "mx-2 justify-center")}>
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[#a855f7] text-xs font-semibold text-white">
          S
        </div>
        {!collapsed && (
          <div className="min-w-0 leading-tight">
            <p className="truncate text-xs font-semibold">Sanjay</p>
            <p className="truncate text-[10px] text-muted-foreground">Pro · Level 8</p>
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
                    "group relative flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors duration-150",
                    collapsed && "justify-center px-0",
                    active
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-primary transition-opacity duration-200",
                      active ? "opacity-100" : "opacity-0"
                    )}
                  />
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

      {/* Streak / readiness card */}
      <div className="p-3">
        {!collapsed ? (
          <div className="rounded-xl border border-border bg-gradient-to-br from-primary/10 to-transparent p-3.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Flame className="size-3.5 text-warning" /> Streak
              </span>
              <span className="text-sm font-semibold tabular">14d</span>
            </div>
            <div className="mt-2.5 flex gap-1">
              {Array.from({ length: 7 }).map((_, i) => (
                <span key={i} className={cn("h-1.5 flex-1 rounded-full", i < 6 ? "bg-warning" : "bg-muted")} />
              ))}
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Zap className="size-3 text-primary" /> 72% placement-ready
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <Flame className="size-5 text-warning" />
          </div>
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
