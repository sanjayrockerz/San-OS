import { create } from "zustand";

import type { Database } from "@/types/database";

type FocusMode = Database["public"]["Enums"]["focus_mode"];

/**
 * Global UI state for the app shell — only ephemeral interface state (command
 * palette, sidebar, the Add Learning Entry modal, mobile nav drawer,
 * notification panel, focus mode display). No domain data flows here —
 * notification rows and the
 * persisted focus mode preference are server-sourced; this store only mirrors
 * them for instant UI feedback.
 */
export type PostActionVariant =
  | "after-solve"
  | "after-concept"
  | "after-vault"
  | "after-iit";

export interface PostActionState {
  variant: PostActionVariant;
  entityId: string;
  entityTitle: string;
}

interface UIState {
  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;
  toggleCommand: () => void;

  addEntryOpen: boolean;
  setAddEntryOpen: (open: boolean) => void;

  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;

  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  contextDrawerOpen: boolean;
  toggleContextDrawer: () => void;

  postActionPrompt: PostActionState | null;
  setPostActionPrompt: (prompt: PostActionState | null) => void;

  notificationPanelOpen: boolean;
  setNotificationPanelOpen: (open: boolean) => void;

  /** Optimistic mirror of user_preferences.default_focus_mode; hydrated from server props. */
  focusModeDisplay: FocusMode;
  setFocusModeDisplay: (mode: FocusMode) => void;
}

export const useUIStore = create<UIState>((set) => ({
  commandOpen: false,
  setCommandOpen: (commandOpen) => set({ commandOpen }),
  toggleCommand: () => set((s) => ({ commandOpen: !s.commandOpen })),

  addEntryOpen: false,
  setAddEntryOpen: (addEntryOpen) => set({ addEntryOpen }),

  mobileNavOpen: false,
  setMobileNavOpen: (mobileNavOpen) => set({ mobileNavOpen }),

  sidebarCollapsed: typeof window !== "undefined"
    ? localStorage.getItem("san-os:sidebar-collapsed") === "true"
    : false,
  toggleSidebar: () =>
    set((s) => {
      const next = !s.sidebarCollapsed;
      if (typeof window !== "undefined") {
        localStorage.setItem("san-os:sidebar-collapsed", String(next));
      }
      return { sidebarCollapsed: next };
    }),

  contextDrawerOpen: false,
  toggleContextDrawer: () => set((s) => ({ contextDrawerOpen: !s.contextDrawerOpen })),

  postActionPrompt: null,
  setPostActionPrompt: (postActionPrompt) => set({ postActionPrompt }),

  notificationPanelOpen: false,
  setNotificationPanelOpen: (notificationPanelOpen) => set({ notificationPanelOpen }),

  focusModeDisplay: "none",
  setFocusModeDisplay: (focusModeDisplay) => set({ focusModeDisplay }),
}));
