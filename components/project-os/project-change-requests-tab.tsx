"use client";

import { useActionState, useEffect, useState } from "react";
import { GitBranch, Plus, CheckCircle2, XCircle, Wrench } from "lucide-react";

import type { Tables } from "@/types/database";
import {
  createChangeRequest,
  approveChangeRequestVoid as approveChangeRequestAction,
  rejectChangeRequestVoid as rejectChangeRequestAction,
  implementChangeRequestVoid as implementChangeRequestAction,
} from "@/app/(app)/projects/[id]/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const CR_STATUS_COLORS: Record<Tables<"project_change_requests">["status"], string> = {
  pending: "border-amber-500/40 text-amber-400",
  estimated: "border-blue-500/40 text-blue-400",
  approved: "border-emerald-500/40 text-emerald-400",
  rejected: "border-red-500/40 text-red-400",
  implemented: "border-gray-500/40 text-gray-400",
};

interface Props {
  project: Tables<"projects">;
  changeRequests: Tables<"project_change_requests">[];
}

export function ProjectChangeRequestsTab({ project, changeRequests }: Props) {
  const [showForm, setShowForm] = useState(false);

  const pending = changeRequests.filter((cr) => cr.status === "pending" || cr.status === "estimated");
  const resolved = changeRequests.filter((cr) => cr.status === "approved" || cr.status === "rejected" || cr.status === "implemented");

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold">Change Requests</h2>
          <p className="text-sm text-muted-foreground">
            Track every client request. Never lose scope history.
          </p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4" />
          New Request
        </Button>
      </div>

      {showForm && (
        <ChangeRequestForm projectId={project.id} onClose={() => setShowForm(false)} />
      )}

      {changeRequests.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <GitBranch className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No change requests yet.</p>
          <p className="text-xs mt-1">Log client requests to track scope changes and pricing.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pending.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Pending ({pending.length})
              </h3>
              {pending.map((cr) => (
                <ChangeRequestCard key={cr.id} cr={cr} projectId={project.id} />
              ))}
            </div>
          )}
          {resolved.length > 0 && (
            <div className="space-y-2 opacity-70">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Resolved ({resolved.length})
              </h3>
              {resolved.map((cr) => (
                <ChangeRequestCard key={cr.id} cr={cr} projectId={project.id} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ChangeRequestCard({
  cr,
  projectId,
}: {
  cr: Tables<"project_change_requests">;
  projectId: string;
}) {
  return (
    <div className="p-4 rounded-lg border border-border/60 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm">{cr.title}</h4>
          {cr.description && <p className="text-xs text-muted-foreground mt-0.5">{cr.description}</p>}
        </div>
        <Badge variant="outline" className={`text-xs capitalize ${CR_STATUS_COLORS[cr.status]}`}>
          {cr.status}
        </Badge>
      </div>

      {cr.original_scope && (
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-2 rounded bg-white/5">
            <p className="text-muted-foreground mb-1 font-medium">Original Scope</p>
            <p className="text-foreground">{cr.original_scope}</p>
          </div>
          <div className="p-2 rounded bg-amber-500/5 border border-amber-500/20">
            <p className="text-amber-400 mb-1 font-medium">Requested Change</p>
            <p className="text-foreground">{cr.requested_change}</p>
          </div>
        </div>
      )}

      {(cr.estimated_hours || cr.suggested_price) && (
        <div className="flex items-center gap-4 text-sm">
          {cr.estimated_hours && (
            <span className="text-muted-foreground">
              ~{cr.estimated_hours}h additional work
            </span>
          )}
          {cr.suggested_price && (
            <span className="font-medium text-emerald-400">
              ₹{cr.suggested_price.toLocaleString("en-IN")} suggested
            </span>
          )}
        </div>
      )}

      {cr.status === "pending" && (
        <div className="flex items-center gap-2">
          <form action={approveChangeRequestAction}>
            <input type="hidden" name="crId" value={cr.id} />
            <input type="hidden" name="projectId" value={projectId} />
            <Button
              type="submit"
              size="sm"
              variant="outline"
              className="h-7 text-xs border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
            >
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Approve
            </Button>
          </form>
          <form action={rejectChangeRequestAction}>
            <input type="hidden" name="crId" value={cr.id} />
            <input type="hidden" name="projectId" value={projectId} />
            <Button
              type="submit"
              size="sm"
              variant="outline"
              className="h-7 text-xs border-red-500/40 text-red-400 hover:bg-red-500/10"
            >
              <XCircle className="w-3 h-3 mr-1" />
              Reject
            </Button>
          </form>
        </div>
      )}
      {cr.status === "approved" && (
        <div className="flex items-center gap-2">
          <form action={implementChangeRequestAction}>
            <input type="hidden" name="crId" value={cr.id} />
            <input type="hidden" name="projectId" value={projectId} />
            <Button
              type="submit"
              size="sm"
              variant="outline"
              className="h-7 text-xs border-blue-500/40 text-blue-400 hover:bg-blue-500/10"
            >
              <Wrench className="w-3 h-3 mr-1" />
              Mark Implemented
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}

function ChangeRequestForm({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const [state, action, pending] = useActionState(createChangeRequest, null);

  useEffect(() => {
    if (state?.ok) onClose();
  }, [state, onClose]);

  return (
    <form action={action} className="p-4 rounded-lg border border-border/60 bg-white/5 space-y-3">
      <input type="hidden" name="project_id" value={projectId} />
      <div className="space-y-1.5">
        <Label className="text-xs">Title *</Label>
        <Input name="title" placeholder="e.g. Add dark mode" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Original Scope</Label>
          <Textarea name="original_scope" placeholder="What was agreed…" rows={3} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Requested Change</Label>
          <Textarea name="requested_change" placeholder="What client wants…" rows={3} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Extra Hours</Label>
          <Input name="estimated_hours" type="number" min="0" placeholder="8" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Suggested Price (₹)</Label>
          <Input name="suggested_price" type="number" min="0" placeholder="5000" />
        </div>
      </div>
      {state && !state.ok && <p className="text-xs text-destructive">{state.error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Create"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
