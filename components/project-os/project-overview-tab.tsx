"use client";
import React from "react";

import { useState } from "react";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  GitBranch,
  ExternalLink,
  Plus,
  Flag,
} from "lucide-react";

import type { Tables } from "@/types/database";
import type { ProjectHealth } from "@/lib/services/project.service";
import { completeMilestoneVoid as completeMilestoneAction } from "@/app/(app)/projects/[id]/actions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProjectHealthRing } from "./project-health-ring";
import { MilestoneCreateForm } from "./milestone-create-form";

interface Props {
  project: Tables<"projects">;
  health: ProjectHealth | null;
  milestones: Tables<"project_milestones">[];
  tasks: Tables<"project_tasks">[];
}

const SCHEDULE_COLORS: Record<string, string> = {
  on_track: "text-emerald-400",
  at_risk: "text-amber-400",
  delayed: "text-red-400",
};

function formatINR(amount: number): string {
  if (amount >= 100_000) return `₹${(amount / 100_000).toFixed(1)}L`;
  if (amount >= 1_000) return `₹${(amount / 1_000).toFixed(0)}k`;
  return `₹${amount}`;
}

const BUDGET_COLORS: Record<string, string> = {
  under: "text-emerald-400",
  on_track: "text-blue-400",
  over: "text-red-400",
  unknown: "text-muted-foreground",
};

export function ProjectOverviewTab({ project, health, milestones, tasks }: Props) {
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);

  const pendingMilestones = milestones.filter((m) => !m.completed_at);
  const completedMilestones = milestones.filter((m) => m.completed_at);
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress");
  const blockedTasks = tasks.filter((t) => t.status === "review" || t.status === "testing");

  return (
    <div className="space-y-6">
      {/* Health + key metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {health && (
          <Card className="p-4 col-span-2 sm:col-span-1 border-border/60">
            <div className="flex items-center gap-3">
              <ProjectHealthRing score={health.overallScore} size="lg" showLabel />
              <div>
                <p className="text-xs text-muted-foreground">Health</p>
                <p className={`text-sm font-medium ${SCHEDULE_COLORS[health.scheduleHealth]}`}>
                  {health.scheduleHealth.replace("_", " ")}
                </p>
              </div>
            </div>
          </Card>
        )}

        <Card className="p-4 border-border/60">
          <p className="text-xs text-muted-foreground mb-1">Progress</p>
          <p className="text-2xl font-bold">{health?.progressScore ?? 0}%</p>
          <p className="text-xs text-muted-foreground mt-1">
            {health?.completedTasks ?? 0}/{(health?.completedTasks ?? 0) + (health?.openTasks ?? 0)} tasks
          </p>
          <div className="h-1 bg-white/5 rounded-full mt-2">
            <div
              className="h-full bg-emerald-500 rounded-full"
              style={{ width: `${health?.progressScore ?? 0}%` }}
            />
          </div>
        </Card>

        <Card className="p-4 border-border/60">
          <p className="text-xs text-muted-foreground mb-1">Hours</p>
          <p className="text-2xl font-bold">{Math.round(project.actual_hours)}h</p>
          {project.estimated_hours && (
            <p className={`text-xs mt-1 ${
              health?.hoursVariance !== null && (health?.hoursVariance ?? 0) > 20
                ? "text-red-400"
                : "text-muted-foreground"
            }`}>
              of {project.estimated_hours}h estimated
              {health?.hoursVariance !== null && ` (${(health?.hoursVariance ?? 0) > 0 ? "+" : ""}${health?.hoursVariance}%)`}
            </p>
          )}
        </Card>

        {project.budget && (
          <Card className="p-4 border-border/60">
            <p className="text-xs text-muted-foreground mb-1">Budget</p>
            <p className="text-2xl font-bold">
              {formatINR(project.budget)}
            </p>
            <p className={`text-xs mt-1 ${health ? BUDGET_COLORS[health.budgetHealth] : "text-muted-foreground"}`}>
              {health?.budgetHealth === "over" ? "Over budget" :
               health?.budgetHealth === "on_track" ? "On track" :
               health?.budgetHealth === "under" ? "Under budget" : "No cost data"}
            </p>
          </Card>
        )}
      </div>

      {/* Active work */}
      {(inProgressTasks.length > 0 || blockedTasks.length > 0) && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Active Now
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {inProgressTasks.slice(0, 4).map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-border/40"
              >
                <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{task.title}</p>
                  {task.estimated_minutes && (
                    <p className="text-xs text-muted-foreground">~{task.estimated_minutes}m</p>
                  )}
                </div>
                <Badge variant="outline" className="text-xs border-blue-500/30 text-blue-400">
                  In Progress
                </Badge>
              </div>
            ))}
            {blockedTasks.slice(0, 2).map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20"
              >
                <Clock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{task.title}</p>
                </div>
                <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-400 capitalize">
                  {task.status === "review" ? "Review" : "Testing"}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Milestones */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Milestones
          </h2>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => setShowMilestoneForm(!showMilestoneForm)}
          >
            <Plus className="w-3 h-3" />
            Add
          </Button>
        </div>

        {showMilestoneForm && (
          <MilestoneCreateForm
            projectId={project.id}
            onClose={() => setShowMilestoneForm(false)}
          />
        )}

        {milestones.length === 0 ? (
          <p className="text-sm text-muted-foreground">No milestones yet.</p>
        ) : (
          <div className="space-y-2">
            {pendingMilestones.map((m) => (
              <MilestoneRow key={m.id} milestone={m} projectId={project.id} />
            ))}
            {completedMilestones.length > 0 && (
              <div className="mt-3 space-y-2 opacity-50">
                {completedMilestones.slice(0, 3).map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-2 p-2 rounded text-sm text-muted-foreground"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="line-through">{m.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Project links */}
      {(project.repository_url || project.deployment_url || project.production_url) && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Links
          </h2>
          <div className="flex items-center gap-3 flex-wrap">
            {project.repository_url && (
              <a
                href={project.repository_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-white transition-colors"
              >
                <GitBranch className="w-4 h-4" />
                Repository
              </a>
            )}
            {project.deployment_url && (
              <a
                href={project.deployment_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-white transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Staging
              </a>
            )}
            {project.production_url && (
              <a
                href={project.production_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-white transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Production
              </a>
            )}
          </div>
        </div>
      )}

      {/* Description */}
      {project.description && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            About
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{project.description}</p>
        </div>
      )}
    </div>
  );
}

function MilestoneRow({
  milestone,
  projectId,
}: {
  milestone: Tables<"project_milestones">;
  projectId: string;
}) {
  const [now] = React.useState(() => Date.now());
  
  const daysLeft = milestone.target_date
    ? Math.ceil((new Date(milestone.target_date).getTime() - now) / 86_400_000)
    : null;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-border/40 hover:border-border/70 transition-colors">
      <Flag className="w-4 h-4 text-amber-400 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm">{milestone.title}</p>
        {milestone.target_date && (
          <p className={`text-xs mt-0.5 ${daysLeft !== null && daysLeft < 0 ? "text-red-400" : "text-muted-foreground"}`}>
            {daysLeft !== null
              ? daysLeft < 0
                ? `${Math.abs(daysLeft)}d overdue`
                : daysLeft === 0
                ? "Due today"
                : `${daysLeft}d left`
              : milestone.target_date}
          </p>
        )}
      </div>
      <form action={completeMilestoneAction}>
        <input type="hidden" name="milestoneId" value={milestone.id} />
        <input type="hidden" name="projectId" value={projectId} />
        <button type="submit" className="text-xs text-muted-foreground hover:text-emerald-400 transition-colors">
          Complete
        </button>
      </form>
    </div>
  );
}
