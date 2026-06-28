"use client";

import { useActionState, useEffect, useState } from "react";
import { Clock, Plus, Trash2 } from "lucide-react";

import type { Tables } from "@/types/database";
import {
  logTime,
  deleteTimeEntryVoid as deleteTimeEntryAction,
} from "@/app/(app)/projects/[id]/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Constants } from "@/types/database";

const E = Constants.public.Enums;

const CATEGORY_LABELS: Record<string, string> = {
  design: "Design",
  frontend: "Frontend",
  backend: "Backend",
  testing: "Testing",
  meetings: "Meetings",
  research: "Research",
  deployment: "Deployment",
  other: "Other",
};

const CATEGORY_COLORS: Record<string, string> = {
  design: "bg-purple-500",
  frontend: "bg-blue-500",
  backend: "bg-emerald-500",
  testing: "bg-amber-500",
  meetings: "bg-red-500",
  research: "bg-cyan-500",
  deployment: "bg-orange-500",
  other: "bg-gray-500",
};

interface Props {
  project: Tables<"projects">;
  timeEntries: Tables<"project_time_entries">[];
  minutesByCategory: Record<string, number>;
  tasks: Tables<"project_tasks">[];
}

export function ProjectTimeTab({ project, timeEntries, minutesByCategory, tasks }: Props) {
  const [showForm, setShowForm] = useState(false);
  const totalMinutes = Object.values(minutesByCategory).reduce((sum, m) => sum + m, 0);

  const activeTasks = tasks.filter((t) => t.status !== "cancelled" && t.status !== "completed");

  return (
    <div className="space-y-6">
      {/* Summary + bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold">{(totalMinutes / 60).toFixed(1)}h</p>
            <p className="text-sm text-muted-foreground">
              total logged
              {project.estimated_hours && ` / ${project.estimated_hours}h estimated`}
            </p>
          </div>
          <Button size="sm" className="gap-1.5" onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4" />
            Log Time
          </Button>
        </div>

        {/* Stacked bar */}
        {totalMinutes > 0 && (
          <div className="space-y-2">
            <div className="h-3 rounded-full overflow-hidden flex gap-0.5">
              {E.time_entry_category.map((cat) => {
                const minutes = minutesByCategory[cat] ?? 0;
                if (minutes === 0) return null;
                const pct = (minutes / totalMinutes) * 100;
                return (
                  <div
                    key={cat}
                    className={`h-full ${CATEGORY_COLORS[cat]}`}
                    style={{ width: `${pct}%` }}
                    title={`${CATEGORY_LABELS[cat]}: ${(minutes / 60).toFixed(1)}h`}
                  />
                );
              })}
            </div>
            <div className="flex flex-wrap gap-3">
              {E.time_entry_category.map((cat) => {
                const minutes = minutesByCategory[cat] ?? 0;
                if (minutes === 0) return null;
                return (
                  <div key={cat} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <div className={`w-2 h-2 rounded-sm ${CATEGORY_COLORS[cat]}`} />
                    {CATEGORY_LABELS[cat]}: {(minutes / 60).toFixed(1)}h
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {project.estimated_hours && totalMinutes > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{Math.round((totalMinutes / 60 / project.estimated_hours) * 100)}%</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  totalMinutes / 60 > project.estimated_hours ? "bg-red-500" : "bg-emerald-500"
                }`}
                style={{
                  width: `${Math.min(100, (totalMinutes / 60 / project.estimated_hours) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Log time form */}
      {showForm && (
        <LogTimeForm
          projectId={project.id}
          tasks={activeTasks}
          onClose={() => setShowForm(false)}
        />
      )}

      {/* Time entries list */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Recent Entries
        </h2>
        {timeEntries.length === 0 ? (
          <p className="text-sm text-muted-foreground">No time logged yet.</p>
        ) : (
          <div className="space-y-1.5">
            {timeEntries.slice(0, 30).map((entry) => (
              <TimeEntryRow key={entry.id} entry={entry} projectId={project.id} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LogTimeForm({
  projectId,
  tasks,
  onClose,
}: {
  projectId: string;
  tasks: Tables<"project_tasks">[];
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState(logTime, null);

  useEffect(() => {
    if (state?.ok) onClose();
  }, [state, onClose]);

  return (
    <form action={action} className="p-4 rounded-lg border border-border/60 bg-white/5 space-y-3">
      <input type="hidden" name="project_id" value={projectId} />
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1.5">
          <Label className="text-xs">Description</Label>
          <Input name="description" placeholder="What did you work on?" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Category</Label>
          <select
            name="category"
            defaultValue="backend"
            className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
          >
            {E.time_entry_category.map((c) => (
              <option key={c} value={c} className="bg-background">
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Minutes *</Label>
          <Input name="minutes" type="number" min="1" max="1440" placeholder="60" required />
        </div>
        {tasks.length > 0 && (
          <div className="col-span-2 space-y-1.5">
            <Label className="text-xs">Task (optional)</Label>
            <select
              name="task_id"
              className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            >
              <option value="" className="bg-background">No specific task</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id} className="bg-background">
                  {t.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      {state && !state.ok && <p className="text-xs text-destructive">{state.error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Logging…" : "Log Time"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function TimeEntryRow({
  entry,
  projectId,
}: {
  entry: Tables<"project_time_entries">;
  projectId: string;
}) {
  const date = new Date(entry.logged_at).toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
  });

  return (
    <div className="flex items-center gap-3 p-2.5 rounded-lg border border-border/40 group hover:border-border/70 transition-colors">
      <div className={`w-2 h-2 rounded-sm flex-shrink-0 ${CATEGORY_COLORS[entry.category] ?? "bg-gray-500"}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{(entry.minutes / 60).toFixed(1)}h</span>
          <span className="text-xs text-muted-foreground">{CATEGORY_LABELS[entry.category]}</span>
          <span className="text-xs text-muted-foreground">{date}</span>
        </div>
        {entry.description && (
          <p className="text-xs text-muted-foreground truncate">{entry.description}</p>
        )}
      </div>
      <form action={deleteTimeEntryAction} className="opacity-0 group-hover:opacity-100 transition-opacity">
        <input type="hidden" name="entryId" value={entry.id} />
        <input type="hidden" name="projectId" value={projectId} />
        <button type="submit" className="text-muted-foreground hover:text-red-400 transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
