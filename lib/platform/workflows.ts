import { EventBus } from "@/lib/event-bus";
import type { WorkflowDefinition } from "@/lib/workflow";
import type { Repositories } from "@/lib/repositories";
import { intervalFor } from "@/lib/services/revision.service";

function addDays(from: Date, days: number): Date {
  const d = new Date(from);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

export function createWorkflows(eventBus: EventBus, repos: Repositories): WorkflowDefinition[] {
  return [
    {
      id: "invoice-paid-workflow",
      name: "Invoice Paid",
      description: "Process invoice payment",
      version: "1.0.0",
      trigger: { type: "event", eventType: "invoice.paid" },
      steps: [
        { id: "create-income", name: "Create Income Entry", execute: async (_input, ctx) => { await eventBus.emit(ctx.userId, "finance.income_recorded", {}); return { done: true }; } },
        { id: "update-client-health", name: "Update Client Health", execute: async (_input, ctx) => { await eventBus.emit(ctx.userId, "client.health_updated", {}); return { done: true }; } },
        { id: "update-revenue", name: "Update Revenue Analytics", execute: async (_input, ctx) => { await eventBus.emit(ctx.userId, "analytics.revenue_updated", {}); return { done: true }; } },
        { id: "add-timeline-event", name: "Add Timeline Event", execute: async (_input, ctx) => { await eventBus.emit(ctx.userId, "timeline.event_added", {}); return { done: true }; } },
        { id: "send-notification", name: "Send Payment Notification", execute: async (_input, ctx) => { await eventBus.emit(ctx.userId, "notification.sent", {}); return { done: true }; } },
        { id: "update-memory-graph", name: "Update Memory Graph", execute: async (_input, ctx) => { await eventBus.emit(ctx.userId, "memory.graph_updated", {}); return { done: true }; } },
        { id: "trigger-business-coach", name: "Trigger Business Coach", execute: async (_input, ctx) => { await eventBus.emit(ctx.userId, "business.coach_triggered", {}); return { done: true }; } },
      ],
    },
    {
      id: "problem-solved-workflow",
      name: "Problem Solved",
      description: "Process problem solution",
      version: "1.0.0",
      trigger: { type: "event", eventType: "problem.solved" },
      steps: [
        {
          id: "schedule-revision",
          name: "Schedule Revision",
          execute: async (input, ctx) => {
            const p = (input ?? {}) as { problemId?: string; editorialUsed?: boolean };
            const existing = await repos.revision.findByProblem(ctx.userId, p.problemId!);
            if (!existing) {
              const now = new Date();
              await repos.revision.create({
                user_id: ctx.userId,
                problem_id: p.problemId!,
                current_state: "learning",
                last_revision: now.toISOString(),
                next_revision: addDays(now, intervalFor(0)).toISOString(),
                success_count: 0,
                failure_count: 0,
                editorial_dependency: p.editorialUsed ?? false,
              });
            }
            await eventBus.emit(ctx.userId, "revision.scheduled", { problemId: p.problemId });
            return { scheduled: true };
          },
        },
        {
          id: "update-roadmaps",
          name: "Update Roadmaps",
          execute: async (input, ctx) => {
            const p = (input ?? {}) as { problemId?: string };
            const items = await repos.roadmapItems.findByProblem(p.problemId!);
            let updated = 0;
            const now = new Date().toISOString();
            for (const item of items) {
              const existing = await repos.roadmapProgress.findByItem(ctx.userId, item.id);
              if (existing) {
                if (existing.status !== "completed") {
                  await repos.roadmapProgress.update(existing.id, { status: "completed", completed_at: now });
                  updated++;
                }
              } else {
                await repos.roadmapProgress.create({
                  user_id: ctx.userId,
                  roadmap_id: item.roadmap_id,
                  item_id: item.id,
                  status: "completed",
                  completed_at: now,
                });
                updated++;
              }
            }
            if (updated > 0) {
              await eventBus.emit(ctx.userId, "roadmap.progressed", { problemId: p.problemId, itemsUpdated: updated });
            }
            return { roadmapsUpdated: updated };
          },
        },
        {
          id: "log-activity",
          name: "Log Activity",
          execute: async (input, ctx) => {
            const p = (input ?? {}) as { problemId?: string; attemptId?: string; solveStatus?: string | null };
            await repos.activity.create({
              user_id: ctx.userId,
              type: "problem_solved",
              title: "Solved a problem",
              entity_type: "problem",
              entity_id: p.problemId!,
              metadata: { attemptId: p.attemptId, solveStatus: p.solveStatus },
              occurred_at: new Date().toISOString(),
            });
            const today = new Date().toISOString().slice(0, 10);
            const existingLog = await repos.dailyLogs.findByDate(ctx.userId, today);
            if (existingLog) {
              await repos.dailyLogs.update(existingLog.id, {
                problems_solved: (existingLog.problems_solved ?? 0) + 1,
              });
            } else {
              await repos.dailyLogs.create({
                user_id: ctx.userId,
                log_date: today,
                problems_solved: 1,
              });
            }
            return { logged: true };
          },
        },
        {
          id: "update-timeline",
          name: "Update Timeline",
          execute: async (input, ctx) => {
            const p = (input ?? {}) as { problemId?: string };
            await eventBus.emit(ctx.userId, "timeline.event_added", { problemId: p.problemId });
            return { updated: true };
          },
        },
        {
          id: "update-memory-graph",
          name: "Update Memory Graph",
          execute: async (_input, ctx) => {
            await eventBus.emit(ctx.userId, "memory.graph_updated", {});
            return { updated: true };
          },
        },
        {
          id: "trigger-coach",
          name: "Trigger Coach Update",
          execute: async (_input, ctx) => {
            await eventBus.emit(ctx.userId, "coach.triggered", {});
            return { triggered: true };
          },
        },
        {
          id: "send-notification",
          name: "Send Notification",
          execute: async (input, ctx) => {
            const p = (input ?? {}) as { problemId?: string };
            const problem = p.problemId ? await repos.problems.findById(p.problemId) : null;
            await repos.notifications.create({
              user_id: ctx.userId,
              source_type: "system",
              source_id: p.problemId ?? null,
              title: "Problem solved",
              body: problem ? `"${problem.title}" solved successfully.` : "A problem was solved.",
              category: null,
              due_at: null,
            });
            await eventBus.emit(ctx.userId, "notification.sent", { problemId: p.problemId });
            return { notified: true };
          },
        },
      ],
    },
    {
      id: "daily-plan-workflow",
      name: "Daily Plan Generation",
      description: "Generate daily plan",
      version: "1.0.0",
      trigger: { type: "event", eventType: "planner.plan_generated" },
      steps: [
        { id: "gather-priorities", name: "Gather Priorities", execute: async (_input: unknown, ctx) => { ctx.state.set("priorities", []); return { gathered: true }; } },
        { id: "check-rules", name: "Check Rules", execute: async (_input: unknown, ctx) => { ctx.state.set("rulesApplied", true); return { rulesChecked: true }; } },
        { id: "update-context", name: "Update Context", execute: async (_input: unknown, ctx) => {
          await eventBus.emit(ctx.userId, "context.updated", { source: "daily_plan" });
          return { contextUpdated: true };
        }},
      ],
    },
    {
      id: "intake-processed-workflow",
      name: "Cross-Domain Intake Automation",
      description: "Routes universal intake (Command Bar/Voice) to all subsystems simultaneously",
      version: "1.0.0",
      trigger: { type: "event", eventType: "intake.processed" },
      steps: [
        {
          id: "route-to-timeline",
          name: "Add to Timeline",
          execute: async (input: unknown, ctx) => {
            const p = input as any;
            await eventBus.emit(ctx.userId, "timeline.event_added", { text: p.text, projectId: p.projectId });
            return { completed: true };
          },
        },
        {
          id: "route-to-project",
          name: "Update Project Execution",
          execute: async (input: unknown, ctx) => {
            const p = input as any;
            if (p.type === "project_work" && p.projectId) {
              await eventBus.emit(ctx.userId, "project.time_logged", { projectId: p.projectId, minutes: 120 });
            }
            return { completed: true };
          },
        },
        {
          id: "route-to-planner",
          name: "Update Daily Planner",
          execute: async (input: unknown, ctx) => {
            const p = input as any;
            await eventBus.emit(ctx.userId, "planner.execution_logged", { text: p.text });
            return { completed: true };
          },
        },
        {
          id: "route-to-analytics",
          name: "Update Intelligence & Analytics",
          execute: async (input: unknown, ctx) => {
            const p = input as any;
            await eventBus.emit(ctx.userId, "analytics.focus_updated", { domain: p.domain });
            await eventBus.emit(ctx.userId, "coach.triggered", { context: "intake" });
            return { completed: true };
          },
        },
      ],
    },
    {
      id: "project-onboarding-workflow",
      name: "AI-First Project Onboarding",
      description: "Generates full project workspace from NLP input",
      version: "1.0.0",
      trigger: { type: "event", eventType: "project.onboarding_requested" },
      steps: [
        {
          id: "extract-entities",
          name: "Extract Project Entities via Intelligence Engine",
          execute: async (input: unknown, ctx) => {
            // Re-using the Intelligence Engine for AI inference
            await eventBus.emit(ctx.userId, "intelligence.extraction_requested", { text: (input as any).text });
            return { status: "extracting" };
          },
        },
        {
          id: "generate-milestones",
          name: "Generate Milestones & Planner Blocks",
          execute: async (input: unknown, ctx) => {
            await eventBus.emit(ctx.userId, "project.milestones_generated", {});
            await eventBus.emit(ctx.userId, "planner.blocks_allocated", {});
            return { status: "generated" };
          },
        },
        {
          id: "notify-timeline",
          name: "Notify Timeline & Memory",
          execute: async (input: unknown, ctx) => {
            await eventBus.emit(ctx.userId, "timeline.event_added", { text: "New workspace created" });
            await eventBus.emit(ctx.userId, "memory.graph_updated", {});
            return { status: "notified" };
          },
        }
      ]
    }
  ];
}
