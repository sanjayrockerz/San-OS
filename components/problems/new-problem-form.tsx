"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Binary,
  Brain,
  Code2,
  ListChecks,
  NotebookPen,
  Save,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CodeEditor } from "@/components/editor/code-editor";
import { CheckboxField } from "@/components/ui/checkbox-field";
import { LANGUAGES, getTemplate } from "@/lib/code-templates";
import {
  createLearningEntry,
  type ActionResult,
} from "@/app/(app)/problems/actions";

interface Option {
  id: string;
  name: string;
}

const PLATFORMS: { value: string; label: string }[] = [
  { value: "leetcode", label: "LeetCode" },
  { value: "codeforces", label: "Codeforces" },
  { value: "codechef", label: "CodeChef" },
  { value: "geeksforgeeks", label: "GeeksforGeeks" },
  { value: "hackerrank", label: "HackerRank" },
  { value: "atcoder", label: "AtCoder" },
  { value: "interviewbit", label: "InterviewBit" },
  { value: "other", label: "Skillrack / Striver / Custom" },
];

const SOLVE_STATUS: { value: string; label: string }[] = [
  { value: "solved", label: "Solved independently" },
  { value: "solved_with_help", label: "Solved with help" },
  { value: "partial", label: "Partially solved" },
  { value: "unsolved", label: "Unsolved" },
  { value: "gave_up", label: "Gave up" },
];

const PIPELINE: { name: string; label: string; hint: string }[] = [
  {
    name: "understoodStatement",
    label: "Understood the statement",
    hint: "I fully grasped what was being asked.",
  },
  {
    name: "identifiedPattern",
    label: "Identified the pattern",
    hint: "I recognised the underlying technique.",
  },
  {
    name: "derivedAlgorithm",
    label: "Derived the algorithm",
    hint: "I worked out the approach myself.",
  },
  {
    name: "wrotePseudocode",
    label: "Wrote pseudocode",
    hint: "I could express it in plain steps first.",
  },
  {
    name: "codedIndependently",
    label: "Converted pseudocode to code",
    hint: "I implemented it without copying.",
  },
  {
    name: "syntaxError",
    label: "Faced syntax errors",
    hint: "I hit language/syntax issues.",
  },
  {
    name: "runtimeError",
    label: "Faced runtime errors",
    hint: "I hit runtime/edge-case failures.",
  },
  {
    name: "logicError",
    label: "Faced logic errors",
    hint: "My approach had a logical bug.",
  },
  {
    name: "comparedWithOptimal",
    label: "Compared with the optimal solution",
    hint: "I studied the editorial / optimal approach.",
  },
];

const STEPS = [
  { id: "metadata", label: "Metadata", icon: NotebookPen },
  { id: "pipeline", label: "Cognitive pipeline", icon: Brain },
  { id: "reflection", label: "Reflection", icon: ListChecks },
  { id: "code", label: "Code vault", icon: Code2 },
] as const;

export function NewProblemForm({
  topics,
  patterns,
}: {
  topics: Option[];
  patterns: Option[];
}) {
  const [step, setStep] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState<string>(LANGUAGES[0]);
  const [state, formAction, pending] = useActionState<
    ActionResult | null,
    FormData
  >(createLearningEntry, null);

  const isLast = step === STEPS.length - 1;

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/problems"
          className="flex size-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Add Learning Entry
          </h1>
          <p className="text-sm text-muted-foreground">
            Capture a DSA problem and your full thinking process.
          </p>
        </div>
      </div>

      {/* Stepper */}
      <ol className="mb-6 flex items-center gap-2 overflow-x-auto pb-1">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const done = i < step;
          const current = i === step;
          return (
            <li key={s.id} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStep(i)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  current
                    ? "bg-primary text-primary-foreground"
                    : done
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent",
                )}
              >
                <Icon className="size-4" />
                <span className="hidden sm:inline">{s.label}</span>
                <span className="sm:hidden">{i + 1}</span>
              </button>
              {i < STEPS.length - 1 && (
                <span className="h-px w-3 bg-border sm:w-5" />
              )}
            </li>
          );
        })}
      </ol>

      <form action={formAction}>
        {/* ---- Step 1: Metadata ---- */}
        <section className={cn(step === 0 ? "block" : "hidden")}>
          <FormCard
            title="Problem metadata"
            description="Where the problem is from and how it went."
          >
            <Field label="Problem title" htmlFor="title" required>
              <Input
                id="title"
                name="title"
                required
                placeholder="e.g. Two Sum"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Platform" htmlFor="platform">
                <Select id="platform" name="platform" defaultValue="leetcode">
                  {PLATFORMS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Difficulty" htmlFor="difficulty">
                <Select id="difficulty" name="difficulty" defaultValue="">
                  <option value="">—</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </Select>
              </Field>
            </div>

            <Field label="URL" htmlFor="url">
              <Input
                id="url"
                name="url"
                type="url"
                placeholder="https://leetcode.com/problems/two-sum"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Topic" htmlFor="topic_id">
                <Select id="topic_id" name="topic_id" defaultValue="">
                  <option value="">—</option>
                  {topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Pattern" htmlFor="pattern_id">
                <Select id="pattern_id" name="pattern_id" defaultValue="">
                  <option value="">—</option>
                  {patterns.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Language" htmlFor="language">
                <Select
                  id="language"
                  name="language"
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                >
                  {LANGUAGES.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Time taken (min)" htmlFor="timeTakenMinutes">
                <Input
                  id="timeTakenMinutes"
                  name="timeTakenMinutes"
                  type="number"
                  min={0}
                  placeholder="25"
                />
              </Field>
              <Field label="Confidence (1–5)" htmlFor="confidence">
                <Select id="confidence" name="confidence" defaultValue="3">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <Field label="Solve status" htmlFor="solveStatus">
              <Select id="solveStatus" name="solveStatus" defaultValue="solved">
                {SOLVE_STATUS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </Field>
          </FormCard>
        </section>

        {/* ---- Step 2: Cognitive pipeline ---- */}
        <section className={cn(step === 1 ? "block" : "hidden")}>
          <FormCard
            title="Cognitive pipeline"
            description="Tick each stage you reached. This feeds your analytics and the AI mentor."
          >
            <div className="grid gap-2 sm:grid-cols-2">
              {PIPELINE.map((p) => (
                <CheckboxField
                  key={p.name}
                  name={p.name}
                  label={p.label}
                  hint={p.hint}
                />
              ))}
            </div>
          </FormCard>
        </section>

        {/* ---- Step 3: Reflection ---- */}
        <section className={cn(step === 2 ? "block" : "hidden")}>
          <FormCard
            title="Reflection workspace"
            description="Your own words matter more than the editorial."
          >
            <Field label="Algorithm in my own words" htmlFor="algorithmInWords">
              <Textarea
                id="algorithmInWords"
                name="algorithmInWords"
                rows={4}
                placeholder="Describe the approach as you'd explain it to a friend…"
              />
            </Field>
            <Field label="My explanation" htmlFor="myExplanation">
              <Textarea
                id="myExplanation"
                name="myExplanation"
                rows={4}
                placeholder="Deeper notes, intuition, complexity analysis (markdown ok)…"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Bug that stopped me" htmlFor="bugThatStoppedMe">
                <Textarea
                  id="bugThatStoppedMe"
                  name="bugThatStoppedMe"
                  rows={3}
                  placeholder="The main blocker…"
                />
              </Field>
              <Field label="Final takeaway" htmlFor="finalTakeaway">
                <Textarea
                  id="finalTakeaway"
                  name="finalTakeaway"
                  rows={3}
                  placeholder="One or two lines you never want to forget…"
                />
              </Field>
            </div>
          </FormCard>
        </section>

        {/* ---- Step 4: Code vault ---- */}
        <section className={cn(step === 3 ? "block" : "hidden")}>
          <FormCard
            title="Code vault"
            description="Save your solution. You can add more versions later."
          >
            <Field label="Code language" htmlFor="codeLanguage">
              <Select
                id="codeLanguage"
                name="codeLanguage"
                required
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
              >
                {LANGUAGES.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Solution code" htmlFor="code">
              <CodeEditor
                name="code"
                language={selectedLanguage}
                defaultValue={getTemplate(selectedLanguage)}
                height="300px"
              />
            </Field>
          </FormCard>
        </section>

        {/* Error */}
        {state && !state.ok && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            <Binary className="size-4 shrink-0" />
            {state.error}
          </div>
        )}

        {/* Footer nav */}
        <div className="mt-6 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0 || pending}
          >
            <ArrowLeft className="size-4" /> Back
          </Button>

          {isLast ? (
            <Button type="submit" disabled={pending}>
              <Save className="size-4" />
              {pending ? "Saving…" : "Save & run engine"}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
            >
              Next <ArrowRight className="size-4" />
            </Button>
          )}
        </div>

        <p className="mt-3 text-center text-xs text-muted-foreground">
          Saving creates the problem, records your attempt &amp; reflection,
          stores code, schedules revision, logs activity and updates your
          dashboard — automatically.
        </p>
      </form>
    </div>
  );
}

function FormCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="surface-card rounded-2xl p-5 sm:p-6">
      <div className="mb-5">
        <h2 className="text-base font-semibold">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="ml-0.5 text-danger">*</span>}
      </Label>
      {children}
    </div>
  );
}
