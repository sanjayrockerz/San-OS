"use client";

import { useActionState } from "react";

import { saveGoals, type GoalsActionResult } from "@/app/(app)/academic/planner/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Tables } from "@/types/database";

export function GoalsForm({ goals }: { goals: Tables<"academic_goals"> | null }) {
  const [state, action, pending] = useActionState<GoalsActionResult | null, FormData>(saveGoals, null);

  return (
    <form action={action} className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="target_cgpa">Target CGPA</Label>
          <Input
            id="target_cgpa"
            name="target_cgpa"
            type="number"
            min={0}
            max={10}
            step="0.01"
            placeholder="9.0"
            defaultValue={goals?.target_cgpa ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dream_company">Dream Company</Label>
          <Input
            id="dream_company"
            name="dream_company"
            placeholder="Optional"
            defaultValue={goals?.dream_company ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="total_semesters">Programme Length (semesters)</Label>
          <Input
            id="total_semesters"
            name="total_semesters"
            type="number"
            min={1}
            max={20}
            defaultValue={goals?.total_semesters ?? 8}
          />
        </div>
      </div>
      {state && !state.ok && <p className="text-sm text-destructive">{state.error}</p>}
      {state?.ok && <p className="text-sm text-success">Saved.</p>}
      <Button type="submit" disabled={pending} size="sm">
        {pending ? "Saving…" : "Save Target"}
      </Button>
    </form>
  );
}
