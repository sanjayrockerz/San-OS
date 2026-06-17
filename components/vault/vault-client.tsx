"use client";

import { useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  Plus,
  FileText,
  MonitorPlay,
  Code2,
  Link2,
  BookMarked,
  Lightbulb,
  GraduationCap,
  Image as ImageIcon,
  FileType2,
  Trash2,
  Loader2,
  ExternalLink,
  Library,
  X,
  Pencil,
} from "lucide-react";

import { PageTransition, Section } from "@/components/layout/page-transition";
import { PageHeader } from "@/components/layout/page-header";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import {
  createKnowledgeItem,
  deleteKnowledgeItem,
  updateKnowledgeItem,
} from "@/app/(app)/vault/actions";

export interface VaultItemView {
  id: string;
  type: string;
  title: string;
  content: string | null;
  url: string | null;
  tags: string[];
  updatedAt: string;
}

/** Visual + label config per knowledge type. */
const TYPE_META: Record<
  string,
  { label: string; icon: typeof FileText; tint: string }
> = {
  note: { label: "Note", icon: FileText, tint: "#60a5fa" },
  youtube: { label: "YouTube", icon: MonitorPlay, tint: "#f87171" },
  algorithm: { label: "Algorithm", icon: Code2, tint: "#34d399" },
  resource: { label: "Resource", icon: Link2, tint: "#a78bfa" },
  cheatsheet: { label: "Cheatsheet", icon: BookMarked, tint: "#fbbf24" },
  observation: { label: "Observation", icon: Lightbulb, tint: "#fb923c" },
  lecture: { label: "Lecture", icon: GraduationCap, tint: "#22d3ee" },
  image: { label: "Image", icon: ImageIcon, tint: "#94a3b8" },
  pdf: { label: "PDF", icon: FileType2, tint: "#94a3b8" },
};

/** Types the user can create today (text/link kinds). File kinds are deferred. */
const CREATABLE_TYPES = [
  "note",
  "youtube",
  "algorithm",
  "resource",
  "cheatsheet",
  "observation",
  "lecture",
] as const;

const FILTERS = ["All", ...CREATABLE_TYPES] as const;

function meta(type: string) {
  return TYPE_META[type] ?? TYPE_META.note;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
  });
}

export function VaultClient({ items }: { items: VaultItemView[] }) {
  const [list, setList] = useState(items);
  const [filter, setFilter] = useState<string>("All");
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<VaultItemView | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list.filter((i) => {
      if (filter !== "All" && i.type !== filter) return false;
      if (!q) return true;
      return (
        i.title.toLowerCase().includes(q) ||
        (i.content ?? "").toLowerCase().includes(q) ||
        i.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [list, filter, query]);

  return (
    <PageTransition>
      <PageHeader
        title="Knowledge Vault"
        description="Every note, link, algorithm and cheatsheet you've saved — searchable, taggable, and linked to your work."
        actions={
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="size-4" /> Quick Add
          </Button>
        }
      />

      <Section className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the vault…"
            className="h-11 pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((t) => {
            const label = t === "All" ? "All" : meta(t).label;
            return (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  filter === t
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </Section>

      <Section>
        {filtered.length === 0 ? (
          <EmptyState
            icon={Library}
            title={list.length === 0 ? "Your vault is empty" : "No matches"}
            description={
              list.length === 0
                ? "Save your first note, link, or algorithm. Everything you store here is searchable and can be linked to problems and concepts."
                : "Try a different filter or search term."
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence initial={false}>
              {filtered.map((item) => (
                <VaultCard
                  key={item.id}
                  item={item}
                  onDeleted={(id) =>
                    setList((prev) => prev.filter((i) => i.id !== id))
                  }
                  onEdit={(item) => setEditItem(item)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </Section>

      <AnimatePresence>
        {modalOpen && (
          <QuickAddModal
            onClose={() => setModalOpen(false)}
            onCreated={(item) => {
              setList((prev) => [item, ...prev]);
              setModalOpen(false);
            }}
          />
        )}
        {editItem && (
          <EditModal
            item={editItem}
            onClose={() => setEditItem(null)}
            onUpdated={(updated) => {
              setList((prev) =>
                prev.map((i) => (i.id === updated.id ? updated : i)),
              );
              setEditItem(null);
            }}
          />
        )}
      </AnimatePresence>
    </PageTransition>
  );
}

function VaultCard({
  item,
  onDeleted,
  onEdit,
}: {
  item: VaultItemView;
  onDeleted: (id: string) => void;
  onEdit: (item: VaultItemView) => void;
}) {
  const m = meta(item.type);
  const Icon = m.icon;
  const [pending, startTransition] = useTransition();

  function remove() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", item.id);
      const res = await deleteKnowledgeItem(null, fd);
      if (res.ok) onDeleted(item.id);
    });
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      className="group surface-card flex flex-col rounded-2xl p-4"
      style={{ boxShadow: `inset 3px 0 0 ${m.tint}` }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="flex size-7 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${m.tint}22`, color: m.tint }}
          >
            <Icon className="size-4" />
          </span>
          <Badge variant="secondary">{m.label}</Badge>
        </div>
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={() => onEdit(item)}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Edit item"
          >
            <Pencil className="size-4" />
          </button>
          <button
            onClick={remove}
            disabled={pending}
            className="text-muted-foreground hover:text-danger transition-colors"
            aria-label="Delete item"
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
          </button>
        </div>
      </div>

      <h3 className="mt-3 line-clamp-2 text-sm font-semibold leading-snug">
        {item.title}
      </h3>

      {item.content && (
        <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
          {item.content}
        </p>
      )}

      {item.url && (
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-2 inline-flex items-center gap-1 truncate text-xs font-medium text-primary hover:underline"
        >
          <ExternalLink className="size-3 shrink-0" />
          <span className="truncate">{item.url}</span>
        </a>
      )}

      <div className="mt-auto pt-3">
        {item.tags.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1">
            {item.tags.map((t) => (
              <span
                key={t}
                className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground"
              >
                #{t}
              </span>
            ))}
          </div>
        )}
        <p className="text-[11px] text-muted-foreground">
          Updated {relativeTime(item.updatedAt)}
        </p>
      </div>
    </motion.div>
  );
}

function EditModal({
  item,
  onClose,
  onUpdated,
}: {
  item: VaultItemView;
  onClose: () => void;
  onUpdated: (updated: VaultItemView) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const showUrl = item.type === "youtube" || item.type === "resource" || item.type === "lecture";

  function submit(formData: FormData) {
    setError(null);
    formData.set("id", item.id);
    startTransition(async () => {
      const res = await updateKnowledgeItem(null, formData);
      if (res.ok) {
        onUpdated({
          ...item,
          title: String(formData.get("title") ?? item.title),
          content: (formData.get("content") as string) || null,
          url: (formData.get("url") as string) || null,
          tags: String(formData.get("tags") ?? "")
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          updatedAt: new Date().toISOString(),
        });
      } else if (!res.ok) {
        setError(res.error);
      }
    });
  }

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[10vh]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: -8 }}
        transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-popover shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold">Edit vault item</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground" aria-label="Close">
            <X className="size-4" />
          </button>
        </div>

        <form action={submit} className="space-y-4 p-5">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Title</label>
            <Input name="title" defaultValue={item.title} required />
          </div>

          {showUrl && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">URL</label>
              <Input name="url" type="url" defaultValue={item.url ?? ""} placeholder="https://…" />
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Notes</label>
            <Textarea name="content" defaultValue={item.content ?? ""} className="min-h-[120px]" />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Tags <span className="opacity-60">(comma separated)</span>
            </label>
            <Input name="tags" defaultValue={item.tags.join(", ")} placeholder="prefix-sum, dp" />
          </div>

          {error && <p className="text-xs text-danger">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Pencil className="size-4" />}
              Save
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function QuickAddModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (item: VaultItemView) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<string>("note");

  const showUrl = type === "youtube" || type === "resource" || type === "lecture";

  function submit(formData: FormData) {
    setError(null);
    formData.set("type", type);
    startTransition(async () => {
      const res = await createKnowledgeItem(null, formData);
      if (res.ok && res.id) {
        onCreated({
          id: res.id,
          type,
          title: String(formData.get("title") ?? ""),
          content: (formData.get("content") as string) || null,
          url: (formData.get("url") as string) || null,
          tags: String(formData.get("tags") ?? "")
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          updatedAt: new Date().toISOString(),
        });
      } else if (!res.ok) {
        setError(res.error);
      }
    });
  }

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[10vh]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: -8 }}
        transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-popover shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold">Add to vault</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <form action={submit} className="space-y-4 p-5">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Type
            </label>
            <Select value={type} onChange={(e) => setType(e.target.value)}>
              {CREATABLE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {meta(t).label}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Title
            </label>
            <Input name="title" placeholder="Give it a clear title…" required />
          </div>

          {showUrl && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                URL
              </label>
              <Input name="url" type="url" placeholder="https://…" />
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              {type === "algorithm" ? "Algorithm / steps" : "Notes"}
            </label>
            <Textarea
              name="content"
              placeholder={
                type === "algorithm"
                  ? "Write the approach in your own words…"
                  : "Optional details…"
              }
              className="min-h-[120px]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Tags <span className="opacity-60">(comma separated)</span>
            </label>
            <Input name="tags" placeholder="prefix-sum, dp, must-revise" />
          </div>

          <p className="rounded-lg border border-dashed border-border bg-background-subtle/40 px-3 py-2 text-[11px] text-muted-foreground">
            File uploads (images, PDFs) arrive in a later phase. For now, save
            links and written notes.
          </p>

          {error && <p className="text-xs text-danger">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              Save
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
