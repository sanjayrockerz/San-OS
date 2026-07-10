"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Clock, ChevronRight, BookOpen } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { CATEGORY_TINT, type Category } from "@/lib/design/category";

export interface ConceptView {
  id: string;
  title: string;
  category: string | null;
  status: string;
  statusLabel: string;
  statusCategory: Category;
  confidence: number | null;
  topicName: string | null;
  patternName: string | null;
  updatedAt: string;
}

interface Props {
  concepts: ConceptView[];
}

const STATUS_FILTERS = ["all", "learning", "understood", "weak", "forgotten", "mastered"] as const;

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export function ConceptsClient({ concepts }: Props) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof STATUS_FILTERS)[number]>("all");

  const visible = concepts.filter((c) => {
    const matchesQuery =
      !query ||
      c.title.toLowerCase().includes(query.toLowerCase()) ||
      (c.category?.toLowerCase().includes(query.toLowerCase()) ?? false);
    const matchesFilter = filter === "all" || c.status === filter;
    return matchesQuery && matchesFilter;
  });

  return (
    <div className="space-y-4">
      {/* Search + filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search concepts…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                filter === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80",
              )}
            >
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
              {s !== "all" && (
                <span className="ml-1 opacity-60">
                  ({concepts.filter((c) => c.status === s).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={concepts.length === 0 ? "No concepts yet" : "No matches"}
          description={
            concepts.length === 0
              ? "Create your first concept note to track what you're learning."
              : "Try a different search term or status filter."
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((c) => (
            <motion.div
              key={c.id}
              whileHover={{ y: -2 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
              <Link
                href={`/concepts/${c.id}`}
                className="surface-card group flex h-full flex-col rounded-2xl p-5 transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold",
                      CATEGORY_TINT[c.statusCategory],
                    )}
                  >
                    {c.title[0]?.toUpperCase()}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                      CATEGORY_TINT[c.statusCategory],
                    )}
                  >
                    {c.statusLabel}
                  </span>
                </div>

                <h3 className="mt-3 text-[15px] font-semibold tracking-tight transition-colors group-hover:text-primary">
                  {c.title}
                </h3>

                {c.category && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{c.category}</p>
                )}

                <div className="mt-auto flex items-center gap-2 pt-3">
                  {c.topicName && (
                    <Badge variant="secondary" className="text-[10px]">
                      {c.topicName}
                    </Badge>
                  )}
                  {c.patternName && (
                    <Badge variant="secondary" className="text-[10px]">
                      {c.patternName}
                    </Badge>
                  )}
                  {c.confidence != null && (
                    <span className="ml-auto text-[11px] text-muted-foreground">
                      {c.confidence}/5 conf
                    </span>
                  )}
                </div>

                <div className="mt-3 flex items-center gap-1 border-t border-border pt-3 text-[11px] text-muted-foreground">
                  <Clock className="size-3" />
                  <span>{relativeTime(c.updatedAt)}</span>
                  <ChevronRight className="ml-auto size-3.5 transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
