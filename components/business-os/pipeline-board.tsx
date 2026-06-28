"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { Plus, X, Trash2 } from "lucide-react";

import type { Tables } from "@/types/database";
import { Constants } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createPipelineEntry,
  updatePipelineStage,
  deletePipelineEntry,
} from "@/app/(app)/pipeline/actions";

const E = Constants.public.Enums;

const STAGE_LABELS: Record<Tables<"pipeline_entries">["stage"], string> = {
  lead: "Lead",
  discovery: "Discovery",
  proposal: "Proposal",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost",
};

const BOARD_STAGES: Tables<"pipeline_entries">["stage"][] = [
  "lead",
  "discovery",
  "proposal",
  "negotiation",
  "won",
  "lost",
];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

interface Props {
  entries: Tables<"pipeline_entries">[];
  clients: Tables<"clients">[];
  pipelineValue: { total: number; weighted: number };
}

export function PipelineBoard({ entries, clients, pipelineValue }: Props) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>
            Pipeline value: <span className="text-foreground font-medium">{formatCurrency(pipelineValue.total)}</span>
          </span>
          <span>
            Weighted: <span className="text-foreground font-medium">{formatCurrency(pipelineValue.weighted)}</span>
          </span>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setShowForm((v) => !v)}>
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "Close" : "New Entry"}
        </Button>
      </div>

      {showForm && (
        <PipelineCreateForm clients={clients} onClose={() => setShowForm(false)} />
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {BOARD_STAGES.map((stage) => {
          const stageEntries = entries.filter((e) => e.stage === stage);
          return (
            <div key={stage} className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-medium text-muted-foreground">
                  {STAGE_LABELS[stage]}
                </h3>
                <span className="text-xs text-muted-foreground">{stageEntries.length}</span>
              </div>
              <div className="space-y-2 min-h-[60px]">
                {stageEntries.map((entry) => (
                  <PipelineCard key={entry.id} entry={entry} clients={clients} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PipelineCard({
  entry,
  clients,
}: {
  entry: Tables<"pipeline_entries">;
  clients: Tables<"clients">[];
}) {
  const [, stageAction] = useActionState(updatePipelineStage, null);
  const [, deleteAction] = useActionState(deletePipelineEntry, null);
  const client = clients.find((c) => c.id === entry.client_id);

  return (
    <Card className="p-3 border-border/60 space-y-2">
      <div className="flex items-start justify-between gap-1">
        <p className="text-sm font-medium truncate flex-1">{entry.title}</p>
        <form action={deleteAction}>
          <input type="hidden" name="entryId" value={entry.id} />
          <button
            type="submit"
            title="Delete entry"
            onClick={(e) => {
              if (!confirm(`Delete "${entry.title}"?`)) e.preventDefault();
            }}
            className="text-muted-foreground/40 hover:text-destructive transition-colors shrink-0"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </form>
      </div>
      {client && <p className="text-xs text-muted-foreground truncate">{client.name}</p>}
      {entry.value_estimate && (
        <p className="text-xs text-muted-foreground">
          {formatCurrency(entry.value_estimate)} · {entry.probability}%
        </p>
      )}
      <form action={stageAction}>
        <input type="hidden" name="entryId" value={entry.id} />
        <select
          name="stage"
          defaultValue={entry.stage}
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
          className="w-full h-7 rounded-md border border-input bg-transparent px-2 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {E.pipeline_stage.map((s) => (
            <option key={s} value={s}>
              {STAGE_LABELS[s]}
            </option>
          ))}
        </select>
      </form>
    </Card>
  );
}

function PipelineCreateForm({
  clients,
  onClose,
}: {
  clients: Tables<"clients">[];
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState(createPipelineEntry, null);

  useEffect(() => {
    if (state?.ok) onClose();
  }, [state, onClose]);

  return (
    <form action={action} className="p-4 rounded-lg border border-border/60 bg-white/5 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5 col-span-2">
          <Label className="text-xs" htmlFor="pe-title">Title *</Label>
          <Input id="pe-title" name="title" placeholder="e.g. Website redesign" required />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs" htmlFor="pe-client">Client</Label>
          <select
            id="pe-client"
            name="client_id"
            defaultValue=""
            className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">No client yet</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs" htmlFor="pe-stage">Stage</Label>
          <select
            id="pe-stage"
            name="stage"
            defaultValue="lead"
            className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {E.pipeline_stage.map((s) => (
              <option key={s} value={s}>
                {STAGE_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs" htmlFor="pe-value">Value Estimate (₹)</Label>
          <Input id="pe-value" name="value_estimate" type="number" min="0" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs" htmlFor="pe-probability">Probability (%)</Label>
          <Input id="pe-probability" name="probability" type="number" min="0" max="100" defaultValue={50} />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label className="text-xs" htmlFor="pe-date">Expected Close Date</Label>
          <Input id="pe-date" name="expected_close_date" type="date" />
        </div>
      </div>
      {state && !state.ok && <p className="text-xs text-destructive">{state.error}</p>}
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Add Entry"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
