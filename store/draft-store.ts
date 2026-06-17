import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface DraftState {
  id: string; // The ID of the problem or concept this draft is for, or "new"
  content: string;
  savedAt: string;
  entityId?: string; // Optional context like a related problem ID
}

interface DraftStore {
  conceptDraft: DraftState | null;
  vaultDraft: DraftState | null;
  reflectionDraft: DraftState | null;
  algorithmDraft: DraftState | null;

  saveDraft: (type: "concept" | "vault" | "reflection" | "algorithm", draft: DraftState) => void;
  clearDraft: (type: "concept" | "vault" | "reflection" | "algorithm") => void;
}

export const useDraftStore = create<DraftStore>()(
  persist(
    (set) => ({
      conceptDraft: null,
      vaultDraft: null,
      reflectionDraft: null,
      algorithmDraft: null,

      saveDraft: (type, draft) => {
        set((state) => {
          switch (type) {
            case "concept":
              return { conceptDraft: draft };
            case "vault":
              return { vaultDraft: draft };
            case "reflection":
              return { reflectionDraft: draft };
            case "algorithm":
              return { algorithmDraft: draft };
          }
        });
      },
      clearDraft: (type) => {
        set((state) => {
          switch (type) {
            case "concept":
              return { conceptDraft: null };
            case "vault":
              return { vaultDraft: null };
            case "reflection":
              return { reflectionDraft: null };
            case "algorithm":
              return { algorithmDraft: null };
          }
        });
      },
    }),
    {
      name: "sanos_draft_storage", // unique name
    }
  )
);
