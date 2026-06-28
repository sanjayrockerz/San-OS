"use client";

import Link from "next/link";
import { useState } from "react";
import { Users, Plus, ChevronRight, Building2 } from "lucide-react";

import type { Tables } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

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

type FilterStatus = "all" | Tables<"clients">["status"];

export function ClientListClient({ clients }: { clients: Tables<"clients">[] }) {
  const [filter, setFilter] = useState<FilterStatus>("all");

  const visible = filter === "all" ? clients : clients.filter((c) => c.status === filter);
  const active = clients.filter((c) => c.status === "active");

  const filters: Array<{ value: FilterStatus; label: string }> = [
    { value: "all", label: `All (${clients.length})` },
    { value: "active", label: `Active (${active.length})` },
    { value: "prospect", label: "Prospect" },
    { value: "inactive", label: "Inactive" },
    { value: "churned", label: "Churned" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                filter === f.value
                  ? "bg-white/10 border-white/20 text-white"
                  : "border-transparent text-muted-foreground hover:text-white hover:bg-white/5"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <Link href="/clients/new">
          <Button size="sm" className="gap-1.5">
            <Plus className="w-4 h-4" />
            New Client
          </Button>
        </Link>
      </div>

      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/40 px-6 py-14 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Users className="size-5" />
          </div>
          <p className="mt-4 text-sm font-medium">No clients yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add a client or prospect to start tracking the relationship.
          </p>
          <Link href="/clients/new" className="mt-4">
            <Button size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" />
              New Client
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      )}
    </div>
  );
}

function ClientCard({ client }: { client: Tables<"clients"> }) {
  return (
    <Link href={`/clients/${client.id}`} className="block group">
      <Card className="p-4 border-border/60 hover:border-border hover:bg-white/[0.02] transition-all cursor-pointer">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm text-foreground truncate group-hover:text-white transition-colors">
                {client.name}
              </h3>
              {client.company && (
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  {client.company}
                </p>
              )}
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors flex-shrink-0" />
          </div>

          <Badge className={`text-xs border ${STATUS_COLORS[client.status]}`} variant="outline">
            {STATUS_LABELS[client.status]}
          </Badge>

          {client.email && (
            <p className="text-xs text-muted-foreground truncate">{client.email}</p>
          )}
        </div>
      </Card>
    </Link>
  );
}
