"use client";
import React from "react";

import Link from "next/link";
import { useState } from "react";
import {
  FolderKanban,
  Plus,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";

import type { Tables } from "@/types/database";
import type { ProjectHealth } from "@/lib/services/project.service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ProjectHealthRing } from "./project-health-ring";

interface ProjectView {
  project: Tables<"projects">;
  health: ProjectHealth | null;
}

const STATUS_COLORS: Record<Tables<"projects">["status"], string> = {
  planning: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  on_hold: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  completed: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
  archived: "bg-gray-500/10 text-gray-500 border-gray-600/20",
};

const STATUS_LABELS: Record<Tables<"projects">["status"], string> = {
  planning: "Planning",
  active: "Active",
  on_hold: "On Hold",
  completed: "Completed",
  cancelled: "Cancelled",
  archived: "Archived",
};

const TYPE_LABELS: Record<Tables<"projects">["type"], string> = {
  client: "Client",
  internal: "Internal",
  open_source: "Open Source",
};

const PRIORITY_DOT: Record<Tables<"projects">["priority"], string> = {
  critical: "text-red-400",
  high: "text-orange-400",
  medium: "text-yellow-400",
  low: "text-gray-500",
};

type FilterStatus = "all" | Tables<"projects">["status"];

export function ProjectListClient({ projects }: { projects: ProjectView[] }) {
  const [filter, setFilter] = useState<FilterStatus>("all");

  const visible = filter === "all" ? projects : projects.filter((p) => p.project.status === filter);
  const active = projects.filter((p) => p.project.status === "active");
  const blocked = projects.filter((p) => (p.health?.overdueTasks ?? 0) > 0);

  const filters: Array<{ value: FilterStatus; label: string }> = [
    { value: "all", label: `All (${projects.length})` },
    { value: "active", label: `Active (${active.length})` },
    { value: "planning", label: "Planning" },
    { value: "on_hold", label: "On Hold" },
    { value: "completed", label: "Completed" },
  ];

  return (
    <div className="space-y-6">
      {/* Command bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                filter === f.value
                  ? "bg-white/10 border-white/20 text-white"
                  : "border-transparent text-muted-foreground hover:text-white hover:bg-white/5"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <Link href="/projects/new">
          <Button size="sm" className="gap-1.5">
            <Plus className="w-4 h-4" />
            New Project
          </Button>
        </Link>
      </div>

      {/* Summary chips */}
      {projects.length > 0 && (
        <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            {active.length} active
          </span>
          {blocked.length > 0 && (
            <span className="flex items-center gap-1.5 text-amber-400">
              <AlertTriangle className="w-3.5 h-3.5" />
              {blocked.length} with overdue tasks
            </span>
          )}
        </div>
      )}

      {/* Project cards */}
      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/40 px-6 py-14 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <FolderKanban className="size-5" />
          </div>
          <p className="mt-4 text-sm font-medium">No projects yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Start a new project to track your client work and engineering progress.
          </p>
          <Link href="/projects/new" className="mt-4">
            <Button size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" />
              New Project
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map(({ project, health }) => (
            <ProjectCard key={project.id} project={project} health={health} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectCard({
  project,
  health,
}: {
  project: Tables<"projects">;
  health: ProjectHealth | null;
}) {
  const [now] = React.useState(() => Date.now());
  
  const daysUntilDeadline = project.deadline
    ? Math.ceil((new Date(project.deadline).getTime() - now) / 86_400_000)
    : null;

  const deadlineWarning =
    daysUntilDeadline !== null && daysUntilDeadline <= 7 && project.status !== "completed";

  return (
    <Link href={`/projects/${project.id}`} className="block group">
      <Card className="p-4 border-border/60 hover:border-border hover:bg-white/[0.02] transition-all cursor-pointer">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_DOT[project.priority].replace("text-", "bg-")}`}
                />
                <span className="text-xs text-muted-foreground">{TYPE_LABELS[project.type]}</span>
              </div>
              <h3 className="font-medium text-sm text-foreground truncate group-hover:text-white transition-colors">
                {project.title}
              </h3>
              {project.client_name && (
                <p className="text-xs text-muted-foreground mt-0.5">{project.client_name}</p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {health && (
                <ProjectHealthRing score={health.overallScore} size="sm" />
              )}
              <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
            </div>
          </div>

          {/* Status + deadline */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              className={`text-xs border ${STATUS_COLORS[project.status]}`}
              variant="outline"
            >
              {STATUS_LABELS[project.status]}
            </Badge>
            {daysUntilDeadline !== null && project.status !== "completed" && (
              <span
                className={`text-xs flex items-center gap-1 ${
                  deadlineWarning ? "text-amber-400" : "text-muted-foreground"
                }`}
              >
                <Clock className="w-3 h-3" />
                {daysUntilDeadline < 0
                  ? `${Math.abs(daysUntilDeadline)}d overdue`
                  : `${daysUntilDeadline}d left`}
              </span>
            )}
          </div>

          {/* Progress bar */}
          {health && health.openTasks + health.completedTasks > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{health.completedTasks}/{health.openTasks + health.completedTasks} tasks</span>
                {health.overdueTasks > 0 && (
                  <span className="text-amber-400">{health.overdueTasks} overdue</span>
                )}
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${health.progressScore}%` }}
                />
              </div>
            </div>
          )}

          {/* Hours */}
          {project.estimated_hours && (
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {Math.round(project.actual_hours)}h / {project.estimated_hours}h
            </div>
          )}

          {/* Tags */}
          {project.tags.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              {project.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-1.5 py-0.5 rounded bg-white/5 text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
              {project.tags.length > 3 && (
                <span className="text-xs text-muted-foreground">+{project.tags.length - 3}</span>
              )}
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}
