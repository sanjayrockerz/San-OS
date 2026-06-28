"use client";

import { useActionState, useState } from "react";
import { Plus, Pencil, Trash2, Star } from "lucide-react";

import { deleteSemester, type ActionResult } from "@/app/(app)/academic/history/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Tables } from "@/types/database";
import type { SemesterSummary } from "@/lib/services/academic-performance.service";
import { SemesterForm } from "./semester-form";

const STATUS_BADGE: Record<string, "default" | "success" | "secondary"> = {
  upcoming: "secondary",
  in_progress: "default",
  completed: "success",
};

export function AcademicHistoryClient({
  semesters,
  rawSemesters,
}: {
  semesters: SemesterSummary[];
  rawSemesters: Tables<"academic_semesters">[];
}) {
  const [showNew, setShowNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const rawById = new Map(rawSemesters.map((r) => [r.id, r]));

  return (
    <div className="space-y-5">
      <div className="surface-card rounded-2xl p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-section">Academic History</h2>
          <Button size="sm" variant={showNew ? "outline" : "default"} onClick={() => setShowNew((v) => !v)}>
            <Plus className="size-3.5 mr-1" />
            {showNew ? "Cancel" : "Add Semester"}
          </Button>
        </div>
        {showNew && (
          <div className="rounded-xl border border-border p-4 mb-2">
            <SemesterForm onDone={() => setShowNew(false)} />
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          This is your permanent academic record — every semester you enter here feeds the CGPA engine, the
          what-if simulator, and the target planner. Semesters with courses linked in IIT Workspace compute
          their SGPA automatically; older semesters use the numbers you enter here directly.
        </p>
      </div>

      {semesters.length === 0 ? (
        <div className="surface-card rounded-2xl p-5">
          <p className="text-xs text-muted-foreground">
            No semesters recorded yet. Add your first one to start building your CGPA history.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {semesters.map((s) => {
            const raw = rawById.get(s.semesterId);
            const isEditing = editingId === s.semesterId;
            return (
              <div
                key={s.semesterId}
                className={cn(
                  "rounded-xl border p-4",
                  s.isCurrent ? "border-primary/40 bg-primary/5" : "border-border bg-card",
                )}
              >
                {isEditing && raw ? (
                  <div className="space-y-3">
                    <SemesterForm semester={raw} onDone={() => setEditingId(null)} />
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold">{s.name}</span>
                        {s.isCurrent && <Star className="size-3.5 text-primary" />}
                      </div>
                      <Badge variant={STATUS_BADGE[s.status] ?? "secondary"}>
                        {s.status.replace("_", " ")}
                      </Badge>
                    </div>
                    {s.academicYear && (
                      <p className="text-[11px] text-muted-foreground mb-2">{s.academicYear}</p>
                    )}
                    <div className="grid grid-cols-3 gap-2 text-center mb-2">
                      <div className="rounded-lg border border-border p-2">
                        <p className="text-base font-bold tabular">{s.sgpa?.toFixed(2) ?? "—"}</p>
                        <p className="text-[10px] text-muted-foreground">SGPA</p>
                      </div>
                      <div className="rounded-lg border border-border p-2">
                        <p className="text-base font-bold tabular">{s.earnedCredits}</p>
                        <p className="text-[10px] text-muted-foreground">credits</p>
                      </div>
                      <div className="rounded-lg border border-border p-2">
                        <p className="text-base font-bold tabular">{s.backlogs}</p>
                        <p className="text-[10px] text-muted-foreground">backlogs</p>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground mb-3">
                      {s.source === "courses" ? "Computed from linked courses" : "Manually entered"}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => setEditingId(s.semesterId)}>
                        <Pencil className="size-3 mr-1" /> Edit
                      </Button>
                      <DeleteSemesterButton id={s.semesterId} />
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DeleteSemesterButton({ id }: { id: string }) {
  const [, formAction, pending] = useActionState<ActionResult | null, FormData>(deleteSemester, null);
  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm("Delete this semester record? This cannot be undone.")) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button size="sm" variant="ghost" type="submit" disabled={pending}>
        <Trash2 className="size-3 mr-1" /> Delete
      </Button>
    </form>
  );
}
