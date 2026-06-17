import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  Brain,
  Code2,
  ListChecks,
  Lightbulb,
  RefreshCw,
  Activity as ActivityIcon,
  Target,
  Layers,
  Check,
  X,
} from "lucide-react";

import { requireContext } from "@/lib/server/context";
import { Badge } from "@/components/ui/badge";
import { CodeBlock } from "@/components/problems/code-block";
import { PostSolvePanel } from "@/components/problems/post-solve-panel";
import { cn } from "@/lib/utils";
import type { Tables } from "@/types/database";

async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch {
    return fallback;
  }
}

const DIFFICULTY_VARIANT = {
  easy: "success",
  medium: "warning",
  hard: "danger",
} as const;

const STATUS_LABEL: Record<string, string> = {
  solved: "Solved",
  solved_with_help: "Solved with help",
  partial: "Partial",
  unsolved: "Unsolved",
  gave_up: "Gave up",
};

const REVISION_LABEL: Record<string, string> = {
  new: "New",
  learning: "Learning",
  reviewing: "Reviewing",
  mastered: "Mastered",
  struggling: "Struggling",
};

const PIPELINE_STAGES: { key: keyof Tables<"problem_attempts">; label: string }[] =
  [
    { key: "understood_statement", label: "Understood statement" },
    { key: "identified_pattern", label: "Identified pattern" },
    { key: "derived_algorithm", label: "Derived algorithm" },
    { key: "wrote_pseudocode", label: "Wrote pseudocode" },
    { key: "coded_independently", label: "Coded independently" },
  ];

const ERROR_FLAGS: { key: keyof Tables<"problem_attempts">; label: string }[] = [
  { key: "syntax_error", label: "Syntax errors" },
  { key: "runtime_error", label: "Runtime errors" },
  { key: "logic_error", label: "Logic errors" },
];

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function fmtMinutes(seconds: number | null): string {
  if (seconds == null) return "—";
  const m = Math.round(seconds / 60);
  return `${m} min`;
}

export default async function ProblemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, services } = await requireContext(`/problems/${id}`);

  const problem = await safe(services.repos.problems.findById(id), null);
  if (!problem) notFound();

  const [attempts, reflections, codeVersions, revision, topic, pattern] =
    await Promise.all([
      safe(services.repos.attempts.findByProblem(user.id, id), []),
      safe(services.repos.reflections.findByProblem(user.id, id), []),
      safe(services.repos.codeVersions.findByProblem(user.id, id), []),
      safe(services.repos.revision.findByProblem(user.id, id), null),
      problem.topic_id
        ? safe(services.repos.topics.findById(problem.topic_id), null)
        : Promise.resolve(null),
      problem.pattern_id
        ? safe(services.repos.patterns.findById(problem.pattern_id), null)
        : Promise.resolve(null),
    ]);

  // Resilient reads from Phase-4 tables (may be empty before migrations apply).
  const allActivity = await safe(
    services.repos.activity.recent(user.id, 100),
    [],
  );
  const activity = allActivity.filter((a) => a.entity_id === id).slice(0, 8);
  const roadmapNodes = await safe(
    services.repos.roadmapItems.findByProblem(id),
    [],
  );

  // Knowledge-graph neighbourhood: problems/concepts sharing a topic, pattern or
  // concept link. Resilient — empty until there are enough entities to relate.
  const related = await safe(
    services.knowledgeGraph.getRelatedKnowledge(user.id, id),
    { problems: [], concepts: [], patterns: [], topics: [] },
  );
  const hasRelated =
    related.problems.length > 0 || related.concepts.length > 0;

  const latest = attempts[0] ?? null;
  const reflection = reflections[0] ?? null;

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start gap-3">
        <Link
          href="/problems"
          className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">
              {problem.title}
            </h1>
            {problem.difficulty && (
              <Badge variant={DIFFICULTY_VARIANT[problem.difficulty]}>
                {problem.difficulty}
              </Badge>
            )}
            {latest?.solve_status && (
              <Badge variant="default">
                {STATUS_LABEL[latest.solve_status]}
              </Badge>
            )}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span className="capitalize">{problem.platform}</span>
            {topic && <span>· {topic.name}</span>}
            {pattern && <span>· {pattern.name}</span>}
            {problem.url && (
              <a
                href={problem.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                Open problem <ExternalLink className="size-3" />
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main workspace */}
        <div className="space-y-6 lg:col-span-2">
          {/* Metadata strip */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Confidence" value={latest?.confidence ? `${latest.confidence}/5` : "—"} />
            <Stat label="Time taken" value={fmtMinutes(latest?.time_taken_seconds ?? null)} />
            <Stat label="Language" value={latest?.language ?? "—"} />
            <Stat label="Attempts" value={String(attempts.length)} />
          </div>

          {/* Algorithm */}
          <Panel icon={Brain} title="Algorithm in own words">
            {reflection?.algorithm_in_words ? (
              <Prose text={reflection.algorithm_in_words} />
            ) : (
              <Empty text="No algorithm written yet." />
            )}
          </Panel>

          {/* Explanation */}
          <Panel icon={Lightbulb} title="My explanation">
            {reflection?.my_explanation ? (
              <Prose text={reflection.my_explanation} />
            ) : (
              <Empty text="No explanation captured." />
            )}
          </Panel>

          {/* Cognitive pipeline */}
          <Panel icon={ListChecks} title="Cognitive pipeline">
            {latest ? (
              <div className="space-y-4">
                <div className="grid gap-2 sm:grid-cols-2">
                  {PIPELINE_STAGES.map((s) => (
                    <PipelineRow
                      key={s.key}
                      label={s.label}
                      done={Boolean(latest[s.key])}
                    />
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                  {ERROR_FLAGS.filter((f) => latest[f.key]).map((f) => (
                    <Badge key={f.key} variant="danger">
                      {f.label}
                    </Badge>
                  ))}
                  {ERROR_FLAGS.every((f) => !latest[f.key]) && (
                    <span className="text-xs text-muted-foreground">
                      No errors flagged — clean run.
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <Empty text="No attempt recorded." />
            )}
          </Panel>

          {/* Code versions */}
          <Panel icon={Code2} title={`Code vault (${codeVersions.length})`}>
            {codeVersions.length > 0 ? (
              <div className="space-y-4">
                {codeVersions.map((cv) => (
                  <div key={cv.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{fmtDate(cv.created_at)}</span>
                      {cv.is_final && <Badge variant="success">Final</Badge>}
                    </div>
                    <CodeBlock code={cv.code} language={cv.language} />
                  </div>
                ))}
              </div>
            ) : (
              <Empty text="No code saved yet." />
            )}
          </Panel>

          {/* Reflection extras */}
          {(reflection?.bug_that_stopped_me || reflection?.final_takeaway) && (
            <Panel icon={Target} title="Takeaways">
              <div className="space-y-3">
                {reflection?.bug_that_stopped_me && (
                  <LabeledBlock label="Bug that stopped me" tone="danger">
                    {reflection.bug_that_stopped_me}
                  </LabeledBlock>
                )}
                {reflection?.final_takeaway && (
                  <LabeledBlock label="Final takeaway" tone="primary">
                    {reflection.final_takeaway}
                  </LabeledBlock>
                )}
              </div>
            </Panel>
          )}

          {/* Activity history */}
          <Panel icon={ActivityIcon} title="Activity history">
            {activity.length > 0 ? (
              <ul className="space-y-2">
                {activity.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="text-foreground">
                      {a.title ?? a.type}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {fmtDate(a.occurred_at)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty text="No activity yet." />
            )}
          </Panel>
        </div>

        {/* Right context panel */}
        <aside className="space-y-6">
          {/* Revision status */}
          <SideCard icon={RefreshCw} title="Revision">
            {revision ? (
              <div className="space-y-2 text-sm">
                <Row label="State">
                  <Badge variant="default">
                    {REVISION_LABEL[revision.current_state]}
                  </Badge>
                </Row>
                <Row label="Next revision">{fmtDate(revision.next_revision)}</Row>
                <Row label="Last revised">{fmtDate(revision.last_revision)}</Row>
                <Row label="Successes">{String(revision.success_count)}</Row>
                <Row label="Editorial dep.">
                  {revision.editorial_dependency ? "Yes" : "No"}
                </Row>
              </div>
            ) : (
              <Empty text="Not scheduled yet." />
            )}
          </SideCard>

          {/* Pattern summary */}
          {pattern && (
            <SideCard icon={Layers} title="Pattern">
              <p className="text-sm font-medium text-foreground">
                {pattern.name}
              </p>
              {pattern.description && (
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {pattern.description}
                </p>
              )}
              {pattern.recognition_clues.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {pattern.recognition_clues.slice(0, 4).map((clue, i) => (
                    <li
                      key={i}
                      className="flex gap-2 text-xs text-muted-foreground"
                    >
                      <span className="text-primary">•</span> {clue}
                    </li>
                  ))}
                </ul>
              )}
            </SideCard>
          )}

          {/* Roadmap nodes */}
          {roadmapNodes.length > 0 && (
            <SideCard icon={Target} title="Roadmap nodes">
              <ul className="space-y-1.5">
                {roadmapNodes.map((n) => (
                  <li key={n.id} className="text-xs text-muted-foreground">
                    {n.title}
                  </li>
                ))}
              </ul>
            </SideCard>
          )}

          {/* Related (knowledge graph) */}
          {hasRelated && (
            <SideCard icon={Layers} title="Related">
              {related.problems.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Problems
                  </p>
                  <ul className="space-y-1">
                    {related.problems.map((p) => (
                      <li key={p.id}>
                        <Link
                          href={`/problems/${p.id}`}
                          className="text-xs text-primary hover:underline"
                        >
                          {p.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {related.concepts.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Concepts
                  </p>
                  <ul className="space-y-1">
                    {related.concepts.map((c) => (
                      <li key={c.id}>
                        <Link
                          href={`/concepts/${c.id}`}
                          className="text-xs text-primary hover:underline"
                        >
                          {c.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </SideCard>
          )}
        </aside>
      </div>

      {/* Post-solve workflow suggestions — shown when the problem has been solved */}
      {latest?.solve_status &&
        ["solved", "solved_with_help"].includes(latest.solve_status) && (
          <PostSolvePanel
            problemId={id}
            problemTitle={problem.title}
            inRevision={Boolean(revision)}
          />
        )}
    </div>
  );
}

/* ---------- presentational helpers (server components) ---------- */

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface-card rounded-xl p-3">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-lg font-semibold">{value}</p>
    </div>
  );
}

function Panel({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="surface-card rounded-2xl p-5">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <Icon className="size-4 text-primary" />
        {title}
      </h2>
      {children}
    </section>
  );
}

function SideCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="surface-card rounded-2xl p-4">
      <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="size-3.5" />
        {title}
      </h3>
      {children}
    </section>
  );
}

function Prose({ text }: { text: string }) {
  return (
    <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
      {text}
    </p>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm text-muted-foreground">{text}</p>;
}

function PipelineRow({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span
        className={cn(
          "flex size-5 items-center justify-center rounded-full",
          done
            ? "bg-success/15 text-success"
            : "bg-muted text-muted-foreground",
        )}
      >
        {done ? <Check className="size-3.5" /> : <X className="size-3.5" />}
      </span>
      <span className={done ? "text-foreground" : "text-muted-foreground"}>
        {label}
      </span>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{children}</span>
    </div>
  );
}

function LabeledBlock({
  label,
  tone,
  children,
}: {
  label: string;
  tone: "danger" | "primary";
  children: React.ReactNode;
}) {
  return (
    <div>
      <p
        className={cn(
          "mb-1 text-[11px] font-semibold uppercase tracking-wider",
          tone === "danger" ? "text-danger" : "text-primary",
        )}
      >
        {label}
      </p>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
        {children}
      </p>
    </div>
  );
}
