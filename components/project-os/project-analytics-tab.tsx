"use client";

import type { Tables } from "@/types/database";
import type { ProjectHealth } from "@/lib/services/project.service";
import { ProjectHealthRing } from "./project-health-ring";

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

interface Props {
  project: Tables<"projects">;
  tasks: Tables<"project_tasks">[];
  timeEntries: Tables<"project_time_entries">[];
  minutesByCategory: Record<string, number>;
  health: ProjectHealth | null;
}

export function ProjectAnalyticsTab({
  project,
  tasks,
  minutesByCategory,
  health,
}: Props) {
  const now = React.useMemo(() => Date.now(), []);

  const totalMinutes = Object.values(minutesByCategory).reduce((sum, m) => sum + m, 0);
  const totalHours = totalMinutes / 60;

  const tasksByStatus = {
    completed: tasks.filter((t) => t.status === "completed").length,
    in_progress: tasks.filter((t) => t.status === "in_progress").length,
    review: tasks.filter((t) => t.status === "review").length,
    blocked: tasks.filter((t) => t.status === "testing").length,
    backlog: tasks.filter((t) => t.status === "backlog" || t.status === "ready").length,
    cancelled: tasks.filter((t) => t.status === "cancelled").length,
  };

  const avgMinutesPerTask =
    tasks.filter((t) => t.status === "completed" && t.actual_minutes > 0).length > 0
      ? tasks
          .filter((t) => t.status === "completed" && t.actual_minutes > 0)
          .reduce((sum, t) => sum + t.actual_minutes, 0) /
        tasks.filter((t) => t.status === "completed" && t.actual_minutes > 0).length
      : null;

  const velocityPerDay = (() => {
    if (tasks.length === 0 || !project.start_date) return null;
    const daysElapsed = Math.ceil(
      (now - new Date(project.start_date).getTime()) / 86_400_000,
    );
    if (daysElapsed <= 0) return null;
    return (tasksByStatus.completed / daysElapsed).toFixed(1);
  })();

  return (
    <div className="space-y-6">
      {/* Health score */}
      {health && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-lg border border-border/60 bg-white/[0.02] flex items-center gap-3">
            <ProjectHealthRing score={health.overallScore} size="md" showLabel />
            <div>
              <p className="text-xs text-muted-foreground">Overall Health</p>
              <p className="text-sm font-medium">Score: {health.overallScore}</p>
            </div>
          </div>
          <div className="p-4 rounded-lg border border-border/60 bg-white/[0.02]">
            <p className="text-xs text-muted-foreground">Schedule</p>
            <p className={`text-sm font-medium capitalize mt-1 ${
              health.scheduleHealth === "on_track" ? "text-emerald-400" :
              health.scheduleHealth === "at_risk" ? "text-amber-400" :
              "text-red-400"
            }`}>
              {health.scheduleHealth.replace("_", " ")}
            </p>
          </div>
          <div className="p-4 rounded-lg border border-border/60 bg-white/[0.02]">
            <p className="text-xs text-muted-foreground">Budget</p>
            <p className={`text-sm font-medium capitalize mt-1 ${
              health.budgetHealth === "under" ? "text-emerald-400" :
              health.budgetHealth === "on_track" ? "text-blue-400" :
              health.budgetHealth === "over" ? "text-red-400" :
              "text-muted-foreground"
            }`}>
              {health.budgetHealth.replace("_", " ")}
            </p>
          </div>
          <div className="p-4 rounded-lg border border-border/60 bg-white/[0.02]">
            <p className="text-xs text-muted-foreground">Overdue</p>
            <p className={`text-2xl font-bold mt-1 ${health.overdueTasks > 0 ? "text-red-400" : "text-emerald-400"}`}>
              {health.overdueTasks}
            </p>
          </div>
        </div>
      )}

      {/* Task breakdown */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Task Breakdown
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {(
            [
              { label: "Completed", value: tasksByStatus.completed, color: "text-emerald-400" },
              { label: "In Progress", value: tasksByStatus.in_progress, color: "text-blue-400" },
              { label: "Review/Testing", value: tasksByStatus.review + tasksByStatus.blocked, color: "text-amber-400" },
              { label: "Backlog", value: tasksByStatus.backlog, color: "text-muted-foreground" },
              { label: "Cancelled", value: tasksByStatus.cancelled, color: "text-red-400/60" },
              { label: "Total", value: tasks.length, color: "text-foreground" },
            ] as const
          ).map(({ label, value, color }) => (
            <div key={label} className="p-3 rounded border border-border/40 bg-white/[0.02]">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={`text-xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>
        {velocityPerDay ? (
          <p className="text-sm text-muted-foreground">
            Velocity: <span className="text-foreground font-medium">{velocityPerDay} tasks/day</span>
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Set a start date on this project to see velocity.
          </p>
        )}
        {avgMinutesPerTask !== null && (
          <p className="text-sm text-muted-foreground">
            Avg time per completed task:{" "}
            <span className="text-foreground font-medium">
              {avgMinutesPerTask >= 60
                ? `${(avgMinutesPerTask / 60).toFixed(1)}h`
                : `${Math.round(avgMinutesPerTask)}m`}
            </span>
          </p>
        )}
      </div>

      {/* Time breakdown */}
      {totalHours > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Time by Category
          </h2>
          <div className="space-y-2">
            {Object.entries(minutesByCategory)
              .sort(([, a], [, b]) => b - a)
              .map(([cat, minutes]) => {
                const pct = (minutes / totalMinutes) * 100;
                return (
                  <div key={cat} className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-sm flex-shrink-0 ${CATEGORY_COLORS[cat] ?? "bg-gray-500"}`} />
                    <span className="text-sm text-muted-foreground w-24">{CATEGORY_LABELS[cat] ?? cat}</span>
                    <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${CATEGORY_COLORS[cat] ?? "bg-gray-500"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-14 text-right">
                      {(minutes / 60).toFixed(1)}h ({Math.round(pct)}%)
                    </span>
                  </div>
                );
              })}
          </div>
          <div className="pt-2 border-t border-border/40 flex justify-between text-sm">
            <span className="text-muted-foreground">Total logged</span>
            <span className="font-medium">{totalHours.toFixed(1)}h</span>
          </div>
          {project.estimated_hours && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Remaining estimate</span>
              <span className={`font-medium ${totalHours > project.estimated_hours ? "text-red-400" : "text-emerald-400"}`}>
                {Math.max(0, project.estimated_hours - totalHours).toFixed(1)}h
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
