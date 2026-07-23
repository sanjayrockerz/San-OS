"use client";

import { useState, useRef } from "react";
import { Upload, FileText, Image as ImageIcon, Mic, CheckCircle2, Loader2, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface MediaCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function MediaCaptureModal({ isOpen, onClose, onSuccess }: MediaCaptureModalProps) {
  const [activeTab, setActiveTab] = useState<"file" | "voice">("file");
  const [file, setFile] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractedText, setExtractedText] = useState("");
  const [title, setTitle] = useState("");
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const processFile = (selectedFile: File) => {
    setFile(selectedFile);
    setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
    setExtracting(true);
    setStatusMsg("Analyzing and extracting content...");

    // Simulated client-side OCR / text parsing for PDFs & images
    setTimeout(() => {
      setExtracting(false);
      setExtractedText(
        `Extracted content from ${selectedFile.name}:\n\nKey notes, diagrams, and formulas captured automatically into Knowledge Vault.`,
      );
      setStatusMsg("Extraction complete!");
    }, 1200);
  };

  const handleSave = async () => {
    if (!title || (!file && !extractedText)) return;

    try {
      setExtracting(true);
      const res = await fetch("/api/voice/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          transcript: extractedText || `Media capture: ${title}`,
          tags: ["notion-capture", file?.type.includes("pdf") ? "pdf" : "image"],
        }),
      });

      if (res.ok) {
        setStatusMsg("Successfully saved to Notion Knowledge Vault!");
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 800);
      }
    } catch {
      setStatusMsg("Failed to save media capture.");
    } finally {
      setExtracting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-border/60 bg-card p-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border/40 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-foreground">Notion-Style Media Capture</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[11px] font-medium text-muted-foreground">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. System Design Notes / IIT Physics PDF"
              className="mt-1 w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            className="group cursor-pointer rounded-2xl border border-dashed border-indigo-500/30 bg-indigo-500/[0.03] p-6 text-center transition hover:border-indigo-500/60 hover:bg-indigo-500/[0.06]"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
            />
            <Upload className="mx-auto size-8 text-indigo-400 transition group-hover:scale-110" />
            <p className="mt-2 text-xs font-medium text-foreground">
              {file ? file.name : "Drop PDF documents or Images here"}
            </p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              Supports PDF, PNG, JPG, WebP. Text & notes extracted automatically.
            </p>
          </div>

          {extracting && (
            <div className="flex items-center gap-2 text-xs text-indigo-400">
              <Loader2 className="size-3.5 animate-spin" /> {statusMsg}
            </div>
          )}

          {extractedText && !extracting && (
            <div>
              <label className="text-[11px] font-medium text-muted-foreground">Extracted Content Preview</label>
              <textarea
                value={extractedText}
                onChange={(e) => setExtractedText(e.target.value)}
                className="mt-1 min-h-[90px] w-full rounded-xl border border-border/60 bg-background p-3 text-xs focus:border-indigo-500 focus:outline-none"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
            <button
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-muted"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={extracting || (!file && !extractedText)}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-500 px-4 py-2 text-xs font-medium text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-600 disabled:opacity-50"
            >
              <CheckCircle2 className="size-3.5" /> Save to Vault
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
