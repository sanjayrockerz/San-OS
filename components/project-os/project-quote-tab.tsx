"use client";

import Link from "next/link";
import { useState } from "react";
import { FileEdit, Plus, Trash2, ChevronDown, ChevronUp, Send, CheckCircle2, XCircle, ArrowRight } from "lucide-react";

import type { Tables, Json } from "@/types/database";
import { generateQuote, updateQuoteStatusVoid as updateQuoteStatusAction } from "@/app/(app)/projects/[id]/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { QuoteFeature, QuoteMilestone } from "@/lib/services/quote-engine.service";

interface Props {
  project: Tables<"projects">;
  quotes: Tables<"project_quotes">[];
}

const QUOTE_STATUS_COLORS: Record<Tables<"project_quotes">["status"], string> = {
  draft: "border-gray-500/40 text-gray-400",
  sent: "border-blue-500/40 text-blue-400",
  accepted: "border-emerald-500/40 text-emerald-400",
  rejected: "border-red-500/40 text-red-400",
  expired: "border-gray-500/30 text-gray-500",
};

export function ProjectQuoteTab({ project, quotes }: Props) {
  const [showBuilder, setShowBuilder] = useState(false);
  const [expandedQuote, setExpandedQuote] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold">Quote Engine</h2>
          <p className="text-sm text-muted-foreground">
            Generate professional quotations with automatic effort estimation.
          </p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setShowBuilder(!showBuilder)}>
          <Plus className="w-4 h-4" />
          New Quote
        </Button>
      </div>

      {showBuilder && (
        <QuoteBuilder projectId={project.id} onClose={() => setShowBuilder(false)} />
      )}

      {quotes.length === 0 && !showBuilder ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileEdit className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No quotes yet.</p>
          <p className="text-xs mt-1">Generate a professional quotation with automatic pricing.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {quotes.map((quote) => (
            <QuoteCard
              key={quote.id}
              quote={quote}
              projectId={project.id}
              expanded={expandedQuote === quote.id}
              onToggle={() => setExpandedQuote(expandedQuote === quote.id ? null : quote.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function QuoteCard({
  quote,
  projectId,
  expanded,
  onToggle,
}: {
  quote: Tables<"project_quotes">;
  projectId: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const features = (quote.features as QuoteFeature[] | null) ?? [];
  const milestones = (quote.milestones as QuoteMilestone[] | null) ?? [];

  return (
    <Card className="border-border/60 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-sm">{quote.title}</h3>
            <Badge variant="outline" className={`text-xs capitalize ${QUOTE_STATUS_COLORS[quote.status]}`}>
              {quote.status}
            </Badge>
          </div>
          {(quote.price_min || quote.price_max) && (
            <p className="text-sm text-emerald-400 mt-0.5">
              ₹{quote.price_min?.toLocaleString("en-IN")} – ₹{quote.price_max?.toLocaleString("en-IN")}
            </p>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-border/40 p-4 space-y-5">
          {quote.summary && <p className="text-sm text-muted-foreground">{quote.summary}</p>}

          {/* Key numbers */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {quote.total_estimated_hours && (
              <div className="p-3 rounded bg-white/5">
                <p className="text-xs text-muted-foreground">Total Hours</p>
                <p className="text-lg font-bold">{quote.total_estimated_hours}h</p>
              </div>
            )}
            {quote.price_min && (
              <div className="p-3 rounded bg-white/5">
                <p className="text-xs text-muted-foreground">Min Price</p>
                <p className="text-lg font-bold">₹{quote.price_min.toLocaleString("en-IN")}</p>
              </div>
            )}
            {quote.price_max && (
              <div className="p-3 rounded bg-white/5">
                <p className="text-xs text-muted-foreground">Max Price</p>
                <p className="text-lg font-bold">₹{quote.price_max.toLocaleString("en-IN")}</p>
              </div>
            )}
          </div>

          {/* Features */}
          {features.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Scope ({features.length} features)
              </h4>
              {features.map((f, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground w-4 text-right">{i + 1}.</span>
                  <span className="flex-1">{f.title}</span>
                  {f.complexity && (
                    <span className={`text-xs px-1.5 py-0.5 rounded capitalize ${
                      f.complexity === "high" ? "bg-red-500/10 text-red-400" :
                      f.complexity === "medium" ? "bg-amber-500/10 text-amber-400" :
                      "bg-emerald-500/10 text-emerald-400"
                    }`}>
                      {f.complexity}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Milestones */}
          {milestones.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Payment Milestones
              </h4>
              {milestones.map((m, i) => (
                <div key={i} className="flex items-start justify-between gap-3 p-3 rounded bg-white/5">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{m.title}</p>
                    {m.deliverables && m.deliverables.length > 0 && (
                      <ul className="mt-1 space-y-0.5">
                        {m.deliverables.map((d, j) => (
                          <li key={j} className="text-xs text-muted-foreground">• {d}</li>
                        ))}
                      </ul>
                    )}
                    {m.durationWeeks && (
                      <p className="text-xs text-muted-foreground mt-1">{m.durationWeeks} weeks</p>
                    )}
                  </div>
                  {m.price && (
                    <p className="text-sm font-medium text-emerald-400 flex-shrink-0">
                      ₹{m.price.toLocaleString("en-IN")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Status transitions */}
          <div className="pt-3 border-t border-border/40 flex items-center gap-2 flex-wrap">
            {quote.status === "draft" && (
              <form action={updateQuoteStatusAction}>
                <input type="hidden" name="quoteId" value={quote.id} />
                <input type="hidden" name="projectId" value={projectId} />
                <input type="hidden" name="status" value="sent" />
                <Button type="submit" size="sm" variant="outline" className="h-7 text-xs gap-1">
                  <Send className="w-3 h-3" />
                  Mark Sent
                </Button>
              </form>
            )}
            {quote.status === "sent" && (
              <>
                <form action={updateQuoteStatusAction}>
                  <input type="hidden" name="quoteId" value={quote.id} />
                  <input type="hidden" name="projectId" value={projectId} />
                  <input type="hidden" name="status" value="accepted" />
                  <Button type="submit" size="sm" variant="outline" className="h-7 text-xs gap-1 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10">
                    <CheckCircle2 className="w-3 h-3" />
                    Accept
                  </Button>
                </form>
                <form action={updateQuoteStatusAction}>
                  <input type="hidden" name="quoteId" value={quote.id} />
                  <input type="hidden" name="projectId" value={projectId} />
                  <input type="hidden" name="status" value="rejected" />
                  <Button type="submit" size="sm" variant="outline" className="h-7 text-xs gap-1 border-red-500/40 text-red-400 hover:bg-red-500/10">
                    <XCircle className="w-3 h-3" />
                    Reject
                  </Button>
                </form>
              </>
            )}
            {quote.status === "accepted" && (
              <Link href="/invoices">
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-blue-500/40 text-blue-400 hover:bg-blue-500/10">
                  <ArrowRight className="w-3 h-3" />
                  Create Invoice
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

interface FeatureRow {
  title: string;
  description: string;
  complexity: "low" | "medium" | "high";
}

function QuoteBuilder({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const [title, setTitle] = useState("Project Quotation");
  const [features, setFeatures] = useState<FeatureRow[]>([
    { title: "", description: "", complexity: "medium" },
  ]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addFeature = () =>
    setFeatures((f) => [...f, { title: "", description: "", complexity: "medium" }]);

  const removeFeature = (i: number) =>
    setFeatures((f) => f.filter((_, idx) => idx !== i));

  const updateFeature = (i: number, patch: Partial<FeatureRow>) =>
    setFeatures((f) => f.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validFeatures = features.filter((f) => f.title.trim());
    if (validFeatures.length === 0) {
      setError("Add at least one feature.");
      return;
    }

    setPending(true);
    setError(null);

    const fd = new FormData();
    fd.set("project_id", projectId);
    fd.set("title", title);
    fd.set("features_json", JSON.stringify(validFeatures));

    try {
      const result = await generateQuote(null, fd);
      if (result.ok) {
        onClose();
      } else {
        setError(result.error);
      }
    } catch {
      setError("Failed to generate quote.");
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 rounded-lg border border-border/60 bg-white/5 space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs">Quote Title *</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Features / Scope</Label>
          <button type="button" onClick={addFeature} className="text-xs text-blue-400 hover:text-blue-300">
            + Add
          </button>
        </div>
        {features.map((f, i) => (
          <div key={i} className="grid grid-cols-5 gap-2 items-start">
            <Input
              className="col-span-2"
              placeholder="Feature name *"
              value={f.title}
              onChange={(e) => updateFeature(i, { title: e.target.value })}
            />
            <Input
              className="col-span-2"
              placeholder="Description (optional)"
              value={f.description}
              onChange={(e) => updateFeature(i, { description: e.target.value })}
            />
            <div className="flex items-center gap-1">
              <select
                value={f.complexity}
                onChange={(e) => updateFeature(i, { complexity: e.target.value as FeatureRow["complexity"] })}
                className="flex-1 h-9 rounded-md border border-input bg-transparent px-2 py-1 text-xs"
              >
                <option value="low" className="bg-background">Low</option>
                <option value="medium" className="bg-background">Med</option>
                <option value="high" className="bg-background">High</option>
              </select>
              {features.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeFeature(i)}
                  className="text-muted-foreground hover:text-red-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Generating…" : "Generate Quote"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
