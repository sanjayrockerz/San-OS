"use client";

import { useEffect, useState } from "react";
import { Mic, Play, Pause, Volume2, Save, Sparkles, AudioLines, FileText, CheckCircle2 } from "lucide-react";
import { Section } from "@/components/layout/page-transition";
import { cn } from "@/lib/utils";

export interface VoiceNoteItem {
  id: string;
  title: string;
  transcript: string;
  audio_url: string | null;
  duration_seconds: number;
  created_at: string;
}

export function VoiceMessagesVault() {
  const [notes, setNotes] = useState<VoiceNoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePlayingId, setActivePlayingId] = useState<string | null>(null);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/voice/store");
      const data = await res.json();
      if (data.notes) {
        setNotes(data.notes);
      }
    } catch {
      // Ignore fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const togglePlay = (id: string) => {
    if (activePlayingId === id) {
      setActivePlayingId(null);
    } else {
      setActivePlayingId(id);
    }
  };

  return (
    <Section className="mb-6">
      <div className="surface-card rounded-2xl p-5 border border-border/50 bg-card/60 backdrop-blur-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
              <AudioLines className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Voice Messages & Audio Vault</h3>
              <p className="text-[11px] text-muted-foreground">Stored voice recordings, transcriptions & audio notes</p>
            </div>
          </div>
          <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-medium text-indigo-400">
            {notes.length} Voice Note{notes.length === 1 ? "" : "s"}
          </span>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-muted-foreground">Loading voice vault...</div>
        ) : notes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/70 p-6 text-center">
            <Mic className="mx-auto size-7 text-muted-foreground/40" />
            <p className="mt-2 text-xs font-medium text-muted-foreground">No voice notes saved yet</p>
            <p className="text-[11px] text-muted-foreground/60 mt-0.5">Use the Voice Capture widget to speak & store audio messages</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => {
              const isPlaying = activePlayingId === note.id;
              return (
                <div
                  key={note.id}
                  className="rounded-xl border border-border/40 bg-background/50 p-3.5 transition hover:border-border"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => togglePlay(note.id)}
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-xl transition shadow-sm",
                          isPlaying
                            ? "bg-indigo-500 text-white"
                            : "bg-muted text-foreground hover:bg-muted/80",
                        )}
                      >
                        {isPlaying ? <Pause className="size-4" /> : <Play className="size-4 ml-0.5" />}
                      </button>

                      <div>
                        <h4 className="text-xs font-medium text-foreground">{note.title}</h4>
                        <p className="mt-1 text-xs text-muted-foreground leading-relaxed italic">
                          "{note.transcript}"
                        </p>
                        <div className="mt-2 flex items-center gap-3 text-[10px] text-muted-foreground/70">
                          <span>{new Date(note.created_at).toLocaleDateString()}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Volume2 className="size-3 text-indigo-400" /> Audio Ready
                          </span>
                        </div>
                      </div>
                    </div>

                    <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md font-medium">
                      <CheckCircle2 className="size-3" /> Saved
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Section>
  );
}
