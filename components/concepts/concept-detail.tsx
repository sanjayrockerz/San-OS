"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Brain,
  CheckCircle2,
  ExternalLink,
  Link2,
  Plus,
  Save,
  Trash2,
  Video,
  FileText,
  Image,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  markConceptStatus,
  addConceptResource,
  deleteConcept,
  linkConceptProblem,
  type ActionResult,
} from "@/app/(app)/concepts/actions";

const STATUS_COLOR: Record<string, string> = {
  learning: "#fbbf24",
  understood: "#60a5fa",
  weak: "#f87171",
  forgotten: "#a78bfa",
  mastered: "#34d399",
};

const STATUS_OPTIONS = ["learning", "understood", "weak", "forgotten", "mastered"] as const;

const RESOURCE_ICON: Record<string, React.ElementType> = {
  youtube: Video,
  article: ExternalLink,
  pdf: FileText,
  screenshot: Image,
  image: Image,
  link: Link2,
};

export interface ConceptView {
  id: string;
  title: string;
  category: string | null;
  status: string;
  confidence: number | null;
  personalExplanation: string | null;
  recognitionClues: string[];
  whenToUse: string | null;
  commonMistakes: string[];
  topicId: string | null;
  patternId: string | null;
  topicName: string | null;
  patternName: string | null;
  updatedAt: string;
}

export interface ResourceView {
  id: string;
  type: string;
  title: string | null;
  url: string | null;
}

export interface LinkedProblem {
  id: string;
  title: string;
  difficulty: string | null;
}

export interface RelatedKnowledgeItem {
  id: string;
  type: string;
  title: string;
  url: string | null;
}

interface Props {
  concept: ConceptView;
  resources: ResourceView[];
  linkedProblems: LinkedProblem[];
  relatedKnowledge: RelatedKnowledgeItem[];
  allProblems: { id: string; title: string }[];
}

const DIFFICULTY_VARIANT: Record<string, "success" | "warning" | "danger" | "secondary"> = {
  easy: "success",
  medium: "warning",
  hard: "danger",
};

export function ConceptDetail({
  concept,
  resources,
  linkedProblems,
  relatedKnowledge,
  allProblems,
}: Props) {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState(concept.status);
  const [confidence, setConfidence] = useState(concept.confidence?.toString() ?? "");
  const [showAddResource, setShowAddResource] = useState(false);
  const [showLinkProblem, setShowLinkProblem] = useState(false);
  const [selectedProblemId, setSelectedProblemId] = useState("");

  const [statusResult, statusAction, statusPending] = useActionState(
    markConceptStatus,
    null,
  );

  const [resourceResult, resourceAction, resourcePending] = useActionState(
    addConceptResource,
    null,
  );

  const [, deleteAction, deletePending] = useActionState(
    async (_prev: ActionResult | null, formData: FormData) => {
      const res = await deleteConcept(_prev, formData);
      if (res.ok) router.push("/concepts");
      return res;
    },
    null,
  );

  const [linkResult, linkAction, linkPending] = useActionState(
    linkConceptProblem,
    null,
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      {/* Top bar */}
      <div className="mb-6 flex items-start gap-4">
        <Link
          href="/concepts"
          className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold tracking-tight">{concept.title}</h1>
            {concept.category && (
              <span className="text-sm text-muted-foreground">· {concept.category}</span>
            )}
          </div>
          <div className="mt-1.5 flex items-center gap-2 flex-wrap">
            {concept.topicName && <Badge variant="secondary">{concept.topicName}</Badge>}
            {concept.patternName && <Badge variant="secondary">{concept.patternName}</Badge>}
          </div>
        </div>
        <form action={deleteAction}>
          <input type="hidden" name="id" value={concept.id} />
          <Button
            type="submit"
            variant="secondary"
            size="sm"
            disabled={deletePending}
            className="text-danger hover:bg-danger/10 hover:border-danger/30"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </form>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* LEFT — main content */}
        <div className="space-y-5 lg:col-span-2">
          {/* Personal Explanation */}
          <div className="surface-card rounded-2xl p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Your Explanation
            </h2>
            {concept.personalExplanation ? (
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {concept.personalExplanation}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No personal explanation yet. Write it in your own words.
              </p>
            )}
          </div>

          {/* When to Use + Recognition Clues */}
          {(concept.whenToUse || concept.recognitionClues.length > 0) && (
            <div className="surface-card rounded-2xl p-5 space-y-4">
              {concept.whenToUse && (
                <div>
                  <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    When to Use
                  </h2>
                  <p className="text-sm leading-relaxed">{concept.whenToUse}</p>
                </div>
              )}
              {concept.recognitionClues.length > 0 && (
                <div>
                  <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Recognition Clues
                  </h2>
                  <ul className="space-y-1">
                    {concept.recognitionClues.map((clue, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="size-3.5 shrink-0 mt-0.5 text-success" />
                        {clue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Common Mistakes */}
          {concept.commonMistakes.length > 0 && (
            <div className="surface-card rounded-2xl p-5">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Common Mistakes
              </h2>
              <ul className="space-y-1">
                {concept.commonMistakes.map((m, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 size-3.5 shrink-0 text-danger">✕</span>
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Resources */}
          <div className="surface-card rounded-2xl p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Resources ({resources.length})
              </h2>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setShowAddResource(!showAddResource)}
              >
                <Plus className="size-3.5" /> Add
              </Button>
            </div>

            {showAddResource && (
              <form action={resourceAction} className="mb-4 space-y-3 rounded-xl border border-border p-4">
                <input type="hidden" name="concept_id" value={concept.id} />
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Type</Label>
                    <Select name="type" defaultValue="link">
                      <option value="youtube">YouTube</option>
                      <option value="article">Article</option>
                      <option value="pdf">PDF</option>
                      <option value="link">Link</option>
                      <option value="screenshot">Screenshot</option>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Title</Label>
                    <Input name="title" placeholder="Optional label" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">URL</Label>
                  <Input name="url" type="url" placeholder="https://…" />
                </div>
                {resourceResult && !resourceResult.ok && (
                  <p className="text-xs text-danger">{resourceResult.error}</p>
                )}
                <div className="flex gap-2">
                  <Button type="submit" size="sm" disabled={resourcePending}>
                    {resourcePending ? "Adding…" : "Add Resource"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowAddResource(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}

            {resources.length === 0 && !showAddResource ? (
              <p className="text-sm text-muted-foreground">No resources yet.</p>
            ) : (
              <ul className="space-y-2">
                {resources.map((r) => {
                  const Icon = RESOURCE_ICON[r.type] ?? Link2;
                  return (
                    <li key={r.id} className="flex items-center gap-3 rounded-lg border border-border p-2.5">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="size-3.5" />
                      </span>
                      <span className="flex-1 truncate text-sm">{r.title ?? r.url ?? r.type}</span>
                      {r.url && (
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <ExternalLink className="size-3.5" />
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Linked Problems */}
          <div className="surface-card rounded-2xl p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Linked Problems ({linkedProblems.length})
              </h2>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setShowLinkProblem(!showLinkProblem)}
              >
                <Plus className="size-3.5" /> Link
              </Button>
            </div>

            {showLinkProblem && (
              <form action={linkAction} className="mb-4 space-y-2 rounded-xl border border-border p-3">
                <input type="hidden" name="conceptId" value={concept.id} />
                <Label className="text-xs">Select Problem</Label>
                <Select
                  name="problemId"
                  value={selectedProblemId}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedProblemId(e.target.value)}
                >
                  <option value="">Pick a problem…</option>
                  {allProblems
                    .filter((p) => !linkedProblems.some((lp) => lp.id === p.id))
                    .map((p) => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                </Select>
                {linkResult && !linkResult.ok && (
                  <p className="text-xs text-danger">{linkResult.error}</p>
                )}
                <div className="flex gap-2">
                  <Button type="submit" size="sm" disabled={linkPending || !selectedProblemId}>
                    {linkPending ? "Linking…" : "Link"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowLinkProblem(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}

            {linkedProblems.length === 0 && !showLinkProblem ? (
              <p className="text-sm text-muted-foreground">No problems linked yet.</p>
            ) : (
              <ul className="space-y-2">
                {linkedProblems.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/problems/${p.id}`}
                      className="flex items-center gap-3 rounded-lg border border-border p-2.5 hover:bg-secondary/40 transition-colors"
                    >
                      <BookOpen className="size-3.5 text-muted-foreground" />
                      <span className="flex-1 truncate text-sm">{p.title}</span>
                      {p.difficulty && (
                        <Badge variant={DIFFICULTY_VARIANT[p.difficulty] ?? "secondary"} className="text-[10px]">
                          {p.difficulty}
                        </Badge>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* RIGHT — status + vault */}
        <div className="space-y-5">
          {/* Status & Confidence */}
          <div className="surface-card rounded-2xl p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Status
            </h2>
            <form action={statusAction} className="space-y-4">
              <input type="hidden" name="conceptId" value={concept.id} />
              <div className="grid grid-cols-1 gap-2">
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSelectedStatus(s)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all",
                      selectedStatus === s
                        ? "border-transparent text-white"
                        : "border-border text-muted-foreground hover:border-border-strong",
                    )}
                    style={selectedStatus === s ? { backgroundColor: STATUS_COLOR[s] } : {}}
                  >
                    <span
                      className="size-2 rounded-full shrink-0"
                      style={{ backgroundColor: STATUS_COLOR[s] }}
                    />
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
              <input type="hidden" name="status" value={selectedStatus} />

              <div className="space-y-2">
                <Label htmlFor="conf" className="text-xs">
                  Confidence (1–5)
                </Label>
                <Input
                  id="conf"
                  name="confidence"
                  type="number"
                  min={1}
                  max={5}
                  value={confidence}
                  onChange={(e) => setConfidence(e.target.value)}
                  className="w-20"
                />
              </div>

              {statusResult && !statusResult.ok && (
                <p className="text-xs text-danger">{statusResult.error}</p>
              )}

              <Button type="submit" size="sm" className="w-full" disabled={statusPending}>
                <Save className="size-3.5" />
                {statusPending ? "Saving…" : "Save Status"}
              </Button>
            </form>
          </div>

          {/* Related Vault Items */}
          {relatedKnowledge.length > 0 && (
            <div className="surface-card rounded-2xl p-5">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Related Vault
              </h2>
              <ul className="space-y-2">
                {relatedKnowledge.map((k) => {
                  const Icon = RESOURCE_ICON[k.type] ?? Brain;
                  return (
                    <li key={k.id} className="flex items-center gap-2.5 text-sm">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-secondary">
                        <Icon className="size-3" />
                      </span>
                      {k.url ? (
                        <a
                          href={k.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="truncate text-primary hover:underline"
                        >
                          {k.title}
                        </a>
                      ) : (
                        <span className="truncate">{k.title}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
