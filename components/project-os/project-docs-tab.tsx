"use client";

import { useActionState, useEffect, useState } from "react";
import { FileText, Plus, ExternalLink } from "lucide-react";

import type { Tables } from "@/types/database";
import { createDocument } from "@/app/(app)/projects/[id]/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const DOC_TYPES = ["note", "requirements", "architecture", "api", "meeting", "research", "contract", "other"];

const DOC_TYPE_LABELS: Record<string, string> = {
  note: "Note",
  requirements: "Requirements",
  architecture: "Architecture",
  api: "API Docs",
  meeting: "Meeting Notes",
  research: "Research",
  contract: "Contract",
  other: "Other",
};

interface Props {
  project: Tables<"projects">;
  documents: Tables<"project_documents">[];
}

export function ProjectDocsTab({ project, documents }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<Tables<"project_documents"> | null>(null);

  const grouped = DOC_TYPES.reduce<Record<string, Tables<"project_documents">[]>>((acc, t) => {
    acc[t] = documents.filter((d) => d.doc_type === t);
    return acc;
  }, {});

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {/* Sidebar */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Documents</h2>
          <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => setShowForm(!showForm)}>
            <Plus className="w-3 h-3" />
            New
          </Button>
        </div>

        {showForm && (
          <DocCreateForm projectId={project.id} onClose={() => setShowForm(false)} />
        )}

        {documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No documents yet.</p>
        ) : (
          <div className="space-y-3">
            {DOC_TYPES.map((type) => {
              const docs = grouped[type] ?? [];
              if (docs.length === 0) return null;
              return (
                <div key={type}>
                  <p className="text-xs text-muted-foreground mb-1">{DOC_TYPE_LABELS[type]}</p>
                  {docs.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => setSelected(doc)}
                      className={`w-full text-left px-2 py-1.5 rounded text-sm transition-colors flex items-center gap-2 ${
                        selected?.id === doc.id
                          ? "bg-white/10 text-white"
                          : "text-muted-foreground hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{doc.title}</span>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Content pane */}
      <div className="md:col-span-2">
        {selected ? (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-lg font-semibold">{selected.title}</h1>
                <p className="text-xs text-muted-foreground">{DOC_TYPE_LABELS[selected.doc_type]}</p>
              </div>
              {selected.file_url && (
                <a
                  href={selected.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-white transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
            {selected.content ? (
              <div className="prose prose-sm prose-invert max-w-none whitespace-pre-wrap text-muted-foreground">
                {selected.content}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No content.</p>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
            Select a document to view
          </div>
        )}
      </div>
    </div>
  );
}

function DocCreateForm({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const [state, action, pending] = useActionState(createDocument, null);

  useEffect(() => {
    if (state?.ok) onClose();
  }, [state, onClose]);

  return (
    <form action={action} className="p-3 rounded-lg border border-border/60 bg-white/5 space-y-3">
      <input type="hidden" name="project_id" value={projectId} />
      <div className="space-y-1.5">
        <Label className="text-xs">Title *</Label>
        <Input name="title" placeholder="e.g. API Architecture" required />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Type</Label>
        <select
          name="doc_type"
          defaultValue="note"
          className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
        >
          {DOC_TYPES.map((t) => (
            <option key={t} value={t} className="bg-background">
              {DOC_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Content</Label>
        <Textarea name="content" placeholder="Document content…" rows={4} />
      </div>
      {state && !state.ok && <p className="text-xs text-destructive">{state.error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Create"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
