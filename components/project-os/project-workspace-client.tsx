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
  initialTab,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [showEdit, setShowEdit] = useState(false);
  const activeTab = TABS.find((t) => t.id === initialTab) ? initialTab : "overview";

  const navigateTab = useCallback(
    (tab: string) => {
      router.replace(`${pathname}?tab=${tab}`, { scroll: false });
    },
    [pathname, router],
  );

  return (
    <div className="min-h-screen">
      {showEdit && (
        <ProjectEditForm project={project} onClose={() => setShowEdit(false)} />
      )}

      {/* Workspace header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border/60">
        <div className="px-4 md:px-6 lg:px-8 max-w-7xl mx-auto">
          {/* Back + title */}
          <div className="flex items-center gap-3 py-3 border-b border-border/40">
            <button
              onClick={() => router.push("/projects")}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-semibold text-base truncate">{project.title}</h1>
                <span className={`text-xs ${STATUS_COLORS[project.status]} capitalize`}>
                  {project.status.replace("_", " ")}
                </span>
              </div>
              {project.client_name && (
                <p className="text-xs text-muted-foreground">{project.client_name}</p>
              )}
            </div>
            <button
              onClick={() => setShowEdit(true)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-white/5"
            >
              <Pencil className="w-3 h-3" />
              Edit
            </button>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-0 overflow-x-auto scrollbar-none">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => navigateTab(id)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-sm border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === id
                    ? "border-white text-white"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="px-4 md:px-6 lg:px-8 max-w-7xl mx-auto py-6">
        {activeTab === "overview" && (
          <ProjectOverviewTab project={project} health={health} milestones={milestones} tasks={tasks} />
        )}
        {activeTab === "tasks" && (
          <ProjectTasksTab project={project} tasks={tasks} />
        )}
        {activeTab === "time" && (
          <ProjectTimeTab
            project={project}
            timeEntries={timeEntries}
            minutesByCategory={minutesByCategory}
            tasks={tasks}
          />
        )}
        {activeTab === "docs" && (
          <ProjectDocsTab project={project} documents={documents} />
        )}
        {activeTab === "changes" && (
          <ProjectChangeRequestsTab project={project} changeRequests={changeRequests} />
        )}
        {activeTab === "quote" && (
          <ProjectQuoteTab project={project} quotes={quotes} />
        )}
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
  );
}
