"use client";

import { useState, useActionState, useEffect } from "react";
import {
  Circle,
  Plus,
  ArrowRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Trash2,
} from "lucide-react";

import type { Tables } from "@/types/database";
import {
  createTask,
  updateTaskVoid as updateTaskAction,
  deleteTaskVoid as deleteTaskAction,
} from "@/app/(app)/projects/[id]/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Constants } from "@/types/database";

const E = Constants.public.Enums;

const STATUS_ORDER: Tables<"project_tasks">["status"][] = [
  "backlog",
  "ready",
  "in_progress",
  "review",
  "testing",
  "completed",
];

const STATUS_LABELS: Record<Tables<"project_tasks">["status"], string> = {
  backlog: "Backlog",
  ready: "Ready",
  in_progress: "In Progress",
  review: "Review",
  testing: "Testing",
  completed: "Done",
  cancelled: "Cancelled",
};

const STATUS_COLORS: Record<Tables<"project_tasks">["status"], string> = {
  backlog: "border-gray-600/40 text-gray-400",
  ready: "border-blue-500/30 text-blue-400",
  in_progress: "border-blue-500/50 text-blue-300",
  review: "border-amber-500/40 text-amber-400",
  testing: "border-purple-500/40 text-purple-400",
  completed: "border-emerald-500/30 text-emerald-400",
  cancelled: "border-gray-600/30 text-gray-500",
};

const PRIORITY_DOT: Record<string, string> = {
  critical: "bg-red-400",
  high: "bg-orange-400",
  medium: "bg-yellow-400",
  low: "bg-gray-500",
};

const NEXT_STATUS: Partial<Record<Tables<"project_tasks">["status"], Tables<"project_tasks">["status"]>> = {
  backlog: "ready",
  ready: "in_progress",
  in_progress: "review",
  review: "testing",
  testing: "completed",
};

interface Props {
  project: Tables<"projects">;
  tasks: Tables<"project_tasks">[];
}

export function ProjectTasksTab({ project, tasks }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "board">("list");

  const activeTasks = tasks.filter((t) => t.status !== "cancelled");
  const tasksByStatus = STATUS_ORDER.reduce<Record<string, Tables<"project_tasks">[]>>(
    (acc, s) => {
      acc[s] = activeTasks.filter((t) => t.status === s);
      return acc;
    },
    {},
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("list")}
            className={`text-sm px-3 py-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-white/10 text-white" : "text-muted-foreground hover:text-white"}`}
          >
            List
          </button>
          <button
            onClick={() => setViewMode("board")}
            className={`text-sm px-3 py-1.5 rounded-md transition-colors ${viewMode === "board" ? "bg-white/10 text-white" : "text-muted-foreground hover:text-white"}`}
          >
            Board
          </button>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4" />
          Add Task
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <TaskCreateForm projectId={project.id} onClose={() => setShowForm(false)} />
      )}

      {/* Views */}
      {viewMode === "list" ? (
        <ListView tasksByStatus={tasksByStatus} projectId={project.id} />
      ) : (
        <BoardView tasksByStatus={tasksByStatus} projectId={project.id} />
      )}
    </div>
  );
}

function ListView({
  tasksByStatus,
  projectId,
}: {
  tasksByStatus: Record<string, Tables<"project_tasks">[]>;
  projectId: string;
}) {
  return (
    <div className="space-y-4">
      {STATUS_ORDER.filter((s) => s !== "cancelled").map((status) => {
        const tasks = tasksByStatus[status] ?? [];
        if (tasks.length === 0) return null;
        return (
          <div key={status} className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium px-2 py-0.5 rounded border ${STATUS_COLORS[status]}`}>
                {STATUS_LABELS[status]}
              </span>
              <span className="text-xs text-muted-foreground">{tasks.length}</span>
            </div>
            {tasks.map((task) => (
              <TaskRow key={task.id} task={task} projectId={projectId} />
            ))}
          </div>
        );
      })}
      {Object.values(tasksByStatus).every((arr) => arr.length === 0) && (
        <p className="text-sm text-muted-foreground text-center py-8">
          No tasks yet. Add your first task above.
        </p>
      )}
    </div>
  );
}

function BoardView({
  tasksByStatus,
  projectId,
}: {
  tasksByStatus: Record<string, Tables<"project_tasks">[]>;
  projectId: string;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 overflow-x-auto">
      {STATUS_ORDER.filter((s) => s !== "cancelled").map((status) => {
        const tasks = tasksByStatus[status] ?? [];
        return (
          <div key={status} className="min-w-32">
            <div className={`text-xs font-medium px-2 py-1 rounded border mb-2 text-center ${STATUS_COLORS[status]}`}>
              {STATUS_LABELS[status]}
              <span className="ml-1 text-muted-foreground">({tasks.length})</span>
            </div>
            <div className="space-y-1.5">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="p-2 rounded bg-white/5 border border-border/40 text-xs"
                >
                  <div className="flex items-start gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full mt-0.5 flex-shrink-0 ${PRIORITY_DOT[task.priority]}`} />
                    <span className="leading-tight">{task.title}</span>
                  </div>
                  {task.estimated_minutes && (
                    <p className="text-muted-foreground mt-1 flex items-center gap-0.5">
                      <Clock className="w-3 h-3" />
                      {task.estimated_minutes}m
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TaskRow({
  task,
  projectId,
}: {
  task: Tables<"project_tasks">;
  projectId: string;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const isOverdue = task.due_date && task.due_date < today && task.status !== "completed";
  const nextStatus = NEXT_STATUS[task.status];

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-border/40 hover:border-border/70 bg-white/[0.02] hover:bg-white/[0.04] transition-all group">
      {/* Checkbox / complete button */}
      <form action={updateTaskAction}>
        <input type="hidden" name="taskId" value={task.id} />
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="status" value="completed" />
        <button
          type="submit"
          className={`flex-shrink-0 transition-colors ${task.status === "completed" ? "text-emerald-400" : "text-muted-foreground hover:text-emerald-400"}`}
        >
          {task.status === "completed" ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <Circle className="w-4 h-4" />
          )}
        </button>
      </form>

      {/* Priority dot */}
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_DOT[task.priority]}`} />

      {/* Title + metadata */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {task.estimated_minutes && (
            <span className="text-xs text-muted-foreground flex items-center gap-0.5">
              <Clock className="w-3 h-3" />
              {task.estimated_minutes}m
            </span>
          )}
          {isOverdue && (
            <span className="text-xs text-red-400 flex items-center gap-0.5">
              <AlertTriangle className="w-3 h-3" />
              Overdue
            </span>
          )}
          {task.due_date && !isOverdue && (
            <span className="text-xs text-muted-foreground">{task.due_date}</span>
          )}
        </div>
      </div>

      {/* Advance status */}
      {nextStatus && task.status !== "completed" && (
        <form action={updateTaskAction} className="opacity-0 group-hover:opacity-100 transition-opacity">
          <input type="hidden" name="taskId" value={task.id} />
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="status" value={nextStatus} />
          <button
            type="submit"
            className="text-xs text-muted-foreground hover:text-white transition-colors flex items-center gap-0.5 px-2 py-1 rounded hover:bg-white/10"
          >
            {STATUS_LABELS[nextStatus]}
            <ArrowRight className="w-3 h-3" />
          </button>
        </form>
      )}

      {/* Delete */}
      <form action={deleteTaskAction} className="opacity-0 group-hover:opacity-100 transition-opacity">
        <input type="hidden" name="taskId" value={task.id} />
        <input type="hidden" name="projectId" value={projectId} />
        <button
          type="submit"
          className="text-muted-foreground hover:text-red-400 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}

function TaskCreateForm({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const [state, action, pending] = useActionState(createTask, null);

  useEffect(() => {
    if (state?.ok) onClose();
  }, [state, onClose]);

  return (
    <form action={action} className="p-4 rounded-lg border border-border/60 bg-white/5 space-y-3">
      <input type="hidden" name="project_id" value={projectId} />
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1.5">
          <Label className="text-xs">Title *</Label>
          <Input name="title" placeholder="e.g. Implement auth flow" required />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Priority</Label>
          <select
            name="priority"
            defaultValue="medium"
            className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
          >
            {E.project_priority.map((p) => (
              <option key={p} value={p} className="bg-background capitalize">
                {p}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Status</Label>
          <select
            name="status"
            defaultValue="backlog"
            className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
          >
            {E.task_status.filter((s) => s !== "cancelled").map((s) => (
              <option key={s} value={s} className="bg-background">
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Estimate (min)</Label>
          <Input name="estimated_minutes" type="number" min="1" placeholder="60" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Due date</Label>
          <Input name="due_date" type="date" />
        </div>
      </div>
      {state && !state.ok && <p className="text-xs text-destructive">{state.error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Adding…" : "Add Task"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
