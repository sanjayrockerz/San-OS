"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutGrid,
  CheckSquare,
  FileText,
  BarChart2,
  ArrowLeft,
  Pencil,
} from "lucide-react";

import type { Tables } from "@/types/database";
import type { ProjectHealth } from "@/lib/services/project.service";
import { ProjectOverviewTab } from "./project-overview-tab";
import { ProjectTasksTab } from "./project-tasks-tab";
import { ProjectDocsTab } from "./project-docs-tab";
import { ProjectAnalyticsTab } from "./project-analytics-tab";
import { ProjectEditForm } from "./project-edit-form";

interface Props {
  project: Tables<"projects">;
  tasks: Tables<"project_tasks">[];
  milestones: Tables<"project_milestones">[];
  timeEntries: Tables<"project_time_entries">[];
  documents: Tables<"project_documents">[];
  changeRequests: Tables<"project_change_requests">[];
  quotes: Tables<"project_quotes">[];
  health: ProjectHealth | null;
  minutesByCategory: Record<string, number>;
  initialTab: string;
}

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "tasks", label: "Tasks", icon: CheckSquare },
  { id: "docs", label: "Docs", icon: FileText },
  { id: "analytics", label: "Analytics", icon: BarChart2 },
];

const STATUS_COLORS: Record<Tables<"projects">["status"], string> = {
  planning: "text-blue-400",
  active: "text-emerald-400",
  on_hold: "text-amber-400",
  completed: "text-gray-400",
  cancelled: "text-red-400",
  archived: "text-gray-500",
};

export function ProjectWorkspaceClient({
  project,
  tasks,
  milestones,
  timeEntries,
  documents,
  health,
  minutesByCategory,
  initialTab,
}: Props) {
  const router = useRouter();
  const [showEdit, setShowEdit] = useState(false);
  const [activeTab, setActiveTab] = useState(() => TABS.some((tab) => tab.id === initialTab) ? initialTab : "overview");

  return (
    <div className="min-h-screen bg-background text-foreground">
      {showEdit && (
        <ProjectEditForm project={project} onClose={() => setShowEdit(false)} />
      )}

      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border/40 pb-4 pt-10">
        <div className="px-4 sm:px-8 lg:px-12 max-w-4xl mx-auto space-y-3">
          <button
            onClick={() => router.push("/projects")}
            className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 text-sm min-h-[44px] sm:min-h-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Workspace
          </button>
          
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="page-title truncate">{project.title}</h1>
              {project.client_name && (
                <p className="mt-2 flex items-center gap-2 text-muted-foreground text-sm">
                  <LayoutGrid className="w-4 h-4 shrink-0" /> {project.client_name}
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <span className={`text-sm px-3 py-1 rounded-full bg-secondary ${STATUS_COLORS[project.status]} capitalize`}>
                {project.status.replace("_", " ")}
              </span>
              <button
                onClick={() => setShowEdit(true)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-md hover:bg-white/5 min-h-[36px]"
              >
                <Pencil className="w-3 h-3" /> Edit
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-8 lg:px-12 max-w-5xl mx-auto py-6 sm:py-8">
        <div className="mb-6 flex gap-1 overflow-x-auto rounded-2xl border border-border bg-card/70 p-1.5 scrollbar-none">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-medium transition-colors ${activeTab === id ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}
            >
              <Icon className="size-4" /> {label}
            </button>
          ))}
        </div>

        <div className="animate-fade-up">
          {activeTab === "overview" && <ProjectOverviewTab project={project} health={health} milestones={milestones} tasks={tasks} />}
          {activeTab === "tasks" && <ProjectTasksTab project={project} tasks={tasks} />}
          {activeTab === "docs" && <ProjectDocsTab project={project} documents={documents} />}
          {activeTab === "analytics" && (
            <ProjectAnalyticsTab
              project={project}
              tasks={tasks}
              timeEntries={timeEntries}
              minutesByCategory={minutesByCategory}
              health={health}
            />
          )}
        </div>
      </div>
    </div>
  );
}
