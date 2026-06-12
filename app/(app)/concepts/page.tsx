"use client";

import { Plus, FileText, Link2, Clock } from "lucide-react";
import { motion } from "framer-motion";

import { PageTransition, Section } from "@/components/layout/page-transition";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { PatternBadge } from "@/components/ui/pattern-badge";
import { getPatternColor } from "@/lib/utils/patterns";
import { concepts } from "@/lib/mock-data";

export default function ConceptsPage() {
  return (
    <PageTransition>
      <PageHeader
        title="Concepts"
        description="Your second brain for algorithms — markdown notes, linked problems and AI summaries."
        actions={<Button><Plus className="size-4" /> New Concept</Button>}
      />

      <Section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {concepts.map((c) => {
          const accent = getPatternColor(c.patternId);
          return (
            <motion.div
              key={c.id}
              whileHover={{ y: -3 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="surface-card group flex cursor-pointer flex-col rounded-2xl p-5"
            >
              <div className="flex items-center justify-between">
                <span
                  className="flex size-9 items-center justify-center rounded-xl text-sm font-semibold"
                  style={{ backgroundColor: `${accent}1f`, color: accent }}
                >
                  {c.title[0]}
                </span>
                <PatternBadge patternId={c.patternId} />
              </div>
              <h3 className="mt-3 text-[15px] font-semibold tracking-tight transition-colors group-hover:text-primary">
                {c.title}
              </h3>
              <p className="mt-1 flex-1 text-sm leading-relaxed text-muted-foreground">{c.summary}</p>
              <div className="mt-4 flex items-center gap-4 border-t border-border pt-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1"><FileText className="size-3" /> {c.notes} notes</span>
                <span className="flex items-center gap-1"><Link2 className="size-3" /> {c.problems} linked</span>
                <span className="ml-auto flex items-center gap-1"><Clock className="size-3" /> {c.revised}</span>
              </div>
            </motion.div>
          );
        })}
      </Section>
    </PageTransition>
  );
}
