"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  GraduationCap,
  ArrowUpRight,
  AlertTriangle,
  CalendarCheck,
  Plus,
  BookOpen,
  Trophy,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { SectionHeading } from "@/components/layout/page-header";
import { createCourse, type ActionResult } from "@/app/(app)/iit-workspace/actions";
import type { CreditSummary } from "@/lib/services";
import { CATEGORY_TINT } from "@/lib/design/category";
import { IIT_STATUS_CATEGORY, HEALTH_CATEGORY_META, type IitStatus } from "@/lib/design/status";
import type { HealthCategory } from "@/lib/services/academic-health.service";

interface CourseView {
  id: string;
  code: string | null;
  name: string;
  credits: number | null;
  semester: string | null;
  status: string;
  instructor: string | null;
  grade: string | null;
  marks: number | null;
  maxMarks: number | null;
  totalAssignments: number;
  completedAssignments: number;
  totalLectures: number;
  watchedLectures: number;
  progress: number;
  nextDue: { title: string; due_date: string | null } | null;
  healthScore: number | null;
  healthCategory: HealthCategory | null;
}

interface DeadlineView {
  id: string;
  title: string;
  courseId: string | null;
  courseName: string;
  dueDate: string | null;
  urgent: boolean;
  daysUntil: number | null;
}

interface Props {
  courses: CourseView[];
  deadlines: DeadlineView[];
  credits: CreditSummary;
}

export function IITClient({ courses, deadlines, credits }: Props) {
  const [showAddCourse, setShowAddCourse] = useState(false);

  const [result, action, pending] = useActionState(
    async (_prev: ActionResult | null, formData: FormData) => {
      const res = await createCourse(_prev, formData);
      if (res.ok) setShowAddCourse(false);
      return res;
    },
    null,
  );

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      {/* Courses */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <SectionHeading title="Courses" />
          <Button size="sm" onClick={() => setShowAddCourse(!showAddCourse)}>
            <Plus className="size-3.5" /> Add Course
          </Button>
        </div>

        {/* Add Course Form */}
        {showAddCourse && (
          <form action={action} className="surface-card rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-semibold">New Course</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2">
                <Label htmlFor="name" className="text-xs">Course Name *</Label>
                <Input id="name" name="name" required placeholder="e.g. Mathematics I" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="code" className="text-xs">Course Code</Label>
                <Input id="code" name="code" placeholder="e.g. MA1101" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="credits" className="text-xs">Credits</Label>
                <Input id="credits" name="credits" type="number" min={1} max={20} placeholder="4" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="semester" className="text-xs">Semester</Label>
                <Input id="semester" name="semester" placeholder="Sem 1, Jan 2025" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="instructor" className="text-xs">Instructor</Label>
                <Input id="instructor" name="instructor" placeholder="Prof. Name" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Status</Label>
                <Select name="status" defaultValue="in_progress">
                  <option value="in_progress">In Progress</option>
                  <option value="planned">Planned</option>
                  <option value="completed">Completed</option>
                  <option value="dropped">Dropped</option>
                </Select>
              </div>
            </div>
            {result && !result.ok && (
              <p className="text-xs text-danger">{result.error}</p>
            )}
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={pending}>
                {pending ? "Saving…" : "Add Course"}
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={() => setShowAddCourse(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {courses.length === 0 && !showAddCourse ? (
          <div className="surface-card rounded-2xl p-10 text-center">
            <GraduationCap className="mx-auto mb-3 size-10 text-muted-foreground opacity-40" />
            <p className="text-sm text-muted-foreground">No courses yet. Add your first course.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {courses.map((c) => {
              const statusCategory = IIT_STATUS_CATEGORY[c.status as IitStatus] ?? "mission";
              return (
                <Link
                  key={c.id}
                  href={`/iit-workspace/${c.id}`}
                  className="surface-card group cursor-pointer rounded-2xl p-5 transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <span
                      className={cn(
                        "flex size-9 items-center justify-center rounded-xl",
                        CATEGORY_TINT[statusCategory],
                      )}
                    >
                      <GraduationCap className="size-5" />
                    </span>
                    <div className="flex items-center gap-2">
                      {c.healthCategory && (
                        <Badge variant={HEALTH_CATEGORY_META[c.healthCategory].badgeVariant} className="text-[10px]">
                          {HEALTH_CATEGORY_META[c.healthCategory].label}
                        </Badge>
                      )}
                      <ArrowUpRight className="size-4 text-muted-foreground transition-colors group-hover:text-foreground" />
                    </div>
                  </div>
                  {c.code && (
                    <p className="mt-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      {c.code}
                    </p>
                  )}
                  <h3 className="text-[15px] font-semibold tracking-tight">{c.name}</h3>

                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Lectures</span>
                    <span className="font-semibold tabular">
                      {c.watchedLectures}/{c.totalLectures}
                    </span>
                  </div>
                  <Progress value={c.progress} className="mt-1.5 h-1.5" />

                  <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BookOpen className="size-3" />
                      {c.completedAssignments}/{c.totalAssignments} done
                    </span>
                    {c.credits && (
                      <span className="ml-auto">{c.credits} credits</span>
                    )}
                  </div>

                  {c.nextDue && (
                    <div className="mt-3 rounded-lg border border-border bg-background-subtle/40 p-2.5">
                      <p className="text-[11px] text-muted-foreground">Next due</p>
                      <p className="truncate text-sm font-medium">{c.nextDue.title}</p>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}

        {/* Credit summary */}
        {(credits.totalCredits > 0) && (
          <div className="surface-card rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="size-4 text-warning" />
              <span className="text-sm font-semibold">Credit Summary</span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: "Total", value: credits.totalCredits, color: "text-foreground" },
                { label: "In Progress", value: credits.inProgressCredits, color: "text-primary" },
                { label: "Completed", value: credits.completedCredits, color: "text-success" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-border p-2">
                  <p className={cn("text-xl font-bold tabular", s.color)}>{s.value}</p>
                  <p className="text-[11px] text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Deadlines */}
      <div>
        <SectionHeading title="Upcoming Deadlines" />
        {deadlines.length === 0 ? (
          <div className="surface-card rounded-2xl p-6 text-center text-sm text-muted-foreground">
            No upcoming deadlines.
          </div>
        ) : (
          <div className="surface-card space-y-2.5 rounded-2xl p-4">
            {deadlines.map((d) => (
              <div
                key={d.id}
                className="flex items-center gap-3 rounded-xl border border-border p-3"
              >
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-lg",
                    d.urgent ? "bg-danger/12 text-danger" : "bg-muted text-muted-foreground",
                  )}
                >
                  {d.urgent ? (
                    <AlertTriangle className="size-4" />
                  ) : (
                    <CalendarCheck className="size-4" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{d.title}</p>
                  <p className="text-[11px] text-muted-foreground">{d.courseName}</p>
                </div>
                {d.dueDate && (
                  <Badge variant={d.urgent ? "danger" : "secondary"} className="text-[10px] shrink-0">
                    {d.urgent && d.daysUntil !== null && d.daysUntil <= 0
                      ? "Overdue"
                      : d.dueDate}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
