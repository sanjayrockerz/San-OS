"use client";

import { useEffect, useState } from "react";
import { AlertCircle, RotateCcw, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { useDraftStore } from "@/store/draft-store";

export function DraftRecoveryBanner({
  type,
  id,
  onRestore,
}: {
  type: "concept" | "vault" | "reflection" | "algorithm";
  id: string; // The ID of the page we are on, e.g., problemId or conceptId
  onRestore: (content: string) => void;
}) {
  const store = useDraftStore();
  const [show, setShow] = useState(false);

  let draft = null;
  switch (type) {
    case "concept":
      draft = store.conceptDraft;
      break;
    case "vault":
      draft = store.vaultDraft;
      break;
    case "reflection":
      draft = store.reflectionDraft;
      break;
    case "algorithm":
      draft = store.algorithmDraft;
      break;
  }

  // Only show if there is a draft for this specific ID and it has content
  useEffect(() => {
    if (draft && draft.id === id && draft.content) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShow(true);
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShow(false);
    }
  }, [draft, id]);

  if (!show || !draft) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0, scale: 0.95 }}
        className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border border-warning/30 bg-warning/10 p-3 text-warning-foreground"
      >
        <div className="flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          <p className="text-sm font-medium">
            Unsaved draft from {new Date(draft.savedAt).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            size="sm"
            variant="outline"
            className="w-full sm:w-auto border-warning/50 text-warning-foreground hover:bg-warning/20"
            onClick={() => {
              onRestore(draft.content);
              setShow(false);
            }}
          >
            <RotateCcw className="mr-2 size-3" />
            Restore
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="shrink-0 hover:bg-warning/20"
            onClick={() => {
              store.clearDraft(type);
              setShow(false);
            }}
            title="Discard draft"
          >
            <X className="size-4" />
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
