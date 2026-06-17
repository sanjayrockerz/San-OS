"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Brain, Check, Save } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createConcept, type ActionResult } from "@/app/(app)/concepts/actions";

interface Option {
  id: string;
  name: string;
}

interface Props {
  topics: Option[];
  patterns: Option[];
}

const STEPS = [
  { id: 1, label: "Identity", icon: Brain },
  { id: 2, label: "Understanding", icon: Brain },
  { id: 3, label: "Patterns", icon: Brain },
];

const STATUS_OPTIONS = [
  { value: "learning", label: "Learning — still figuring it out" },
  { value: "understood", label: "Understood — can explain it" },
  { value: "weak", label: "Weak — keeps tripping me up" },
  { value: "mastered", label: "Mastered — second nature" },
];

export function NewConceptForm({ topics, patterns }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [clues, setClues] = useState<string[]>([""]);
  const [mistakes, setMistakes] = useState<string[]>([""]);

  const [result, action, pending] = useActionState(
    async (_prev: ActionResult | null, formData: FormData) => {
      const res = await createConcept(_prev, formData);
      if (res.ok && res.id) {
        router.push(`/concepts/${res.id}`);
      }
      return res;
    },
    null,
  );

  function addClue() { setClues((c) => [...c, ""]); }
  function setClue(i: number, v: string) { setClues((c) => c.map((x, j) => j === i ? v : x)); }
  function removeClue(i: number) { setClues((c) => c.filter((_, j) => j !== i)); }

  function addMistake() { setMistakes((m) => [...m, ""]); }
  function setMistake(i: number, v: string) { setMistakes((m) => m.map((x, j) => j === i ? v : x)); }
  function removeMistake(i: number) { setMistakes((m) => m.filter((_, j) => j !== i)); }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <button
          onClick={() => (step > 1 ? setStep(step - 1) : router.back())}
          className="flex size-9 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold tracking-tight">New Concept Note</h1>
          <p className="text-sm text-muted-foreground">Step {step} of {STEPS.length}</p>
        </div>
      </div>

      {/* Step indicators */}
      <div className="mb-8 flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <button
              onClick={() => step > s.id && setStep(s.id)}
              className={cn(
                "flex size-8 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                s.id < step
                  ? "bg-success text-success-foreground cursor-pointer"
                  : s.id === step
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground",
              )}
            >
              {s.id < step ? <Check className="size-3.5" /> : s.id}
            </button>
            <span className={cn("text-sm", s.id === step ? "font-medium" : "text-muted-foreground hidden sm:block")}>
              {s.label}
            </span>
            {i < STEPS.length - 1 && (
              <div className={cn("mx-1 h-px w-8 sm:w-16", s.id < step ? "bg-success" : "bg-border")} />
            )}
          </div>
        ))}
      </div>

      <form action={action}>
        {/* Hidden arrays */}
        {clues.filter(Boolean).map((c, i) => (
          <input key={i} type="hidden" name="recognition_clues" value={c} />
        ))}
        {mistakes.filter(Boolean).map((m, i) => (
          <input key={i} type="hidden" name="common_mistakes" value={m} />
        ))}

        <div className="surface-card rounded-2xl p-6 space-y-5">
          {/* Step 1 — Identity */}
          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="title">Concept Title *</Label>
                <Input id="title" name="title" required placeholder="e.g. Two Pointer Technique" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input id="category" name="category" placeholder="e.g. Sliding Window, Graph, DP…" />
              </div>
              <div className="space-y-2">
                <Label>How well do you know this?</Label>
                <Select name="status" defaultValue="learning">
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confidence">Confidence (1–5)</Label>
                <Input
                  id="confidence"
                  name="confidence"
                  type="number"
                  min={1}
                  max={5}
                  placeholder="3"
                  className="w-24"
                />
              </div>
            </>
          )}

          {/* Step 2 — Understanding */}
          {step === 2 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="personal_explanation">
                  Personal Explanation
                  <span className="ml-1 text-xs text-muted-foreground">(in your own words)</span>
                </Label>
                <Textarea
                  id="personal_explanation"
                  name="personal_explanation"
                  rows={5}
                  placeholder="Explain this concept as if teaching a friend. No copying from editorials."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="when_to_use">When to Use</Label>
                <Textarea
                  id="when_to_use"
                  name="when_to_use"
                  rows={3}
                  placeholder="What problem signals tell you to reach for this technique?"
                />
              </div>
              <div className="space-y-2">
                <Label>Recognition Clues</Label>
                <p className="text-xs text-muted-foreground">Signals in the problem that hint at this pattern.</p>
                {clues.map((clue, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      value={clue}
                      onChange={(e) => setClue(i, e.target.value)}
                      placeholder={`Clue ${i + 1}`}
                    />
                    {clues.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeClue(i)}
                        className="text-muted-foreground hover:text-danger text-sm px-2"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="secondary" size="sm" onClick={addClue}>
                  + Add Clue
                </Button>
              </div>
            </>
          )}

          {/* Step 3 — Patterns & Mistakes */}
          {step === 3 && (
            <>
              <div className="space-y-2">
                <Label>Link to Topic</Label>
                <Select name="topic_id" defaultValue="">
                  <option value="">None</option>
                  {topics.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Link to Pattern</Label>
                <Select name="pattern_id" defaultValue="">
                  <option value="">None</option>
                  {patterns.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Common Mistakes</Label>
                <p className="text-xs text-muted-foreground">What errors do you often make with this concept?</p>
                {mistakes.map((m, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      value={m}
                      onChange={(e) => setMistake(i, e.target.value)}
                      placeholder={`Mistake ${i + 1}`}
                    />
                    {mistakes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMistake(i)}
                        className="text-muted-foreground hover:text-danger text-sm px-2"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="secondary" size="sm" onClick={addMistake}>
                  + Add Mistake
                </Button>
              </div>
            </>
          )}
        </div>

        {result && !result.ok && (
          <p className="mt-3 text-sm text-danger">{result.error}</p>
        )}

        <div className="mt-5 flex items-center justify-between">
          {step > 1 ? (
            <Button type="button" variant="secondary" onClick={() => setStep(step - 1)}>
              <ArrowLeft className="size-4" /> Back
            </Button>
          ) : (
            <div />
          )}

          {step < STEPS.length ? (
            <Button type="button" onClick={() => setStep(step + 1)}>
              Next <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button type="submit" disabled={pending}>
              <Save className="size-4" />
              {pending ? "Saving…" : "Save Concept"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
