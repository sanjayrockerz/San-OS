import { create } from "zustand";

/**
 * Global UI state for the app shell — only ephemeral interface state (command
 * palette, sidebar, the Add Learning Entry modal). No domain data flows here.
 */
interface UIState {
  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;
  toggleCommand: () => void;

  addEntryOpen: boolean;
  setAddEntryOpen: (open: boolean) => void;

  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  commandOpen: false,
  setCommandOpen: (commandOpen) => set({ commandOpen }),
  toggleCommand: () => set((s) => ({ commandOpen: !s.commandOpen })),

  addEntryOpen: false,
  setAddEntryOpen: (addEntryOpen) => set({ addEntryOpen }),

  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}));
