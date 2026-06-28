"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { Plus, X, Receipt } from "lucide-react";

import type { Tables } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createInvoice,
  sendInvoice,
  markInvoicePaid,
  cancelInvoice,
} from "@/app/(app)/invoices/actions";

const STATUS_COLORS: Record<Tables<"invoices">["status"], string> = {
  draft: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  sent: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  paid: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  overdue: "bg-red-500/10 text-red-400 border-red-500/20",
  cancelled: "bg-gray-500/10 text-gray-500 border-gray-600/20",
};

function formatCurrency(amount: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(
    amount,
  );
}

interface Props {
  invoices: Tables<"invoices">[];
  clients: Tables<"clients">[];
  projects: Tables<"projects">[];
}

export function InvoiceListClient({ invoices, clients, projects }: Props) {
  const [showForm, setShowForm] = useState(false);

  const outstanding = invoices.filter((i) => i.status === "sent" || i.status === "overdue");
  const outstandingTotal = outstanding.reduce((sum, i) => sum + i.total_amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="text-sm text-muted-foreground">
          Outstanding: <span className="text-foreground font-medium">{formatCurrency(outstandingTotal)}</span>{" "}
          across {outstanding.length} invoice{outstanding.length === 1 ? "" : "s"}
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setShowForm((v) => !v)} disabled={clients.length === 0}>
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "Close" : "New Invoice"}
        </Button>
      </div>

      {clients.length === 0 && (
        <p className="text-sm text-muted-foreground">Add a client before creating an invoice.</p>
      )}

      {showForm && (
        <InvoiceCreateForm clients={clients} projects={projects} onClose={() => setShowForm(false)} />
      )}

      {invoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/40 px-6 py-14 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Receipt className="size-5" />
          </div>
          <p className="mt-4 text-sm font-medium">No invoices yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {invoices.map((invoice) => (
            <InvoiceRow key={invoice.id} invoice={invoice} clients={clients} />
          ))}
        </div>
      )}
    </div>
  );
}

function InvoiceRow({
  invoice,
  clients,
}: {
  invoice: Tables<"invoices">;
  clients: Tables<"clients">[];
}) {
  const client = clients.find((c) => c.id === invoice.client_id);
  const [, sendActionFn] = useActionState(sendInvoice, null);
  const [, paidActionFn] = useActionState(markInvoicePaid, null);
  const [, cancelActionFn] = useActionState(cancelInvoice, null);

  return (
    <Card className="p-4 border-border/60 flex items-center justify-between gap-4 flex-wrap">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{invoice.invoice_number}</p>
          <Badge className={`text-xs border ${STATUS_COLORS[invoice.status]}`} variant="outline">
            {invoice.status}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {client?.name ?? "Unknown client"} · {formatCurrency(invoice.total_amount, invoice.currency)}
          {invoice.due_date && ` · due ${invoice.due_date}`}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {invoice.status === "draft" && (
          <form action={sendActionFn}>
            <input type="hidden" name="invoiceId" value={invoice.id} />
            <Button type="submit" size="sm" variant="outline">Send</Button>
          </form>
        )}
        {(invoice.status === "sent" || invoice.status === "overdue") && (
          <form action={paidActionFn}>
            <input type="hidden" name="invoiceId" value={invoice.id} />
            <Button type="submit" size="sm" variant="outline">Mark Paid</Button>
          </form>
        )}
        {invoice.status !== "paid" && invoice.status !== "cancelled" && (
          <form action={cancelActionFn}>
            <input type="hidden" name="invoiceId" value={invoice.id} />
            <Button type="submit" size="sm" variant="ghost">Cancel</Button>
          </form>
        )}
      </div>
    </Card>
  );
}

function InvoiceCreateForm({
  clients,
  projects,
  onClose,
}: {
  clients: Tables<"clients">[];
  projects: Tables<"projects">[];
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState(createInvoice, null);

  useEffect(() => {
    if (state?.ok) onClose();
  }, [state, onClose]);

  return (
    <form action={action} className="p-4 rounded-lg border border-border/60 bg-white/5 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs" htmlFor="inv-number">Invoice Number *</Label>
          <Input id="inv-number" name="invoice_number" placeholder="INV-0001" required />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs" htmlFor="inv-client">Client *</Label>
          <select
            id="inv-client"
            name="client_id"
            required
            className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label className="text-xs" htmlFor="inv-project">Project</Label>
          <select
            id="inv-project"
            name="project_id"
            defaultValue=""
            className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">No linked project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label className="text-xs" htmlFor="inv-description">Line Item Description</Label>
          <Input id="inv-description" name="description" placeholder="Services rendered" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs" htmlFor="inv-qty">Quantity</Label>
          <Input id="inv-qty" name="quantity" type="number" min="0" step="0.5" defaultValue={1} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs" htmlFor="inv-rate">Unit Price (₹)</Label>
          <Input id="inv-rate" name="unit_price" type="number" min="0" required />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs" htmlFor="inv-due">Due Date</Label>
          <Input id="inv-due" name="due_date" type="date" />
        </div>
      </div>
      {state && !state.ok && <p className="text-xs text-destructive">{state.error}</p>}
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Create Invoice"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
