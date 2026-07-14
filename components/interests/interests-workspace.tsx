"use client";

import { useActionState } from "react";
import { useState } from "react";
import { Archive, BookOpen, Plus, Sparkles } from "lucide-react";
import type { Interest } from "@/lib/interests/types";
import { archiveInterest, createInterest, updateInterest } from "@/app/(app)/interests/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const SUGGESTIONS = ["Agentic AI", "RAG", "Machine Learning", "System Design", "Filmmaking", "Entrepreneurship", "Books", "Research Topics"];

export function InterestsWorkspace({ interests }: { interests: Interest[] }) {
  const [showCreate, setShowCreate] = useState(false);
  const [createState, createAction, creating] = useActionState(createInterest, null);
  return <div className="mx-auto mt-6 max-w-6xl space-y-6 px-4 pb-24 sm:px-6 lg:px-8">
    <div className="mission-surface rounded-3xl p-5 sm:p-7"><div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">Your learning graph</p><h2 className="mt-2 text-2xl font-semibold tracking-tight">Make curiosity compound.</h2><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Interests stay separate from your reference vault, while the planner can still recommend time for them.</p></div><Button onClick={() => setShowCreate((v) => !v)} className="gap-2"><Plus className="size-4" /> New interest</Button></div></div>
    {showCreate && <Card className="p-4"><form action={createAction} className="grid gap-3 sm:grid-cols-[1fr_1.5fr_auto] sm:items-end"><label className="space-y-1 text-xs font-medium">Name<input name="name" placeholder="e.g. Filmmaking" className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm" required /></label><label className="space-y-1 text-xs font-medium">What do you want to do with it?<input name="description" placeholder="Build a weekly practice habit" className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm" /></label><Button type="submit" disabled={creating}>{creating ? "Creating…" : "Create"}</Button></form>{createState && !createState.ok && <p className="mt-2 text-xs text-destructive">{createState.error}</p>}</Card>}
    {interests.length === 0 ? <Card className="p-8 text-center"><BookOpen className="mx-auto size-8 text-primary" /><p className="mt-3 font-semibold">Start an interest area</p><p className="mt-1 text-sm text-muted-foreground">Choose one subject you want to keep returning to.</p><div className="mt-5 flex flex-wrap justify-center gap-2">{SUGGESTIONS.slice(0, 5).map((s) => <button key={s} onClick={() => setShowCreate(true)} className="rounded-full border border-border px-3 py-1.5 text-xs hover:border-primary/50">{s}</button>)}</div></Card> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{interests.map((interest) => <InterestCard key={interest.id} interest={interest} />)}</div>}
  </div>;
}

function InterestCard({ interest }: { interest: Interest }) {
  const [state, action, pending] = useActionState(updateInterest, null);
  const [archiveState, archiveAction] = useActionState(archiveInterest, null);
  return <Card className="group p-5 transition-all hover:-translate-y-0.5 hover:border-primary/30"><div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><span className="size-2 rounded-full bg-primary" /><h3 className="font-semibold">{interest.name}</h3></div><p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{interest.description ?? "Add notes, resources, and a project to make this area concrete."}</p></div><Sparkles className="size-4 text-primary/60" /></div><div className="mt-5"><div className="flex justify-between text-xs text-muted-foreground"><span>Progress</span><span>{interest.progress}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${interest.progress}%` }} /></div></div><div className="mt-5 flex items-center justify-between gap-2"><form action={action} className="flex items-center gap-2"><input type="hidden" name="id" value={interest.id} /><input name="progress" type="number" min="0" max="100" defaultValue={interest.progress} className="h-9 w-20 rounded-lg border border-input bg-background px-2 text-xs" /><Button size="sm" variant="outline" type="submit" disabled={pending}>Update</Button></form><form action={archiveAction}><input type="hidden" name="id" value={interest.id} /><button type="submit" className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" title="Archive interest"><Archive className="size-4" /></button></form></div>{state && !state.ok && <p className="mt-2 text-xs text-destructive">{state.error}</p>}{archiveState && !archiveState.ok && <p className="mt-2 text-xs text-destructive">{archiveState.error}</p>}</Card>;
}
