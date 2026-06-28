"use client";

import { useActionState, useEffect, useRef } from "react";

import { createSemester, updateSemester, type ActionResult } from "@/app/(app)/academic/history/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Constants, type Tables } from "@/types/database";

const E = Constants.public.Enums;

const STATUS_LABELS: Record<string, string> = {
  upcoming: "Upcoming",
  in_progress: "In Progress",
  completed: "Completed",
};

export function SemesterForm({
  semester,
  onDone,
}: {
  semester?: Tables<"academic_semesters">;
  onDone?: () => void;
}) {
  const isEdit = !!semester;
  const action = isEdit ? updateSemester : createSemester;
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(action, null);
  const lastHandledRef = useRef<ActionResult | null>(null);

  useEffect(() => {
    if (state && state !== lastHandledRef.current && state.ok) {
      lastHandledRef.current = state;
      onDone?.();
    }
  }, [state, onDone]);

  return (
    <form action={formAction} className="space-y-4">
      {isEdit && <input type="hidden" name="id" value={semester.id} />}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="semester_number">Semester #</Label>
          <Input
            id="semester_number"
            name="semester_number"
            type="number"
            min={1}
            max={20}
            defaultValue={semester?.semester_number}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="academic_year">Academic Year</Label>
          <Input
            id="academic_year"
            name="academic_year"
            placeholder="2023-24"
            defaultValue={semester?.academic_year ?? ""}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" placeholder="Semester 3" defaultValue={semester?.name} required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="total_credits">Total Credits</Label>
          <Input
            id="total_credits"
            name="total_credits"
            type="number"
            min={0}
            step="0.5"
            defaultValue={semester?.total_credits ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="earned_credits">Earned Credits</Label>
          <Input
            id="earned_credits"
            name="earned_credits"
            type="number"
            min={0}
            step="0.5"
            defaultValue={semester?.earned_credits ?? ""}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="sgpa">SGPA</Label>
          <Input
            id="sgpa"
            name="sgpa"
            type="number"
            min={0}
            max={10}
            step="0.01"
            defaultValue={semester?.sgpa ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cgpa_after">CGPA After</Label>
          <Input
            id="cgpa_after"
            name="cgpa_after"
            type="number"
            min={0}
            max={10}
            step="0.01"
            defaultValue={semester?.cgpa_after ?? ""}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="backlogs">Backlogs</Label>
          <Input id="backlogs" name="backlogs" type="number" min={0} defaultValue={semester?.backlogs ?? 0} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <Select id="status" name="status" defaultValue={semester?.status ?? "upcoming"}>
            {E.semester_status.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="is_current" defaultChecked={semester?.is_current ?? false} className="size-4" />
        This is my current semester
      </label>

      {state && !state.ok && <p className="text-sm text-destructive">{state.error}</p>}

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" disabled={pending} className="flex-1">
          {pending ? "Saving…" : isEdit ? "Save Changes" : "Add Semester"}
        </Button>
      </div>
    </form>
  );
}
