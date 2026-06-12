"use client";

import { useState } from "react";
import { Search, Plus, SlidersHorizontal } from "lucide-react";

import { PageTransition, Section } from "@/components/layout/page-transition";
import { PageHeader } from "@/components/layout/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ProblemCard } from "@/components/problems/problem-card";
import { cn } from "@/lib/utils";
import { problems, problemFilters } from "@/lib/mock-data";

export default function ProblemsPage() {
  const [active, setActive] = useState("All");

  return (
    <PageTransition>
      <PageHeader
        title="Problems"
        description="Your solved set — algorithms, notes, mistakes and revision history in one place."
        actions={<Button><Plus className="size-4" /> Add Problem</Button>}
      />

      {/* Search + filter */}
      <Section className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search problems…" className="h-11 pl-9" />
        </div>
        <Button variant="secondary" size="icon" className="size-11">
          <SlidersHorizontal className="size-4" />
        </Button>
      </Section>

      <Section className="mb-6 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {problemFilters.map((f) => (
          <button
            key={f}
            onClick={() => setActive(f)}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-150",
              active === f
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:border-border-strong hover:text-foreground"
            )}
          >
            {f}
          </button>
        ))}
      </Section>

      <Section className="grid gap-3 lg:grid-cols-2">
        {problems.map((p) => (
          <ProblemCard key={p.id} problem={p} />
        ))}
      </Section>
    </PageTransition>
  );
}
