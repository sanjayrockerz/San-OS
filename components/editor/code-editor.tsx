"use client";

import React, { useState, useRef, useTransition } from "react";
import Editor, { useMonaco, type Monaco } from "@monaco-editor/react";
import { Loader2, Sparkles, Wand2, Bug, Code2, Check, X, PanelRightClose, PanelRightOpen } from "lucide-react";
import ReactMarkdown from "react-markdown";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { askCodeAssistant, type AiAssistantAction, type AiAssistantResponse } from "@/app/(app)/problems/ai-actions";

export interface CodeEditorProps {
  /** Initial code value */
  defaultValue?: string;
  /** Current code value (if controlled) */
  value?: string;
  /** Language identifier (e.g. "python", "typescript") */
  language?: string;
  /** Height of the editor container */
  height?: string | number;
  /** Minimum height of the editor */
  minHeight?: string | number;
  /** Whether the editor is read-only */
  readOnly?: boolean;
  /** Called when the code changes */
  onChange?: (value: string | undefined) => void;
  /** Form name for a hidden input containing the current code */
  name?: string;
  /** Additional CSS classes */
  className?: string;
}

export function CodeEditor({
  defaultValue,
  value,
  language = "typescript",
  height = "400px",
  minHeight = "400px",
  readOnly = false,
  onChange,
  name,
  className,
}: CodeEditorProps) {
  const monaco = useMonaco();
  const [currentValue, setCurrentValue] = useState(value ?? defaultValue ?? "");
  
  // AI Assistant state
  const [panelOpen, setPanelOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [aiResponse, setAiResponse] = useState<AiAssistantResponse | null>(null);

  // Monaco theme setup
  React.useEffect(() => {
    if (monaco) {
      monaco.editor.defineTheme("custom-dark", {
        base: "vs-dark",
        inherit: true,
        rules: [
          { token: "", background: "09090b" }, // matches Tailwind bg-background roughly
        ],
        colors: {
          "editor.background": "#09090b",
          "editor.lineHighlightBackground": "#ffffff0a",
          "editorLineNumber.foreground": "#52525b",
          "editor.selectionBackground": "#27272a",
        },
      });
      monaco.editor.setTheme("custom-dark");
    }
  }, [monaco]);

  const handleEditorChange = (val: string | undefined) => {
    const newVal = val ?? "";
    setCurrentValue(newVal);
    if (onChange) {
      onChange(newVal);
    }
  };

  const runAiAction = (action: AiAssistantAction) => {
    setPanelOpen(true);
    setAiResponse(null);
    startTransition(async () => {
      const result = await askCodeAssistant(action, currentValue, language);
      setAiResponse(result);
    });
  };

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border border-border bg-[#09090b] shadow-sm",
        className
      )}
      style={{ minHeight, height }}
    >
      {/* Hidden input for form integrations */}
      {name && <input type="hidden" name={name} value={currentValue} />}

      {/* Top Toolbar */}
      <div className="flex h-10 items-center justify-between border-b border-border bg-[#09090b] px-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {language}
          </span>
        </div>
        <div className="flex items-center gap-1.5 opacity-60 transition-opacity group-hover:opacity-100">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
            onClick={() => runAiAction("explain")}
          >
            <Wand2 className="mr-1.5 size-3" /> Explain
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
            onClick={() => runAiAction("bug")}
          >
            <Bug className="mr-1.5 size-3" /> Find Bugs
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
            onClick={() => setPanelOpen(!panelOpen)}
          >
            {panelOpen ? <PanelRightClose className="size-3.5" /> : <PanelRightOpen className="size-3.5" />}
          </Button>
        </div>
      </div>

      {/* Main Workspace: Editor + Side Panel */}
      <div className="flex flex-1 overflow-hidden relative">
        <div className={cn("flex-1 overflow-hidden", panelOpen ? "hidden md:block w-full md:w-2/3 lg:w-3/4" : "w-full")}>
          <Editor
            height="100%"
            language={language.toLowerCase()}
            theme="custom-dark"
            value={currentValue}
            onChange={handleEditorChange}
            options={{
              minimap: { enabled: true, scale: 0.75 },
              fontSize: 13,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              lineHeight: 1.6,
              padding: { top: 16, bottom: 16 },
              smoothScrolling: true,
              cursorBlinking: "smooth",
              cursorSmoothCaretAnimation: "on",
              formatOnPaste: true,
              readOnly,
              wordWrap: "on",
              scrollBeyondLastLine: false,
            }}
            loading={
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <Loader2 className="size-5 animate-spin" />
              </div>
            }
          />
        </div>

        {/* AI Assistant Panel */}
        {panelOpen && (
          <div className="absolute inset-y-0 right-0 z-10 w-full md:static md:w-1/3 lg:w-1/4 border-l border-border bg-[#0c0c0e] flex flex-col shadow-xl md:shadow-none">
            <div className="flex h-10 shrink-0 items-center justify-between border-b border-border px-3 bg-[#09090b]">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                <Sparkles className="size-3" /> AI Assistant
              </span>
              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar text-sm">
              {pending ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                  <Loader2 className="size-6 animate-spin text-primary" />
                  <p className="text-xs">Analyzing code...</p>
                </div>
              ) : aiResponse ? (
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{aiResponse.markdown}</ReactMarkdown>
                  {aiResponse.suggestedAction && (
                    <div className="mt-6 rounded-lg border border-primary/20 bg-primary/5 p-3">
                      <p className="text-xs font-semibold text-primary mb-1">Suggested Action</p>
                      <p className="text-xs text-muted-foreground">{aiResponse.suggestedAction}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-70">
                  <div className="size-10 rounded-full bg-secondary/50 flex items-center justify-center">
                    <Sparkles className="size-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">How can I help?</p>
                    <p className="text-xs text-muted-foreground mt-1 px-4">
                      Select an action from the toolbar to analyze your code.
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2 mt-2 w-full px-2">
                    <Button variant="secondary" size="sm" className="h-7 text-[10px]" onClick={() => runAiAction("optimize")}>
                      Optimize
                    </Button>
                    <Button variant="secondary" size="sm" className="h-7 text-[10px]" onClick={() => runAiAction("tests")}>
                      Generate Tests
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
