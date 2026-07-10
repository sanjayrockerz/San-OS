"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui-store";
import { NAV_GROUPS } from "./nav-config";

interface MobileNavDrawerUser {
  displayName: string;
  email: string | null;
}

/**
 * Mobile-only slide-over drawer exposing the full NAV_GROUPS structure that
 * the desktop Sidebar already renders. Mirrors the AnimatePresence/motion
 * conventions used by CommandPalette and AddEntryModal so it feels native to
 * the rest of the shell rather than bolted on.
 */
export function MobileNavDrawer({ user }: { user: MobileNavDrawerUser }) {
  const open = useUIStore((s) => s.mobileNavOpen);
  const setOpen = useUIStore((s) => s.setMobileNavOpen);
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const initial = user.displayName.charAt(0).toUpperCase() || "U";

  // Remember whatever had focus before opening (the hamburger trigger) so we
  // can return focus to it on close, and move focus into the panel.
  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement as HTMLElement | null;
      closeButtonRef.current?.focus();
    } else {
      triggerRef.current?.focus?.();
    }
  }, [open]);

  // Escape closes; Tab is trapped within the panel while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusable = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setOpen(false)}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Main navigation"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="surface-card absolute inset-y-0 left-0 flex w-[min(280px,85vw)] max-w-[85vw] flex-col rounded-none border-y-0 border-l-0"
          >
            {/* Header */}
            <div className="flex h-16 items-center justify-between gap-3 border-b border-border px-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-7 overflow-hidden items-center justify-center rounded-md bg-white/10 shadow shadow-primary/20 border border-white/10">
                  <img src="/logo.png" alt="San OS" className="size-full object-cover" />
                </div>
                <span className="text-sm font-semibold tracking-tight bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">San OS</span>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                aria-label="Close navigation"
                onClick={() => setOpen(false)}
                className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <X className="size-[18px]" />
              </button>
            </div>

            {/* Profile */}
            <div className="mx-3 mt-3 flex items-center gap-3 rounded-xl border border-border bg-background-subtle/50 p-2.5">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[#a855f7] text-xs font-semibold text-white">
                {initial}
              </div>
              <div className="min-w-0 leading-tight">
                <p className="truncate text-xs font-semibold capitalize">{user.displayName}</p>
                {user.email && (
                  <p className="truncate text-[10px] text-muted-foreground">{user.email}</p>
                )}
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-3">
              {NAV_GROUPS.map((group, gi) => (
                <div key={gi} className="space-y-1">
                  {group.heading && (
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
                        onClick={() => setOpen(false)}
                        className={cn(
                          "group relative flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors duration-150",
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
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              ))}
            </nav>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
