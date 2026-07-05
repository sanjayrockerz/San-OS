"use client";

import { useState, useRef } from "react";
import { UploadCloud, FileText, Image as ImageIcon, Link2, FileAudio, Check, Loader2, X } from "lucide-react";
import { Button } from "./button";

export function UniversalCapture() {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [successText, setSuccessText] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFile(e.dataTransfer.files[0]);
    } else {
      const text = e.dataTransfer.getData("text");
      if (text) await processText(text);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFile(e.target.files[0]);
    }
  };

  const processText = async (text: string) => {
    setIsUploading(true);
    try {
      const res = await fetch("/api/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text, type: "text" }),
      });
      if (res.ok) {
        showSuccess("Text captured!");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsUploading(false);
    }
  };

  const processFile = async (file: File) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/capture", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        showSuccess(`Captured 1 ${data.category ?? "item"}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessText(msg);
    setTimeout(() => setSuccessText(null), 3000);
  };

  return (
    <div 
      className={`relative w-full p-6 border-2 border-dashed rounded-xl transition-colors flex flex-col items-center justify-center min-h-[140px] text-center
        ${isDragging ? "border-primary bg-primary/5" : "border-border hover:border-border/80 bg-card"}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input 
        type="file" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileSelect}
        accept="image/*,video/*,audio/*,application/pdf" 
      />

      {isUploading ? (
        <div className="flex flex-col items-center gap-3 text-muted-foreground animate-pulse">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-sm font-medium">Processing capture...</span>
        </div>
      ) : successText ? (
        <div className="flex flex-col items-center gap-3 text-green-500">
          <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
            <Check className="w-5 h-5" />
          </div>
          <span className="text-sm font-medium">{successText}</span>
        </div>
      ) : (
        <>
          <div className="flex gap-4 mb-4 text-muted-foreground/60">
            <ImageIcon className="w-6 h-6" />
            <FileText className="w-6 h-6" />
            <Link2 className="w-6 h-6" />
            <FileAudio className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-medium mb-1">Universal Capture</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Drag & drop anything here, paste text, or click to browse.
          </p>
          <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
            Browse Files
          </Button>
        </>
      )}
    </div>
  );
}
