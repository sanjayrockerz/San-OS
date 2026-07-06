"use client";

import { useActionState, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Mic, Square, Brain, Sparkles, AlertCircle } from "lucide-react";
import { Section } from "@/components/layout/page-transition";
import { brainDump } from "@/app/(app)/execution/actions";
import {
  getLiveSpeechProvider,
  type LiveSpeechSession,
  type SpeechLang,
} from "@/lib/voice/live-speech-provider";
import { parseBrainDump } from "@/lib/execution/brain-dump";
import { cn } from "@/lib/utils";

const LANGS: { value: SpeechLang; label: string }[] = [
  { value: "en-US", label: "English" },
  { value: "ta-IN", label: "தமிழ்" },
  { value: "hi-IN", label: "हिन्दी" },
];

const noSubscribe = () => () => {};

/**
 * Speak your brain dump. Live transcription via the browser's free Web Speech
 * API (no install, no key); the transcript flows through the same Brain Dump +
 * Priority Engine as typed capture, so voice yields identical structured items.
 */
export function VoiceCaptureWidget() {
  // Hydration-safe support check (server snapshot = false).
  const supported = useSyncExternalStore(
    noSubscribe,
    () => getLiveSpeechProvider().isSupported(),
    () => false,
  );

  const [result, formAction, pending] = useActionState(brainDump, null);
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [lang, setLang] = useState<SpeechLang>("en-US");
  const sessionRef = useRef<LiveSpeechSession | null>(null);
  const transcriptRef = useRef("");
  const autoSubmitRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  const preview = useMemo(() => (transcript.trim() ? parseBrainDump(transcript) : []), [transcript]);

  const start = () => {
    setError(null);
    autoSubmitRef.current = false;
    setRecording(true);
    sessionRef.current = getLiveSpeechProvider().start({
      lang,
      onTranscript: ({ text }) => {
        transcriptRef.current = text;
        setTranscript(text);
      },
      onError: (message) => {
        setError(message);
        setRecording(false);
        autoSubmitRef.current = false;
      },
      onEnd: () => {
        setRecording(false);
        sessionRef.current = null;

        if (autoSubmitRef.current) return;

        const text = transcriptRef.current.trim();
        if (!text) {
          setError("No speech detected — try again.");
          return;
        }

        autoSubmitRef.current = true;
        formRef.current?.requestSubmit();
      },
    });
  };

  const stop = () => {
    sessionRef.current?.stop();
    sessionRef.current = null;
    setRecording(false);
  };

  return (
    <Section>
      <div className="surface-card rounded-2xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mic className="size-4 text-primary" />
            <p className="text-title">Voice Capture</p>
          </div>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            disabled={recording}
            className="rounded-lg border border-border bg-background px-2 py-1 text-[10px] focus:border-primary/50 focus:outline-none"
          >
            {LANGS.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
        </div>

        {!supported ? (
          <div className="flex items-start gap-2 rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
            <span>Voice capture needs a Chromium browser (Chrome/Edge). You can still type a brain dump in Quick Capture.</span>
          </div>
        ) : (
          <form
            ref={formRef}
            action={formAction}
            onSubmit={() => {
              autoSubmitRef.current = true;
              if (result?.ok) {
                setTranscript("");
                transcriptRef.current = "";
              }
            }}
            className="space-y-2"
          >
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={recording ? stop : start}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-colors",
                  recording
                    ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                    : "bg-primary text-primary-foreground hover:bg-primary/90",
                )}
              >
                {recording ? <Square className="size-3.5" /> : <Mic className="size-3.5" />}
                {recording ? "Stop" : "Speak"}
              </button>
              {recording && (
                <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className="size-2 animate-pulse rounded-full bg-destructive" /> Listening…
                </span>
              )}
            </div>

            <textarea
              name="raw"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Your words appear here — edit freely, then capture."
              className="min-h-[70px] w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
            />

            {preview.length > 0 && (
              <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Sparkles className="size-2.5 text-primary" /> {preview.length} item(s) detected
              </p>
            )}

            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">Parsed & prioritised on capture</span>
              <button
                type="submit"
                disabled={pending || preview.length === 0}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                <Brain className="size-3" />
                {pending ? "Capturing…" : "Capture"}
              </button>
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}
            {result && !result.ok && <p className="text-xs text-destructive">{result.error}</p>}
            {result?.ok && <p className="text-xs text-success">Captured {result.created} item(s)!</p>}
          </form>
        )}
      </div>
    </Section>
  );
}
