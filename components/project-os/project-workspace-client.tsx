"use client";

import { useRouter, usePathname } from "next/navigation";
import { useCallback, useState } from "react";
import {
  LayoutGrid,
  CheckSquare,
  Clock,
  FileText,
  GitBranch,
  FileEdit,
  BarChart2,
  ArrowLeft,
  Pencil,
} from "lucide-react";

import type { Tables } from "@/types/database";
import type { ProjectHealth } from "@/lib/services/project.service";
import { ProjectOverviewTab } from "./project-overview-tab";
import { ProjectTasksTab } from "./project-tasks-tab";
import { ProjectTimeTab } from "./project-time-tab";
import { ProjectDocsTab } from "./project-docs-tab";
import { ProjectChangeRequestsTab } from "./project-change-requests-tab";
import { ProjectQuoteTab } from "./project-quote-tab";
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
  { id: "time", label: "Time", icon: Clock },
  { id: "docs", label: "Docs", icon: FileText },
  { id: "changes", label: "Changes", icon: GitBranch },
  { id: "quote", label: "Quote", icon: FileEdit },
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
  changeRequests,
  quotes,
  health,
  minutesByCategory,
}: Props) {
  const router = useRouter();
  const [showEdit, setShowEdit] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {showEdit && (
        <ProjectEditForm project={project} onClose={() => setShowEdit(false)} />
      )}

      {/* Notion-style Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border/40 pb-4 pt-10">
        <div className="px-4 md:px-8 lg:px-12 max-w-4xl mx-auto space-y-4">
          <button
            onClick={() => router.push("/projects")}
            className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 text-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Workspace
          </button>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">{project.title}</h1>
              {project.client_name && (
                <p className="mt-2 flex items-center gap-2 text-muted-foreground">
                  <LayoutGrid className="w-4 h-4" /> Client: {project.client_name}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className={`text-sm px-3 py-1 rounded-full bg-secondary ${STATUS_COLORS[project.status]} capitalize`}>
                {project.status.replace("_", " ")}
              </span>
              <button
                onClick={() => setShowEdit(true)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-white/5"
              >
                <Pencil className="w-3 h-3" /> Edit properties
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notion-style Continuous Content */}
      <div className="px-4 md:px-8 lg:px-12 max-w-4xl mx-auto py-12 space-y-16">
        
        {/* Overview Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2 border-b border-border/40 pb-2">
            <FileText className="w-5 h-5 text-muted-foreground" /> Overview
          </h2>
          <ProjectOverviewTab project={project} health={health} milestones={milestones} tasks={tasks} />
        </section>

        {/* Tasks & Milestones Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2 border-b border-border/40 pb-2">
            <CheckSquare className="w-5 h-5 text-muted-foreground" /> Tasks & Milestones
          </h2>
          <ProjectTasksTab project={project} tasks={tasks} />
        </section>

        {/* Analytics & Health Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2 border-b border-border/40 pb-2">
            <BarChart2 className="w-5 h-5 text-muted-foreground" /> Analytics & Health
          </h2>
          <ProjectAnalyticsTab
            project={project}
            tasks={tasks}
            timeEntries={timeEntries}
            minutesByCategory={minutesByCategory}
            health={health}
          />
        </section>

        {/* Resources & Docs Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2 border-b border-border/40 pb-2">
            <FileText className="w-5 h-5 text-muted-foreground" /> Resources & Documents
          </h2>
          <ProjectDocsTab project={project} documents={documents} />
        </section>
        
      </div>
    </div>
  );
}
