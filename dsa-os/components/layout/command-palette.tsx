"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Search, CornerDownLeft, Plus, RefreshCw, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui-store";
import { NAV_ITEMS } from "./nav-config";

interface Command {
  id: string;
  label: string;
  group: string;
  icon: React.ComponentType<{ className?: string }>;
  run: () => void;
}

export function CommandPalette() {
  const open = useUIStore((s) => s.commandOpen);
  const setOpen = useUIStore((s) => s.setCommandOpen);
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  // Reset on open/close transition (render-time, not an effect).
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    setQuery("");
    setActive(0);
  }

  // Global ⌘K / Ctrl+K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        useUIStore.getState().toggleCommand();
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);

  const commands = useMemo<Command[]>(() => {
    const nav = NAV_ITEMS.map((item) => ({
      id: `nav-${item.href}`,
      label: `Go to ${item.label}`,
      group: "Navigation",
      icon: item.icon,
      run: () => router.push(item.href),
    }));
    const actions: Command[] = [
      { id: "add-problem", label: "Add new problem", group: "Actions", icon: Plus, run: () => router.push("/problems") },
      { id: "start-revision", label: "Start revision session", group: "Actions", icon: RefreshCw, run: () => router.push("/revision") },
      {
        id: "toggle-theme",
        label: `Switch to ${resolvedTheme === "dark" ? "light" : "dark"} theme`,
        group: "Actions",
        icon: resolvedTheme === "dark" ? Sun : Moon,
        run: () => setTheme(resolvedTheme === "dark" ? "light" : "dark"),
      },
    ];
    return [...actions, ...nav];
  }, [router, setTheme, resolvedTheme]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => c.label.toLowerCase().includes(q));
  }, [commands, query]);

  const run = (cmd?: Command) => {
    if (!cmd) return;
    setOpen(false);
    cmd.run();
  };

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      run(filtered[active]);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[12vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-popover shadow-2xl"
          >
            <div className="flex items-center gap-3 border-b border-border px-4">
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <input
                autoFocus
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                onKeyDown={onInputKey}
                placeholder="Search problems, concepts, roadmaps, notes…"
                className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <kbd className="hidden rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground sm:block">
                ESC
              </kbd>
            </div>

            <div className="max-h-[320px] overflow-y-auto p-2">
              {filtered.length === 0 && (
                <p className="px-3 py-8 text-center text-sm text-muted-foreground">No results found.</p>
              )}
              {filtered.map((cmd, i) => {
                const Icon = cmd.icon;
                return (
                  <button
                    key={cmd.id}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => run(cmd)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                      active === i ? "bg-accent text-foreground" : "text-muted-foreground"
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="flex-1 truncate text-foreground">{cmd.label}</span>
                    <span className="text-[10px] text-muted-foreground">{cmd.group}</span>
                    {active === i && <CornerDownLeft className="size-3.5 text-muted-foreground" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
