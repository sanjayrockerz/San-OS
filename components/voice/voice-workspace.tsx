"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square, Play, Pause, AudioLines, Sparkles, CheckCircle2, Volume2, Save, FileText, Send, User, FolderKanban } from "lucide-react";
import { getLiveSpeechProvider, type LiveSpeechSession, type SpeechLang } from "@/lib/voice/live-speech-provider";
import { submitIntake } from "@/app/(app)/actions/intake";
import { cn } from "@/lib/utils";

export function VoiceWorkspace() {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [mode, setMode] = useState<"quick" | "dump" | "meeting" | "lecture">("quick");
  const [processing, setProcessing] = useState(false);
  const [intakeResult, setIntakeResult] = useState<any>(null);
  const sessionRef = useRef<LiveSpeechSession | null>(null);
  const transcriptRef = useRef("");

  const startRecording = () => {
    setRecording(true);
    setTranscript("");
    transcriptRef.current = "";
    sessionRef.current = getLiveSpeechProvider().start({
      lang: "en-US",
      onTranscript: ({ text }) => {
        transcriptRef.current = text;
        setTranscript(text);
      },
      onEnd: () => {
        setRecording(false);
      },
    });
  };

  const stopRecording = () => {
    sessionRef.current?.stop();
    setRecording(false);
  };

  const handleProcessVoice = async () => {
    if (!transcript.trim() || processing) return;
    try {
      setProcessing(true);
      const res = await submitIntake({ text: transcript });
      if (res.success) {
        setIntakeResult(res.result);
      }
    } catch {
      // Handled
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Control Card */}
      <div className="surface-card rounded-3xl p-6 border border-border/60 bg-card/60 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400">
              <Mic className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Voice Engine</h3>
              <p className="text-xs text-muted-foreground">Select recording mode & speak freely</p>
            </div>
          </div>

          <div className="flex gap-1.5 rounded-xl bg-muted p-1 text-xs">
            {(["quick", "dump", "meeting", "lecture"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={cn(
                  "rounded-lg px-3 py-1 font-medium capitalize transition",
                  mode === m ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Live Mic Control */}
        <div className="flex flex-col items-center justify-center py-8 rounded-2xl border border-dashed border-border/60 bg-background/50">
          <button
            type="button"
            onClick={recording ? stopRecording : startRecording}
            className={cn(
              "flex size-16 items-center justify-center rounded-full transition-transform shadow-xl hover:scale-105",
              recording
                ? "bg-destructive text-destructive-foreground animate-pulse"
                : "bg-indigo-500 text-white shadow-indigo-500/25",
            )}
          >
            {recording ? <Square className="size-6" /> : <Mic className="size-6" />}
          </button>
          <p className="mt-3 text-xs font-semibold text-foreground">
            {recording ? "Listening… Click to Stop" : "Tap Microphone to Start Speaking"}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Mode: {mode.toUpperCase()}</p>
        </div>

        {/* Live Transcript & Processing */}
        <div className="mt-4 space-y-3">
          <label className="text-xs font-medium text-muted-foreground">Live Transcript</label>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Your voice transcription will stream here live. You can edit text before processing."
            className="min-h-[100px] w-full resize-none rounded-xl border border-border bg-background p-3 text-sm focus:border-indigo-500 focus:outline-none"
          />

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">Auto-extracts intent, projects, clients, and timeline events</span>
            <button
              type="button"
              onClick={handleProcessVoice}
              disabled={processing || !transcript.trim()}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-600 disabled:opacity-50"
            >
              <Send className="size-3.5" /> {processing ? "Routing…" : "Route to OS Pipeline"}
            </button>
          </div>
        </div>
      </div>

      {/* Result Explanation Card */}
      {intakeResult && (
        <div className="surface-card rounded-3xl p-6 border border-emerald-500/30 bg-emerald-500/[0.03]">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs uppercase tracking-wider mb-2">
            <CheckCircle2 className="size-4" /> Routed into System Pipeline
          </div>
          <p className="text-sm font-medium text-foreground">
            Created Timeline Event and extracted {intakeResult.capturedItems?.length || 0} action item(s).
          </p>
          {intakeResult.resolvedProject && (
            <p className="mt-1 text-xs text-muted-foreground">
              • Linked Project: <span className="font-semibold text-foreground">{intakeResult.resolvedProject.name}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
