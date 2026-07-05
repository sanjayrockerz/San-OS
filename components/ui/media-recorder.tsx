"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Square, Loader2, CheckCircle2, AlertCircle, Pause, Play, X, Edit2, RotateCcw, Send } from "lucide-react";
import { Button } from "./button";

export interface MediaRecorderProps {
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  autoSubmit?: boolean;
}

export function VoiceRecorder({ onSuccess, onError, autoSubmit = true }: MediaRecorderProps) {
  const [status, setStatus] = useState<"idle" | "recording" | "paused" | "processing" | "review" | "success" | "error">("idle");
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [confidence, setConfidence] = useState<number | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioBlobRef = useRef<Blob | null>(null);
  
  // Waveform state (simplified for example)
  const [volume, setVolume] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      stopTimer();
      cancelWaveform();
    };
  }, []);

  const startTimer = () => {
    timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const drawWaveform = () => {
    if (!analyserRef.current) return;
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    // Average volume
    const sum = dataArray.reduce((a, b) => a + b, 0);
    const avg = sum / dataArray.length;
    setVolume(Math.min(100, (avg / 255) * 100 * 2)); // Boosted for visibility
    
    animationRef.current = requestAnimationFrame(drawWaveform);
  };

  const cancelWaveform = () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (audioContextRef.current) audioContextRef.current.close();
    audioContextRef.current = null;
    analyserRef.current = null;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      drawWaveform();

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        audioBlobRef.current = new Blob(chunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((track) => track.stop());
        cancelWaveform();
        processAudio(audioBlobRef.current);
      };

      mediaRecorder.start();
      setStatus("recording");
      setRecordingTime(0);
      startTimer();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to access microphone";
      setStatus("error");
      if (onError) onError(msg);
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && status === "recording") {
      mediaRecorderRef.current.pause();
      setStatus("paused");
      stopTimer();
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && status === "paused") {
      mediaRecorderRef.current.resume();
      setStatus("recording");
      startTimer();
      drawWaveform();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && (status === "recording" || status === "paused")) {
      mediaRecorderRef.current.stop();
      setStatus("processing");
      stopTimer();
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      // Just stop tracks, don't process
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
    }
    cancelWaveform();
    stopTimer();
    setStatus("idle");
    setRecordingTime(0);
  };

  const processAudio = async (blob: Blob) => {
    setStatus("processing");
    try {
      const formData = new FormData();
      formData.append("file", blob, "recording.webm");

      const res = await fetch("/api/capture", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      const text = data.extractedText || "";
      setTranscript(text);
      setConfidence(data.confidence || 0.95); // Example

      if (autoSubmit && text.trim()) {
        await submitTranscript(text);
      } else {
        setStatus("review");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setStatus("error");
      if (onError) onError(msg);
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  const submitTranscript = async (overrideText?: string) => {
    const finalText = (overrideText ?? transcript).trim();
    if (!finalText) {
      setStatus("idle");
      return;
    }

    setStatus("success");
    if (onSuccess) onSuccess({ text: finalText });
    setTimeout(() => {
      setStatus("idle");
      setTranscript("");
    }, 3000);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="flex flex-col gap-4 p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] shadow-sm">
      <div className="flex items-center gap-4">
        {status === "idle" || status === "error" || status === "success" ? (
          <Button onClick={startRecording} variant="default" size="icon" className="rounded-full w-12 h-12 shrink-0">
            <Mic className="w-5 h-5" />
          </Button>
        ) : (status === "recording" || status === "paused") ? (
          <div className="flex gap-2">
            <Button onClick={status === "recording" ? pauseRecording : resumeRecording} variant="outline" size="icon" className="rounded-full w-10 h-10">
              {status === "recording" ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button onClick={stopRecording} variant="danger" size="icon" className="rounded-full w-12 h-12 animate-pulse">
              <Square className="w-5 h-5" />
            </Button>
            <Button onClick={cancelRecording} variant="ghost" size="icon" className="rounded-full w-10 h-10 text-muted-foreground">
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : status === "processing" ? (
          <Button disabled variant="outline" size="icon" className="rounded-full w-12 h-12 shrink-0">
            <Loader2 className="w-5 h-5 animate-spin" />
          </Button>
        ) : (
          <Button onClick={() => submitTranscript()} variant="default" size="icon" className="rounded-full w-12 h-12 shrink-0">
            <Send className="w-5 h-5" />
          </Button>
        )}

        <div className="flex flex-col flex-1">
          <span className="text-sm font-medium flex items-center gap-2">
            {status === "idle" && "Intelligent Voice Capture"}
            {(status === "recording" || status === "paused") && (
              <>
                <span className={status === "recording" ? "text-red-500 animate-pulse" : "text-muted-foreground"}>
                  ● {formatTime(recordingTime)}
                </span>
                {status === "paused" && <span className="text-xs border px-1 rounded">Paused</span>}
              </>
            )}
            {status === "processing" && "Transcribing & Parsing..."}
            {status === "review" && "Review Transcript"}
            {status === "success" && "Captured successfully!"}
            {status === "error" && "Error capturing audio"}
          </span>
          
          <span className="text-xs text-[var(--color-text-dimmed)]">
            {status === "idle" && "Click to start recording your thoughts. AI will organize it."}
            {(status === "recording" || status === "paused") && (
              <div className="h-2 w-full max-w-[150px] bg-secondary rounded overflow-hidden mt-1 flex items-center">
                <div 
                  className="h-full bg-primary transition-all duration-75" 
                  style={{ width: `${volume}%` }}
                />
              </div>
            )}
            {status === "review" && confidence && (
              <span className="text-green-600">Confidence: {Math.round(confidence * 100)}%</span>
            )}
          </span>
        </div>
      </div>

      {status === "review" && (
        <div className="flex flex-col gap-2 mt-2 pt-2 border-t">
          <textarea
            className="w-full text-sm bg-transparent border rounded p-2 min-h-[80px] focus:ring-1 outline-none"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => audioBlobRef.current && processAudio(audioBlobRef.current)}>
              <RotateCcw className="w-3 h-3 mr-1" /> Retry
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
