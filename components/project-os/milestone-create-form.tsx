"use client";

import { useActionState } from "react";
import { useEffect } from "react";

import { createMilestone } from "@/app/(app)/projects/[id]/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  projectId: string;
  onClose: () => void;
}

export function MilestoneCreateForm({ projectId, onClose }: Props) {
  const [state, action, pending] = useActionState(createMilestone, null);

  useEffect(() => {
    if (state?.ok) onClose();
  }, [state, onClose]);

  return (
    <form action={action} className="p-4 rounded-lg border border-border/60 bg-white/5 space-y-3">
      <input type="hidden" name="project_id" value={projectId} />
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5 col-span-2">
          <Label className="text-xs" htmlFor="ms-title">Milestone title *</Label>
          <Input id="ms-title" name="title" placeholder="e.g. MVP Launch" required />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs" htmlFor="ms-date">Target date</Label>
          <Input id="ms-date" name="target_date" type="date" />
        </div>
      </div>
      {state && !state.ok && (
        <p className="text-xs text-destructive">{state.error}</p>
      )}
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Add Milestone"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
