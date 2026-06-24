"use client";

import { useState, useTransition } from "react";
import { Pencil, Check, X, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { saveReflection } from "@/app/(app)/problems/actions";

type Reflection = {
  id: string;
  my_explanation: string | null;
  algorithm_in_words: string | null;
  bug_that_stopped_me: string | null;
  final_takeaway: string | null;
};

function Block({ label, text }: { label: string; text: string | null }) {
  if (!text) return null;
  return (
    <div>
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{text}</p>
    </div>
  );
}

/** Inline-editable reflection — algorithm, explanation, bug and takeaway notes for one problem. */
export function ReflectionEditor({
  problemId,
  reflection,
}: {
  problemId: string;
  reflection: Reflection | null;
}) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await saveReflection(problemId, null, formData);
      if (res.ok) {
        setEditing(false);
      } else {
        setError(res.error);
      }
    });
  }

  const hasContent =
    reflection &&
    (reflection.algorithm_in_words ||
      reflection.my_explanation ||
      reflection.bug_that_stopped_me ||
      reflection.final_takeaway);

  if (editing) {
    return (
      <form action={handleSubmit} className="space-y-4">
        <input type="hidden" name="reflectionId" value={reflection?.id ?? ""} />
        <Field
          label="Algorithm in own words"
          name="algorithmInWords"
          defaultValue={reflection?.algorithm_in_words ?? ""}
        />
        <Field
          label="My explanation"
          name="myExplanation"
          defaultValue={reflection?.my_explanation ?? ""}
        />
        <Field
          label="Bug that stopped me"
          name="bugThatStoppedMe"
          defaultValue={reflection?.bug_that_stopped_me ?? ""}
        />
        <Field
          label="Final takeaway"
          name="finalTakeaway"
          defaultValue={reflection?.final_takeaway ?? ""}
        />
        {error && <p className="text-xs text-danger">{error}</p>}
        <div className="flex items-center gap-2">
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
            Save notes
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => setEditing(false)}
            disabled={pending}
          >
            <X className="size-4" />
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {hasContent ? "Notes captured for this problem." : "No notes written yet."}
        </p>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <Pencil className="size-3.5" /> {hasContent ? "Edit" : "Add notes"}
        </button>
      </div>
      {hasContent && (
        <div className="space-y-3">
          <Block label="Algorithm in own words" text={reflection?.algorithm_in_words ?? null} />
          <Block label="My explanation" text={reflection?.my_explanation ?? null} />
          <Block label="Bug that stopped me" text={reflection?.bug_that_stopped_me ?? null} />
          <Block label="Final takeaway" text={reflection?.final_takeaway ?? null} />
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</label>
      <Textarea name={name} defaultValue={defaultValue} rows={3} className="min-h-[80px]" />
    </div>
  );
}
