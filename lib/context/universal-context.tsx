"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
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

  const refreshContext = async () => {
    setContext(prev => ({ ...prev, isLoading: true }));
    try {
      // Typically, you'd fetch from an API route like /api/context?path=${pathname}
      const res = await fetch(`/api/context?path=${encodeURIComponent(pathname || "")}`);
      if (res.ok) {
        const data = await res.json();
        setContext({ ...data, isLoading: false });
      } else {
        setContext(prev => ({ ...prev, isLoading: false }));
      }
    } catch (e) {
      setContext(prev => ({ ...prev, isLoading: false }));
    }
  };

  useEffect(() => {
    refreshContext();
  }, [pathname]);

  return (
    <UniversalContext.Provider value={{ context, refreshContext }}>
      {children}
    </UniversalContext.Provider>
  );
}

export function useUniversalContext() {
  return useContext(UniversalContext);
}
