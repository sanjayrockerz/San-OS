"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  Plus,
  X,
  Check,
  ExternalLink,
  CircleDot,
  Loader2,
  ArrowRight,
  Pencil,
} from "lucide-react";

import { PageTransition, Section } from "@/components/layout/page-transition";
import { PageHeader } from "@/components/layout/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Tables } from "@/types/database";
import {
  createProblem,
  markSolved,
  updateProblem,
  type ActionResult,
} from "@/app/(app)/problems/actions";
import { DIFFICULTY_BADGE_VARIANT, type Difficulty } from "@/lib/design/status";

type Problem = Tables<"problems">;
type NamedRef = { id: string; name: string };

const DIFFICULTY_FILTERS = ["All", "easy", "medium", "hard"] as const;

export function ProblemsClient({
  problems,
  topics,
  patterns,
}: {
  problems: Problem[];
  topics: NamedRef[];
  patterns: NamedRef[];
}) {
  const [query, setQuery] = useState("");
  const [active, setActive] =
    useState<(typeof DIFFICULTY_FILTERS)[number]>("All");
  const [adding, setAdding] = useState(false);

  const topicName = useMemo(
    () => new Map(topics.map((t) => [t.id, t.name])),
    [topics],
  );
  const patternName = useMemo(
    () => new Map(patterns.map((p) => [p.id, p.name])),
    [patterns],
  );

  const filtered = problems.filter((p) => {
    const matchesQuery = p.title.toLowerCase().includes(query.toLowerCase());
    const matchesDifficulty = active === "All" || p.difficulty === active;
    return matchesQuery && matchesDifficulty;
  });

  return (
    <PageTransition>
      <PageHeader
        title="Problems"
        description="Your solved set — algorithms, notes and revision history in one place."
        actions={
          <Button onClick={() => setAdding((a) => !a)}>
            {adding ? <X className="size-4" /> : <Plus className="size-4" />}
            {adding ? "Cancel" : "Add Problem"}
          </Button>
        }
      />

      <AnimatePresence initial={false}>
        {adding && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <AddProblemForm
              topics={topics}
              patterns={patterns}
              onDone={() => setAdding(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search + difficulty filter */}
      <Section className="mb-4 mt-2 flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search problems…"
            className="h-11 pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </Section>

      <Section className="mb-6 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {DIFFICULTY_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setActive(f)}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium capitalize transition-colors",
              active === f
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {f}
          </button>
        ))}
      </Section>

      {filtered.length === 0 ? (
        <Section>
          <div className="surface-card flex flex-col items-center justify-center rounded-2xl px-6 py-16 text-center">
            <CircleDot className="size-8 text-muted-foreground/50" />
            <p className="mt-3 text-sm font-medium">No problems yet</p>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground">
              {problems.length === 0
                ? "Add your first problem to start building your solved set."
                : "No problems match your search or filter."}
            </p>
          </div>
        </Section>
      ) : (
        <Section className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {filtered.map((p) => (
            <ProblemRow
              key={p.id}
              problem={p}
              topics={topics}
              patterns={patterns}
              topicName={p.topic_id ? topicName.get(p.topic_id) : undefined}
              patternName={
                p.pattern_id ? patternName.get(p.pattern_id) : undefined
              }
            />
          ))}
        </Section>
      )}
    </PageTransition>
  );
}

function ProblemRow({
  problem,
  topics,
  patterns,
  topicName,
  patternName,
}: {
  problem: Problem;
  topics: NamedRef[];
  patterns: NamedRef[];
  topicName?: string;
  patternName?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [solved, setSolved] = useState(false);
  const [editing, setEditing] = useState(false);

  function handleSolve() {
    startTransition(async () => {
      const res = await markSolved(problem.id);
      if (res.ok) setSolved(true);
    });
  }

  if (editing) {
    return (
      <EditProblemForm
        problem={problem}
        topics={topics}
        patterns={patterns}
        onDone={() => setEditing(false)}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="surface-card group flex flex-col justify-between rounded-2xl p-4 transition-all hover:shadow-md sm:flex-row sm:items-center sm:gap-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Link
            href={`/problems/${problem.id}`}
            className="flex min-w-0 items-center gap-1.5"
          >
            <h3 className="truncate text-[15px] font-semibold tracking-tight transition-colors group-hover:text-primary">
              {problem.title}
            </h3>
            <ArrowRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
          </Link>
          {problem.url && (
            <a
              href={problem.url}
              target="_blank"
              rel="noreferrer"
              className="ml-1 text-muted-foreground/60 transition-colors hover:text-foreground"
            >
              <ExternalLink className="size-3.5" />
            </a>
          )}
          {problem.user_id && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-muted-foreground/60 transition-colors hover:text-foreground"
              aria-label="Edit problem"
            >
              <Pencil className="size-3.5" />
            </button>
          )}
        </div>
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          {problem.difficulty && (
            <Badge variant={DIFFICULTY_BADGE_VARIANT[problem.difficulty as Difficulty]} className="capitalize px-2 py-0.5 text-[11px]">
              {problem.difficulty}
            </Badge>
          )}
          <Badge variant="secondary" className="capitalize px-2 py-0.5 text-[11px] bg-secondary/50">
            {problem.platform}
          </Badge>
          {patternName && <Badge variant="outline" className="px-2 py-0.5 text-[11px] font-normal">{patternName}</Badge>}
          {topicName && (
            <span className="text-[11px] font-medium text-muted-foreground border-l border-border pl-2">
              {topicName}
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 flex shrink-0 items-center justify-between sm:mt-0 sm:flex-col sm:items-end sm:gap-1.5">
        <Button
          size="sm"
          variant={solved ? "success" : "secondary"}
          onClick={handleSolve}
          disabled={pending || solved}
          className={cn("h-8 px-3 text-xs font-medium", !solved && "bg-secondary/40 hover:bg-secondary")}
        >
          {pending ? (
            <Loader2 className="mr-1.5 size-3.5 animate-spin" />
          ) : (
            <Check className={cn("mr-1.5 size-3.5", solved ? "opacity-100" : "opacity-50")} />
          )}
          {solved ? "Solved" : "Mark solved"}
        </Button>
        {solved && (
          <button
            type="button"
            onClick={() => setSolved(false)}
            className="text-[10px] font-medium text-muted-foreground hover:text-foreground hover:underline"
          >
            Undo completion
          </button>
        )}
      </div>
    </div>
  );
}

function EditProblemForm({
  problem,
  topics,
  patterns,
  onDone,
  onCancel,
}: {
  problem: Problem;
  topics: NamedRef[];
  patterns: NamedRef[];
  onDone: () => void;
  onCancel: () => void;
}) {
  const boundUpdate = updateProblem.bind(null, problem.id);
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    boundUpdate,
    null,
  );

  useEffect(() => {
    if (state?.ok) onDone();
  }, [state, onDone]);

  return (
    <form
      action={formAction}
      className="surface-card grid grid-cols-1 gap-3 rounded-2xl p-5 sm:grid-cols-2"
    >
      <div className="sm:col-span-2">
        <FieldLabel>Title</FieldLabel>
        <Input name="title" required defaultValue={problem.title} className="h-10" />
      </div>

      <div className="sm:col-span-2">
        <FieldLabel>URL</FieldLabel>
        <Input
          name="url"
          type="url"
          defaultValue={problem.url ?? ""}
          placeholder="https://leetcode.com/problems/two-sum"
          className="h-10"
        />
      </div>

      <div>
        <FieldLabel>Platform</FieldLabel>
        <Select name="platform" defaultValue={problem.platform}>
          {[
            "leetcode",
            "codeforces",
            "hackerrank",
            "codechef",
            "geeksforgeeks",
            "atcoder",
            "interviewbit",
            "other",
          ].map((p) => (
            <option key={p} value={p} className="capitalize">
              {p}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <FieldLabel>Difficulty</FieldLabel>
        <Select name="difficulty" defaultValue={problem.difficulty ?? ""}>
          <option value="">—</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </Select>
      </div>

      <div>
        <FieldLabel>Topic</FieldLabel>
        <Select name="topic_id" defaultValue={problem.topic_id ?? ""}>
          <option value="">—</option>
          {topics.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <FieldLabel>Pattern</FieldLabel>
        <Select name="pattern_id" defaultValue={problem.pattern_id ?? ""}>
          <option value="">—</option>
          {patterns.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex items-center gap-3 sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
          Save changes
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
        {state && !state.ok && (
          <span className="text-xs text-danger">{state.error}</span>
        )}
      </div>
    </form>
  );
}

function AddProblemForm({
  topics,
  patterns,
  onDone,
}: {
  topics: NamedRef[];
  patterns: NamedRef[];
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    createProblem,
    null,
  );

  useEffect(() => {
    if (state?.ok) onDone();
  }, [state, onDone]);

  return (
    <form
      action={formAction}
      className="surface-card mb-2 grid grid-cols-1 gap-3 rounded-2xl p-5 sm:grid-cols-2"
    >
      <div className="sm:col-span-2">
        <FieldLabel>Title</FieldLabel>
        <Input name="title" required placeholder="e.g. Two Sum" className="h-10" />
      </div>

      <div className="sm:col-span-2">
        <FieldLabel>URL</FieldLabel>
        <Input
          name="url"
          type="url"
          placeholder="https://leetcode.com/problems/two-sum"
          className="h-10"
        />
      </div>

      <div>
        <FieldLabel>Platform</FieldLabel>
        <Select name="platform" defaultValue="leetcode">
          {[
            "leetcode",
            "codeforces",
            "hackerrank",
            "codechef",
            "geeksforgeeks",
            "atcoder",
            "interviewbit",
            "other",
          ].map((p) => (
            <option key={p} value={p} className="capitalize">
              {p}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <FieldLabel>Difficulty</FieldLabel>
        <Select name="difficulty" defaultValue="">
          <option value="">—</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </Select>
      </div>

      <div>
        <FieldLabel>Topic</FieldLabel>
        <Select name="topic_id" defaultValue="">
          <option value="">—</option>
          {topics.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <FieldLabel>Pattern</FieldLabel>
        <Select name="pattern_id" defaultValue="">
          <option value="">—</option>
          {patterns.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex items-center gap-3 sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          Save problem
        </Button>
        {state && !state.ok && (
          <span className="text-xs text-danger">{state.error}</span>
        )}
      </div>
    </form>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
      {children}
    </label>
  );
}

function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-10 w-full rounded-lg border border-input bg-card px-3 text-sm capitalize outline-none transition-colors focus-visible:ring-focus",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
