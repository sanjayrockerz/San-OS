"use client";

import { useState, useTransition } from "react";
import { Pencil, Plus, Loader2, Check, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CodeBlock } from "@/components/problems/code-block";
import { saveCodeVersion } from "@/app/(app)/problems/actions";

type CodeVersion = {
  id: string;
  code: string;
  language: string;
  is_final: boolean;
  created_at: string;
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Read-only code vault list with an inline editor for adding/editing the latest version. */
export function CodeVaultEditor({
  problemId,
  versions,
}: {
  problemId: string;
  versions: CodeVersion[];
}) {
  const latest = versions[0] ?? null;
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await saveCodeVersion(problemId, null, formData);
      if (res.ok) {
        setEditing(false);
      } else {
        setError(res.error);
      }
    });
  }

  if (editing) {
    return (
      <form action={handleSubmit} className="space-y-3">
        <input type="hidden" name="versionId" value={latest?.id ?? ""} />
        <Input
          name="language"
          required
          defaultValue={latest?.language ?? ""}
          placeholder="e.g. python, typescript"
          className="h-9 max-w-[200px]"
        />
        <Textarea
          name="code"
          required
          defaultValue={latest?.code ?? ""}
          rows={10}
          placeholder="Paste or write your solution…"
          className="min-h-[220px] font-mono text-[13px]"
        />
        {error && <p className="text-xs text-danger">{error}</p>}
        <div className="flex items-center gap-2">
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
            Save code
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
      {versions.length > 0 ? (
        versions.map((cv) => (
          <div key={cv.id} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{fmtDate(cv.created_at)}</span>
              <div className="flex items-center gap-2">
                {cv.is_final && <Badge variant="success">Final</Badge>}
                {cv.id === latest?.id && (
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Pencil className="size-3.5" /> Edit
                  </button>
                )}
              </div>
            </div>
            <CodeBlock code={cv.code} language={cv.language} />
          </div>
        ))
      ) : (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">No code saved yet.</p>
          <Button type="button" size="sm" variant="secondary" onClick={() => setEditing(true)}>
            <Plus className="size-4" />
            Add code
          </Button>
        </div>
      )}
    </div>
  );
}
