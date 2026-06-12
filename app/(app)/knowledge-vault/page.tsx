"use client";

import { useState } from "react";
import { Search, Plus, FileText, FileCode2, BookMarked } from "lucide-react";
import { motion } from "framer-motion";

import { PageTransition, Section } from "@/components/layout/page-transition";
import { PageHeader } from "@/components/layout/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PatternBadge } from "@/components/ui/pattern-badge";
import { cn } from "@/lib/utils";
import { vaultItems } from "@/lib/mock-data";

const typeIcon = { Note: FileText, Snippet: FileCode2, Cheatsheet: BookMarked } as const;
const types = ["All", "Note", "Snippet", "Cheatsheet"];

export default function KnowledgeVaultPage() {
  const [active, setActive] = useState("All");
  const items = active === "All" ? vaultItems : vaultItems.filter((v) => v.type === active);

  return (
    <PageTransition>
      <PageHeader
        title="Knowledge Vault"
        description="Every note, snippet and cheatsheet you've written — searchable and linked."
        actions={<Button><Plus className="size-4" /> New Entry</Button>}
      />

      <Section className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search the vault…" className="h-11 pl-9" />
        </div>
        <div className="flex gap-2">
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setActive(t)}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all",
                active === t
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-border-strong hover:text-foreground"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </Section>

      <Section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((v) => {
          const Icon = typeIcon[v.type as keyof typeof typeIcon];
          return (
            <motion.div
              key={v.id}
              whileHover={{ y: -3 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="surface-card group flex cursor-pointer flex-col rounded-2xl p-5"
            >
              <div className="flex items-center justify-between">
                <span className="flex size-9 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-colors group-hover:bg-primary/15 group-hover:text-primary">
                  <Icon className="size-[18px]" />
                </span>
                <span className="text-[11px] font-medium text-muted-foreground">{v.type}</span>
              </div>
              <h3 className="mt-3 flex-1 text-[15px] font-semibold leading-snug tracking-tight">{v.title}</h3>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                <PatternBadge patternId={v.patternId} />
                <span className="text-[11px] text-muted-foreground">{v.updated}</span>
              </div>
            </motion.div>
          );
        })}
      </Section>
    </PageTransition>
  );
}
