"use client";

import { useActionState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { createProject } from "@/app/(app)/projects/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Constants, type Tables } from "@/types/database";

const E = Constants.public.Enums;

const STATUS_LABELS: Record<string, string> = {
  planning: "Planning",
  active: "Active",
  on_hold: "On Hold",
};

const TYPE_LABELS: Record<string, string> = {
  client: "Client project",
  internal: "Internal / personal",
  open_source: "Open source",
};

const PRIORITY_LABELS: Record<string, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export function ProjectCreateForm({ clients = [] }: { clients?: Tables<"clients">[] }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(createProject, null);

  useEffect(() => {
    if (state?.ok && state.id) {
      router.push(`/projects/${state.id}`);
    }
  }, [state, router]);

  return (
    <form action={action} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="title">Project Name *</Label>
        <Input id="title" name="title" placeholder="e.g. Cenexa v2 Dashboard" required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <select
            id="type"
            name="type"
            defaultValue="internal"
            className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {E.project_type.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <select
            id="priority"
            name="priority"
            defaultValue="medium"
            className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {E.project_priority.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABELS[p]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="What is this project about?"
          rows={3}
        />
      </div>

      {clients.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="client_id">Client</Label>
          <select
            id="client_id"
            name="client_id"
            defaultValue=""
            className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">No client (internal)</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="client_name">Client Name</Label>
          <Input id="client_name" name="client_name" placeholder="Acme Corp" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="client_email">Client Email</Label>
          <Input id="client_email" name="client_email" type="email" placeholder="client@example.com" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_date">Start Date</Label>
          <Input id="start_date" name="start_date" type="date" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="deadline">Deadline</Label>
          <Input id="deadline" name="deadline" type="date" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="estimated_hours">Estimated Hours</Label>
          <Input
            id="estimated_hours"
            name="estimated_hours"
            type="number"
            min="0"
            placeholder="120"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="budget">Budget (₹)</Label>
          <Input id="budget" name="budget" type="number" min="0" placeholder="50000" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="repository_url">Repository URL</Label>
        <Input
          id="repository_url"
          name="repository_url"
          type="url"
          placeholder="https://github.com/you/repo"
        />
      </div>

      {state && !state.ok && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={pending} className="flex-1">
          {pending ? "Creating…" : "Create Project"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
