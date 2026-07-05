import type { RuleDefinition } from "./types";

export const BUILT_IN_RULES: RuleDefinition[] = [
  {
    id: "invoice-overdue-warning",
    name: "Invoice Overdue Warning",
    description: "When an invoice is overdue > 7 days, trigger coach warning and increase priority",
    domain: "business",
    enabled: true,
    priority: 80,
    conditions: [
      { field: "data.overdueDays", operator: "gt", value: 7 },
      { field: "data.status", operator: "eq", value: "overdue" },
    ],
    actions: [
      { type: "coach_warning", params: { severity: "high", message: "Invoice overdue > 7 days" } },
      { type: "increase_priority", params: { amount: 20 } },
      { type: "create_reminder", params: { title: "Follow up on overdue invoice" } },
      { type: "add_timeline_event", params: { category: "business_alert" } },
    ],
  },
  {
    id: "missed-dsa-sessions",
    name: "Missed DSA Sessions",
    description: "When three DSA sessions are missed, reduce placement readiness and trigger coach",
    domain: "learning",
    enabled: true,
    priority: 75,
    conditions: [
      { field: "data.missedSessions", operator: "gte", value: 3 },
      { field: "data.domain", operator: "eq", value: "dsa" },
    ],
    actions: [
      { type: "reduce_readiness", params: { domain: "placement", amount: 5 } },
      { type: "coach_recommendation", params: { message: "You've missed 3 DSA sessions. Let's get back on track." } },
      { type: "adjust_planner", params: { adjustment: "reschedule_missed" } },
    ],
  },
  {
    id: "burnout-risk-detection",
    name: "Burnout Risk Detection",
    description: "When focus sessions exceed 4 hours daily for 5 consecutive days, flag burnout risk",
    domain: "execution",
    enabled: true,
    priority: 90,
    conditions: [
      { field: "data.consecutiveLongDays", operator: "gte", value: 5 },
      { field: "data.dailyFocusHours", operator: "gte", value: 4 },
    ],
    actions: [
      { type: "health_warning", params: { severity: "high", message: "Burnout risk detected — consider rest" } },
      { type: "reduce_workload", params: { amount: 30 } },
      { type: "suggest_break", params: { duration: "day" } },
    ],
  },
  {
    id: "academic-cgpa-drop",
    name: "Academic CGPA Drop Warning",
    description: "When projected CGPA drops below threshold, trigger academic intervention",
    domain: "academic",
    enabled: true,
    priority: 85,
    conditions: [
      { field: "data.projectedCgpa", operator: "lt", value: 7.0 },
    ],
    actions: [
      { type: "academic_warning", params: { severity: "high", message: "Projected CGPA below 7.0" } },
      { type: "increase_study_hours", params: { amount: 2 } },
      { type: "coach_recommendation", params: { message: "Focus on improving grades in weak subjects" } },
    ],
  },
  {
    id: "revision-neglect",
    name: "Revision Neglect Detection",
    description: "When revision queue has > 10 overdue items, flag for catch-up session",
    domain: "learning",
    enabled: true,
    priority: 70,
    conditions: [
      { field: "data.overdueCount", operator: "gt", value: 10 },
    ],
    actions: [
      { type: "create_catchup_session", params: { title: "Revision catch-up" } },
      { type: "adjust_planner", params: { adjustment: "prioritize_revision" } },
      { type: "coach_recommendation", params: { message: "Your revision queue is growing. Let's clear it." } },
    ],
  },
  {
    id: "goal-stagnation",
    name: "Goal Stagnation Alert",
    description: "When a goal has no progress for 14+ days, flag for review",
    domain: "execution",
    enabled: true,
    priority: 60,
    conditions: [
      { field: "data.daysSinceProgress", operator: "gte", value: 14 },
    ],
    actions: [
      { type: "goal_review_reminder", params: { message: "Goal has no recent progress" } },
      { type: "coach_recommendation", params: { message: "Review and recommit to your goal" } },
    ],
  },
];
