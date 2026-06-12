"use client";

import { useSyncExternalStore } from "react";

/** Subscribe to a CSS media query. Returns false during SSR. */
export function useMediaQuery(query: string): boolean {
  function subscribe(callback: () => void) {
    const mql = window.matchMedia(query);
    mql.addEventListener("change", callback);
    return () => mql.removeEventListener("change", callback);
  }

  const getSnapshot = () => window.matchMedia(query).matches;
  const getServerSnapshot = () => false;

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
