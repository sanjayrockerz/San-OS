"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Read-only code display with a language tag, line numbers and copy-to-clipboard.
 * No syntax-highlighting dependency — a clean monospace block keeps the bundle
 * light while staying legible. Highlighting can be layered in later.
 */
export function CodeBlock({
  code,
  language,
  className,
}: {
  code: string;
  language?: string | null;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const lines = code.replace(/\n$/, "").split("\n");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable — ignore.
    }
  };

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-background-subtle",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-border bg-card px-3 py-1.5">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {language || "code"}
        </span>
        <button
          type="button"
          onClick={copy}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          {copied ? (
            <>
              <Check className="size-3" /> Copied
            </>
          ) : (
            <>
              <Copy className="size-3" /> Copy
            </>
          )}
        </button>
      </div>
      <div className="overflow-x-auto">
        <pre className="min-w-full p-0 text-[13px] leading-relaxed">
          <code className="block">
            {lines.map((line, i) => (
              <span key={i} className="flex">
                <span className="select-none border-r border-border px-3 py-0 text-right text-muted-foreground/60">
                  {i + 1}
                </span>
                <span className="whitespace-pre px-3 py-0 font-mono text-foreground/90">
                  {line || " "}
                </span>
              </span>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}
