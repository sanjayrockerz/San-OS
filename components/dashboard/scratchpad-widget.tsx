"use client";

import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import { BookOpen, Pin, Trash2, Plus } from "lucide-react";
import { Section } from "@/components/layout/page-transition";
import { cn } from "@/lib/utils";

interface ScratchNote {
  id: string;
  content: string;
  pinned: boolean;
  createdAt: number;
}

const STORAGE_KEY = "sanos_scratchpad";
const EMPTY = "[]";

/**
 * localStorage-backed store exposed through useSyncExternalStore so the widget
 * hydrates safely on the server (empty snapshot) and stays in sync with other
 * tabs, without calling setState inside an effect.
 */
const listeners = new Set<() => void>();

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

function getSnapshot(): string {
  return localStorage.getItem(STORAGE_KEY) ?? EMPTY;
}

function getServerSnapshot(): string {
  return EMPTY;
}

function saveNotes(notes: ScratchNote[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  listeners.forEach((l) => l());
}

export function ScratchpadWidget() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const notes = useMemo<ScratchNote[]>(() => {
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }, [raw]);
  const [draft, setDraft] = useState("");
  const [expanded, setExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const addNote = () => {
    if (!draft.trim()) return;
    const newNote: ScratchNote = {
      id: crypto.randomUUID(),
      content: draft.trim(),
      pinned: false,
      createdAt: Date.now(),
    };
    saveNotes([newNote, ...notes]);
    setDraft("");
  };

  const togglePin = (id: string) => {
    saveNotes(notes.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)));
  };

  const deleteNote = (id: string) => {
    saveNotes(notes.filter((n) => n.id !== id));
  };

  const sortedNotes = [...notes].sort((a, b) =>
    a.pinned === b.pinned ? b.createdAt - a.createdAt : a.pinned ? -1 : 1,
  );

  const visibleNotes = expanded ? sortedNotes : sortedNotes.slice(0, 3);

  return (
    <Section>
      <div className="surface-card rounded-2xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="size-4 text-primary" />
            <p className="text-title">Scratchpad</p>
          </div>
          {notes.length > 0 && (
            <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              {notes.length}
            </span>
          )}
        </div>

        <div className="mb-2 flex gap-2">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Quick note… (⌘↵ to save)"
            className="min-h-[44px] flex-1 resize-none rounded-lg border border-border bg-background px-2.5 py-2 text-xs placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                addNote();
              }
            }}
          />
          <button
            type="button"
            onClick={addNote}
            disabled={!draft.trim()}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-40"
          >
            <Plus className="size-4" />
          </button>
        </div>

        {sortedNotes.length === 0 ? (
          <p className="py-2 text-center text-xs text-muted-foreground">
            No notes yet. Start typing above.
          </p>
        ) : (
          <div className="space-y-1.5">
            {visibleNotes.map((note) => (
              <div
                key={note.id}
                className={cn(
                  "group flex items-start gap-2 rounded-lg border px-2.5 py-2",
                  note.pinned ? "border-primary/20 bg-primary/5" : "border-border",
                )}
              >
                <p className="min-w-0 flex-1 whitespace-pre-wrap text-xs leading-relaxed">
                  {note.content}
                </p>
                <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => togglePin(note.id)}
                    className="flex size-5 items-center justify-center rounded text-muted-foreground hover:text-primary"
                    title={note.pinned ? "Unpin" : "Pin"}
                  >
                    <Pin className={cn("size-3", note.pinned && "fill-current text-primary")} />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteNote(note.id)}
                    className="flex size-5 items-center justify-center rounded text-muted-foreground hover:text-destructive"
                    title="Delete"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
              </div>
            ))}
            {sortedNotes.length > 3 && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="w-full rounded-lg py-1 text-center text-xs text-muted-foreground hover:text-primary"
              >
                {expanded ? "Show less" : `+${sortedNotes.length - 3} more`}
              </button>
            )}
          </div>
        )}
      </div>
    </Section>
  );
}
