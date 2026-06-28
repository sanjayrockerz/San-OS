"use client";

import { useActionState, useEffect } from "react";

import type { Tables } from "@/types/database";
import { updateProject } from "@/app/(app)/projects/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Constants } from "@/types/database";

const E = Constants.public.Enums;

const STATUS_LABELS: Record<string, string> = {
  planning: "Planning",
  active: "Active",
  on_hold: "On Hold",
  completed: "Completed",
  cancelled: "Cancelled",
};

const PRIORITY_LABELS: Record<string, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

interface Props {
  project: Tables<"projects">;
  onClose: () => void;
}

export function ProjectEditForm({ project, onClose }: Props) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(
    updateProject,
    null,
  );

  useEffect(() => {
    if (state?.ok) onClose();
  }, [state, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-background border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border/60">
          <h2 className="font-semibold">Edit Project</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            ✕
          </button>
        </div>

        <form action={action} className="p-5 space-y-4">
          <input type="hidden" name="projectId" value={project.id} />

          <div className="space-y-1.5">
            <Label className="text-xs">Title *</Label>
            <Input name="title" defaultValue={project.title} required />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Description</Label>
            <Textarea
              name="description"
              defaultValue={project.description ?? ""}
              rows={3}
              placeholder="What is this project about?"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Status</Label>
              <select
                name="status"
                defaultValue={project.status}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              >
                {E.project_status.map((s) => (
                  <option key={s} value={s} className="bg-background">
                    {STATUS_LABELS[s] ?? s}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Priority</Label>
              <select
                name="priority"
                defaultValue={project.priority}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              >
                {E.project_priority.map((p) => (
                  <option key={p} value={p} className="bg-background">
                    {PRIORITY_LABELS[p] ?? p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Start Date</Label>
              <Input
                name="start_date"
                type="date"
                defaultValue={project.start_date ?? ""}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Deadline</Label>
              <Input
                name="deadline"
                type="date"
                defaultValue={project.deadline ?? ""}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Estimated Hours</Label>
              <Input
                name="estimated_hours"
                type="number"
                min="0"
                defaultValue={project.estimated_hours ?? ""}
                placeholder="e.g. 80"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Budget (₹)</Label>
              <Input
                name="budget"
                type="number"
                min="0"
                defaultValue={project.budget ?? ""}
                placeholder="e.g. 50000"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Repository URL</Label>
            <Input
              name="repository_url"
              type="url"
              defaultValue={project.repository_url ?? ""}
              placeholder="https://github.com/..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Staging URL</Label>
              <Input
                name="deployment_url"
                type="url"
                defaultValue={project.deployment_url ?? ""}
                placeholder="https://staging.example.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Production URL</Label>
              <Input
                name="production_url"
                type="url"
                defaultValue={project.production_url ?? ""}
                placeholder="https://example.com"
              />
            </div>
          </div>

          {state && !state.ok && (
            <p className="text-xs text-destructive">{state.error}</p>
          )}

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={pending} className="flex-1">
              {pending ? "Saving…" : "Save Changes"}
            </Button>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
