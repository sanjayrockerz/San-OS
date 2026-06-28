"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  Mail,
  Phone,
  MessageCircle,
  Globe,
  MapPin,
  Receipt,
  FolderKanban,
  TrendingUp,
  FileText,
  Archive,
  Pencil,
} from "lucide-react";

import type { ClientWorkspace } from "@/lib/services/client.service";
import { archiveClientRecord } from "@/app/(app)/clients/actions";
import { ClientEditForm } from "./client-edit-form";
import { PageHeader, SectionHeading } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { Tables } from "@/types/database";

const STATUS_COLORS: Record<Tables<"clients">["status"], string> = {
  prospect: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  inactive: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  churned: "bg-red-500/10 text-red-400 border-red-500/20",
};

const STATUS_LABELS: Record<Tables<"clients">["status"], string> = {
  prospect: "Prospect",
  active: "Active",
  inactive: "Inactive",
  churned: "Churned",
};

const INVOICE_STATUS_COLORS: Record<Tables<"invoices">["status"], string> = {
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

export function ClientWorkspaceClient({ workspace }: { workspace: ClientWorkspace }) {
  const { client, projects, invoices, pipelineEntries, quotes, totalRevenue, outstandingAmount } =
    workspace;
  const [, archiveAction] = useActionState(archiveClientRecord, null);
  const [showEdit, setShowEdit] = useState(false);

  return (
    <div className="px-4 py-6 md:px-6 lg:px-8 max-w-6xl mx-auto space-y-8">
      {showEdit && <ClientEditForm client={client} onClose={() => setShowEdit(false)} />}

      <PageHeader
        title={client.name}
        description={client.company ?? undefined}
        actions={
          <>
            <Badge className={`text-xs border ${STATUS_COLORS[client.status]}`} variant="outline">
              {STATUS_LABELS[client.status]}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setShowEdit(true)}
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </Button>
            {client.status !== "inactive" && (
              <form action={archiveAction}>
                <input type="hidden" name="clientId" value={client.id} />
                <Button type="submit" variant="outline" size="sm" className="gap-1.5">
                  <Archive className="w-3.5 h-3.5" />
                  Archive
                </Button>
              </form>
            )}
          </>
        }
      />

      {/* Revenue summary */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Total Revenue (paid)</p>
          <p className="mt-1 text-2xl font-semibold">{formatCurrency(totalRevenue)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Outstanding</p>
          <p className="mt-1 text-2xl font-semibold text-amber-400">
            {formatCurrency(outstandingAmount)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Active Projects</p>
          <p className="mt-1 text-2xl font-semibold">
            {projects.filter((p) => p.status === "active").length}
          </p>
        </Card>
      </div>

      {/* Contact info */}
      <Card className="p-4">
        <SectionHeading title="Contact" />
        <div className="grid gap-2 sm:grid-cols-2 text-sm">
          {client.email && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="w-3.5 h-3.5" /> {client.email}
            </div>
          )}
          {client.phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="w-3.5 h-3.5" /> {client.phone}
            </div>
          )}
          {client.whatsapp && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MessageCircle className="w-3.5 h-3.5" /> {client.whatsapp}
            </div>
          )}
          {client.website && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Globe className="w-3.5 h-3.5" /> {client.website}
            </div>
          )}
          {client.address && (
            <div className="flex items-center gap-2 text-muted-foreground sm:col-span-2">
              <MapPin className="w-3.5 h-3.5" /> {client.address}
            </div>
          )}
        </div>
        {client.notes && (
          <p className="mt-3 text-sm text-muted-foreground border-t border-border/60 pt-3">
            {client.notes}
          </p>
        )}
      </Card>

      {/* Projects */}
      <Card className="p-4">
        <SectionHeading
          title="Projects"
          action={
            <FolderKanban className="w-4 h-4 text-muted-foreground" />
          }
        />
        {projects.length === 0 ? (
          <p className="text-sm text-muted-foreground">No projects linked yet.</p>
        ) : (
          <div className="space-y-2">
            {projects.map((p) => (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2 hover:bg-white/[0.02] transition-colors"
              >
                <span className="text-sm">{p.title}</span>
                <Badge variant="outline" className="text-xs">
                  {p.status}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* Invoices */}
      <Card className="p-4">
        <SectionHeading title="Invoices" action={<Receipt className="w-4 h-4 text-muted-foreground" />} />
        {invoices.length === 0 ? (
          <p className="text-sm text-muted-foreground">No invoices yet.</p>
        ) : (
          <div className="space-y-2">
            {invoices.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2"
              >
                <div>
                  <p className="text-sm">{inv.invoice_number}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(inv.total_amount, inv.currency)}
                    {inv.due_date && ` · due ${inv.due_date}`}
                  </p>
                </div>
                <Badge className={`text-xs border ${INVOICE_STATUS_COLORS[inv.status]}`} variant="outline">
                  {inv.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Pipeline */}
      <Card className="p-4">
        <SectionHeading title="Pipeline" action={<TrendingUp className="w-4 h-4 text-muted-foreground" />} />
        {pipelineEntries.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pipeline activity.</p>
        ) : (
          <div className="space-y-2">
            {pipelineEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2"
              >
                <span className="text-sm">{entry.title}</span>
                <div className="flex items-center gap-2">
                  {entry.value_estimate && (
                    <span className="text-xs text-muted-foreground">
                      {formatCurrency(entry.value_estimate)}
                    </span>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {entry.stage}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Quotes */}
      <Card className="p-4">
        <SectionHeading title="Quotes" action={<FileText className="w-4 h-4 text-muted-foreground" />} />
        {quotes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No quotes yet.</p>
        ) : (
          <div className="space-y-2">
            {quotes.map((q) => (
              <div
                key={q.id}
                className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2"
              >
                <span className="text-sm">{q.title}</span>
                <Badge variant="outline" className="text-xs">
                  {q.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
