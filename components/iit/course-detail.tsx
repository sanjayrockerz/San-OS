"use client";

import { useActionState, useState } from "react";
import {
  BookOpen,
  Video,
  CheckCircle2,
  Plus,
  ExternalLink,
  Clock,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  completeAssignment,
  watchLecture,
  createAssignment,
  createLecture,
  type ActionResult,
} from "@/app/(app)/iit-workspace/actions";

interface AssignmentView {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  status: string;
  score: number | null;
  maxScore: number | null;
  submittedAt: string | null;
}

interface LectureView {
  id: string;
  title: string;
  lectureNumber: number | null;
  status: string;
  durationMinutes: number | null;
  videoUrl: string | null;
  watchedAt: string | null;
}

interface Props {
  courseId: string;
  assignments: AssignmentView[];
  lectures: LectureView[];
}

type Tab = "assignments" | "lectures";

function AssignmentRow({ a, courseId }: { a: AssignmentView; courseId: string }) {
  const isDone = a.status === "submitted" || a.status === "graded";
  const [, action, pending] = useActionState(completeAssignment, null);

  const dueDate = a.dueDate ? new Date(a.dueDate) : null;
  const isOverdue = dueDate && dueDate < new Date() && !isDone;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border p-3 transition-colors",
        isDone ? "border-success/30 bg-success/5" : "border-border hover:border-border-strong",
      )}
    >
      <form action={action} className="mt-0.5">
        <input type="hidden" name="assignmentId" value={a.id} />
        <input type="hidden" name="courseId" value={courseId} />
        <button
          type="submit"
          disabled={pending || isDone}
          className={cn(
            "flex size-5 items-center justify-center rounded-full border-2 transition-colors",
            isDone
              ? "border-success bg-success text-success-foreground"
              : "border-border hover:border-primary",
          )}
        >
          {isDone ? <CheckCircle2 className="size-3.5" /> : null}
        </button>
      </form>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium", isDone && "line-through text-muted-foreground")}>
          {a.title}
        </p>
        {a.description && (
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{a.description}</p>
        )}
        <div className="mt-1.5 flex items-center gap-2">
          {dueDate && (
            <span className={cn("text-[11px]", isOverdue ? "text-danger" : "text-muted-foreground")}>
              Due {dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              {isOverdue && " — Overdue"}
            </span>
          )}
          {a.score != null && a.maxScore != null && (
            <Badge variant="secondary" className="text-[10px]">
              {a.score}/{a.maxScore}
            </Badge>
          )}
        </div>
      </div>
      {!isDone && (
        <Badge variant="secondary" className="text-[10px] shrink-0">{a.status}</Badge>
      )}
    </div>
  );
}

function LectureRow({ l, courseId }: { l: LectureView; courseId: string }) {
  const isWatched = l.status === "completed";
  const [, action, pending] = useActionState(watchLecture, null);

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border p-3 transition-colors",
        isWatched ? "border-success/30 bg-success/5" : "border-border hover:border-border-strong",
      )}
    >
      <form action={action}>
        <input type="hidden" name="lectureId" value={l.id} />
        <input type="hidden" name="courseId" value={courseId} />
        <button
          type="submit"
          disabled={pending || isWatched}
          className={cn(
            "flex size-5 items-center justify-center rounded-full border-2 transition-colors",
            isWatched
              ? "border-success bg-success text-success-foreground"
              : "border-border hover:border-primary",
          )}
        >
          {isWatched ? <CheckCircle2 className="size-3.5" /> : null}
        </button>
      </form>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium", isWatched && "line-through text-muted-foreground")}>
          {l.lectureNumber ? `L${l.lectureNumber} — ` : ""}{l.title}
        </p>
        {l.durationMinutes && (
          <span className="flex items-center gap-1 mt-0.5 text-[11px] text-muted-foreground">
            <Clock className="size-3" /> {l.durationMinutes}m
          </span>
        )}
      </div>
      {l.videoUrl && (
        <a
          href={l.videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ExternalLink className="size-4" />
        </a>
      )}
    </div>
  );
}

export function CourseDetail({ courseId, assignments, lectures }: Props) {
  const [tab, setTab] = useState<Tab>("assignments");
  const [showAdd, setShowAdd] = useState(false);

  const [assignResult, assignAction, assignPending] = useActionState(
    async (_prev: ActionResult | null, formData: FormData) => {
      const res = await createAssignment(_prev, formData);
      if (res.ok) setShowAdd(false);
      return res;
    },
    null,
  );

  const [lectureResult, lectureAction, lecturePending] = useActionState(
    async (_prev: ActionResult | null, formData: FormData) => {
      const res = await createLecture(_prev, formData);
      if (res.ok) setShowAdd(false);
      return res;
    },
    null,
  );

  return (
    <div>
      {/* Tab bar */}
      <div className="mb-4 flex items-center gap-1">
        {(["assignments", "lectures"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setShowAdd(false); }}
            className={cn(
              "flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-colors",
              tab === t
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary",
            )}
          >
            {t === "assignments" ? <BookOpen className="size-3.5" /> : <Video className="size-3.5" />}
            {t.charAt(0).toUpperCase() + t.slice(1)}
            <span className="text-[11px] opacity-70">
              ({t === "assignments" ? assignments.length : lectures.length})
            </span>
          </button>
        ))}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="ml-auto"
          onClick={() => setShowAdd(!showAdd)}
        >
          <Plus className="size-3.5" />
          Add {tab === "assignments" ? "Assignment" : "Lecture"}
        </Button>
      </div>

      {/* Add form */}
      {showAdd && tab === "assignments" && (
        <form action={assignAction} className="mb-4 surface-card rounded-2xl p-4 space-y-3">
          <input type="hidden" name="course_id" value={courseId} />
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs">Title *</Label>
              <Input name="title" required placeholder="e.g. Assignment 1" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Due Date</Label>
              <Input name="due_date" type="date" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Max Score</Label>
              <Input name="max_score" type="number" min={0} placeholder="100" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs">Description</Label>
              <Textarea name="description" rows={2} placeholder="Optional details…" />
            </div>
          </div>
          {assignResult && !assignResult.ok && (
            <p className="text-xs text-danger">{assignResult.error}</p>
          )}
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={assignPending}>
              {assignPending ? "Adding…" : "Add Assignment"}
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {showAdd && tab === "lectures" && (
        <form action={lectureAction} className="mb-4 surface-card rounded-2xl p-4 space-y-3">
          <input type="hidden" name="course_id" value={courseId} />
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs">Title *</Label>
              <Input name="title" required placeholder="e.g. Introduction to Trees" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Lecture #</Label>
              <Input name="lecture_number" type="number" min={1} placeholder="1" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Duration (mins)</Label>
              <Input name="duration_minutes" type="number" min={1} placeholder="60" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs">Video URL</Label>
              <Input name="video_url" type="url" placeholder="https://youtube.com/…" />
            </div>
          </div>
          {lectureResult && !lectureResult.ok && (
            <p className="text-xs text-danger">{lectureResult.error}</p>
          )}
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={lecturePending}>
              {lecturePending ? "Adding…" : "Add Lecture"}
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* List */}
      {tab === "assignments" && (
        <div className="space-y-2">
          {assignments.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No assignments yet.</p>
          ) : (
            assignments.map((a) => (
              <AssignmentRow key={a.id} a={a} courseId={courseId} />
            ))
          )}
        </div>
      )}

      {tab === "lectures" && (
        <div className="space-y-2">
          {lectures.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No lectures yet.</p>
          ) : (
            lectures.map((l) => (
              <LectureRow key={l.id} l={l} courseId={courseId} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
