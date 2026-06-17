"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, X, Sparkles, Loader2, Network, Layers, Tag } from "lucide-react";

import { PageTransition, Section } from "@/components/layout/page-transition";
import { PageHeader } from "@/components/layout/page-header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  approveProposal,
  dismissProposal,
} from "@/app/(app)/taxonomy/actions";

export interface ProposalView {
  entityType: "topic" | "pattern";
  id: string;
  name: string;
  aiConfidence: number | null;
  aiRationale: string | null;
}

export interface TaxonView {
  id: string;
  name: string;
  source: string;
}

export interface TaxonomyClientProps {
  proposals: ProposalView[];
  topics: TaxonView[];
  patterns: TaxonView[];
}

export function TaxonomyClient({
  proposals,
  topics,
  patterns,
}: TaxonomyClientProps) {
  // Optimistic: keep a local list and drop cards as they resolve.
  const [items, setItems] = useState(proposals);

  const remove = (id: string) =>
    setItems((prev) => prev.filter((p) => p.id !== id));

  return (
    <PageTransition>
      <PageHeader
        title="Dynamic Taxonomy"
        description="Your personal pattern and concept library evolves as you solve problems. Approve what fits; dismiss what doesn't."
      />

      <Section>
        <Tabs defaultValue="proposals">
          <TabsList>
            <TabsTrigger value="proposals">
              Pending
              {items.length > 0 && (
                <span className="ml-1.5 rounded-full bg-primary/15 px-1.5 text-[10px] font-semibold text-primary">
                  {items.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="existing">Existing</TabsTrigger>
          </TabsList>

          <TabsContent value="proposals">
            {items.length === 0 ? (
              <EmptyState
                icon={Sparkles}
                title="No proposals waiting"
                description="As you solve problems and write concept notes, the engine proposes new topics and patterns here for your approval."
              />
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <AnimatePresence initial={false}>
                  {items.map((p) => (
                    <ProposalCard key={p.id} proposal={p} onResolved={remove} />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>

          <TabsContent value="existing">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <TaxonColumn
                icon={Tag}
                title="Topics"
                items={topics}
                empty="No topics yet."
              />
              <TaxonColumn
                icon={Layers}
                title="Patterns"
                items={patterns}
                empty="No patterns yet."
              />
            </div>
          </TabsContent>
        </Tabs>
      </Section>
    </PageTransition>
  );
}

function ProposalCard({
  proposal,
  onResolved,
}: {
  proposal: ProposalView;
  onResolved: (id: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function act(fn: typeof approveProposal) {
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("entityType", proposal.entityType);
      fd.set("id", proposal.id);
      const res = await fn(null, fd);
      if (res.ok) onResolved(proposal.id);
      else setError(res.error);
    });
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      className="surface-card flex flex-col rounded-2xl p-4"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold">{proposal.name}</h3>
            <Badge variant={proposal.entityType === "pattern" ? "default" : "secondary"}>
              {proposal.entityType}
            </Badge>
          </div>
          {proposal.aiRationale && (
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              {proposal.aiRationale}
            </p>
          )}
        </div>
        {proposal.aiConfidence != null && (
          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            {proposal.aiConfidence}/5
          </span>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Button
          size="sm"
          variant="success"
          onClick={() => act(approveProposal)}
          disabled={pending}
          className="flex-1"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
          Approve
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => act(dismissProposal)}
          disabled={pending}
        >
          <X className="size-4" /> Dismiss
        </Button>
      </div>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </motion.div>
  );
}

function TaxonColumn({
  icon: Icon,
  title,
  items,
  empty,
}: {
  icon: typeof Network;
  title: string;
  items: TaxonView[];
  empty: string;
}) {
  return (
    <div className="surface-card rounded-2xl p-5">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <Icon className="size-4 text-primary" /> {title}
        <span className="ml-auto text-xs font-normal text-muted-foreground">
          {items.length}
        </span>
      </h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="flex flex-wrap gap-1.5">
          {items.map((t) => (
            <li key={t.id}>
              <span className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs">
                {t.name}
                {t.source !== "seed" && (
                  <Sparkles className="size-3 text-primary" />
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
