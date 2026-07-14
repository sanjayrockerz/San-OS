"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

export interface UniversalContextState {
  currentClient: { id: string; name: string } | null;
  currentProject: { id: string; name: string } | null;
  currentTask: { id: string; name: string } | null;
  nextDeadline: Date | null;
  relatedResourcesCount: number;
  openRisksCount: number;
  recentMeetingsCount: number;
  isLoading: boolean;
}

const defaultState: UniversalContextState = {
  currentClient: null,
  currentProject: null,
  currentTask: null,
  nextDeadline: null,
  relatedResourcesCount: 0,
  openRisksCount: 0,
  recentMeetingsCount: 0,
  isLoading: true,
};

const UniversalContext = createContext<{
  context: UniversalContextState;
  refreshContext: () => void;
}>({
  context: defaultState,
  refreshContext: () => {},
});

export function UniversalContextProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [context, setContext] = useState<UniversalContextState>(defaultState);

  const refreshContext = useCallback(async () => {
    setContext(prev => ({ ...prev, isLoading: true }));
    const controller = new AbortController();
    try {
      // Typically, you'd fetch from an API route like /api/context?path=${pathname}
      const res = await fetch(`/api/context?path=${encodeURIComponent(pathname || "")}`, {
        signal: controller.signal,
      });
      if (res.ok) {
        const data = await res.json();
        setContext({ ...data, isLoading: false });
      } else {
        setContext(prev => ({ ...prev, isLoading: false }));
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      setContext(prev => ({ ...prev, isLoading: false }));
    }
    return () => controller.abort();
  }, [pathname]);

  useEffect(() => {
    let timeout: number | undefined;
    const schedule = () => { timeout = window.setTimeout(() => void refreshContext(), 120); };
    if ("requestIdleCallback" in window) {
      const idle = window.requestIdleCallback(schedule, { timeout: 800 });
      return () => { window.cancelIdleCallback(idle); if (timeout) window.clearTimeout(timeout); };
    }
    schedule();
    return () => { if (timeout) window.clearTimeout(timeout); };
  }, [refreshContext, pathname]);

  return (
    <UniversalContext.Provider value={{ context, refreshContext }}>
      {children}
    </UniversalContext.Provider>
  );
}

export function useUniversalContext() {
  return useContext(UniversalContext);
}
