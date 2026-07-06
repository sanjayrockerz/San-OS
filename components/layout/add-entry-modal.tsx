"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  MessageSquarePlus,
  Puzzle,
  BookOpen,
  GraduationCap,
  Video,
  Rocket,
  StickyNote,
  ArrowRight,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui-store";

interface EntryOption {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  enabled: boolean;
}

const OPTIONS: EntryOption[] = [
  {
    id: "intake",
    label: "Universal Intake",
    description: "Natural text — auto-detects projects, clients, concepts.",
    icon: MessageSquarePlus,
    href: "/intake",
    enabled: true,
  },
  {
    id: "dsa",
    label: "DSA Problem",
    description: "Log a problem, your thinking, code and reflection.",
    icon: Puzzle,
    href: "/problems/new",
    enabled: true,
  },
  {
    id: "concept",
    label: "Concept Note",
    description: "Capture a concept in your own words.",
    icon: BookOpen,
    href: "/concepts/new",
    enabled: true,
  },
  {
    id: "assignment",
    label: "IIT Assignment",
    description: "Track an academic assignment or deadline.",
    icon: GraduationCap,
    href: "/iit-workspace",
    enabled: true,
  },
  {
    id: "resource",
    label: "Learning Resource",
    description: "Save a video, article or reference.",
    icon: Video,
    href: "/vault",
    enabled: true,
  },
  {
    id: "project",
    label: "Project Update",
    description: "Note progress on a build or side project.",
    icon: Rocket,
    href: "/intake",
    enabled: true,
  },
  {
    id: "note",
    label: "Quick Note",
    description: "Jot down a quick thought.",
    icon: StickyNote,
    href: "/vault",
    enabled: true,
  },
];

export function AddEntryModal() {
  const open = useUIStore((s) => s.addEntryOpen);
  const setOpen = useUIStore((s) => s.setAddEntryOpen);
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);

  const select = (option: EntryOption) => {
    if (!option.enabled || !option.href) return;
    setOpen(false);
    router.push(option.href);
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
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-popover shadow-2xl"
          >
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-sm font-semibold">
                What do you want to add?
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Capture into your engineering OS.
              </p>
            </div>

            <div className="grid gap-1.5 p-3 sm:grid-cols-2">
              {OPTIONS.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.id}
                    onClick={() => select(option)}
                    disabled={!option.enabled}
                    className={cn(
                      "group flex items-start gap-3 rounded-xl border border-transparent p-3 text-left transition-colors",
                      option.enabled
                        ? "hover:border-border hover:bg-accent"
                        : "cursor-not-allowed opacity-50",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-lg",
                        option.enabled
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      <Icon className="size-[18px]" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                        {option.label}
                        {!option.enabled && (
                          <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Soon
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                        {option.description}
                      </span>
                    </span>
                    {option.enabled && (
                      <ArrowRight className="size-4 shrink-0 translate-x-0 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                    )}
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
