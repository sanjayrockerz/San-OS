"use client";

import { useEffect, useState } from "react";
import type { TimeOfDay } from "@/lib/mission-control/hero-theme-engine";

interface AnimatedBackgroundProps {
  timeOfDay: TimeOfDay;
}

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return reduced;
}

function MorningBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-20 left-1/2 size-96 -translate-x-1/2 rounded-full bg-gradient-radial from-orange-300/20 via-amber-200/10 to-transparent blur-3xl" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={`cloud-${i}`}
          className="absolute h-12 rounded-full bg-white/10 blur-xl"
          style={{
            width: `${72 + (i * 31) % 96}px`,
            top: `${12 + i * 11}%`,
            left: `${8 + i * 23}%`,
            animation: `cloud-drift ${18 + i * 3}s linear infinite`,
            animationDelay: `${i * 1.7}s`,
          }}
        />
      ))}
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={`bird-${i}`}
          className="absolute size-1 rounded-full bg-orange-300/40"
          style={{
            top: `${8 + i * 6}%`,
            left: `${15 + i * 19}%`,
            animation: `bird-fly ${10 + i * 2}s linear infinite`,
            animationDelay: `${i * 2}s`,
          }}
        />
      ))}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-orange-400/10 to-transparent" />
    </div>
  );
}

function AfternoonBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-32 right-1/4 size-80 rounded-full bg-gradient-radial from-sky-300/15 via-blue-200/8 to-transparent blur-3xl" />
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={`particle-${i}`}
          className="absolute size-1.5 rounded-full bg-sky-300/30"
          style={{
            top: `${8 + (i * 17) % 84}%`,
            left: `${6 + (i * 29) % 90}%`,
            animation: `float-particle ${7 + i}s ease-in-out infinite`,
            animationDelay: `${i * 1.2}s`,
          }}
        />
      ))}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-sky-400/8 to-transparent" />
    </div>
  );
}

function EveningBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-10 left-1/3 size-96 -translate-x-1/2 rounded-full bg-gradient-radial from-orange-400/20 via-pink-400/10 to-transparent blur-3xl" />
      <div className="absolute -top-10 right-1/4 size-64 rounded-full bg-gradient-radial from-pink-500/15 to-transparent blur-3xl" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={`glow-${i}`}
          className="absolute size-2 rounded-full bg-orange-400/20"
          style={{
            top: `${10 + i * 10}%`,
            left: `${12 + i * 18}%`,
            animation: `sunset-particle ${6 + i}s ease-in-out infinite`,
            animationDelay: `${i * 1.5}s`,
          }}
        />
      ))}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-orange-500/15 via-pink-500/8 to-transparent" />
    </div>
  );
}

function NightBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 18 }).map((_, i) => (
        <div
          key={`star-${i}`}
          className="absolute rounded-full bg-white"
          style={{
            width: `${1 + (i % 3) * 0.5}px`,
            height: `${1 + (i % 3) * 0.5}px`,
            top: `${5 + (i * 13) % 90}%`,
            left: `${4 + (i * 23) % 92}%`,
            animation: `twinkle ${3 + (i % 5)}s ease-in-out infinite`,
            animationDelay: `${(i % 6) * 0.6}s`,
            opacity: 0.35 + (i % 5) * 0.12,
          }}
        />
      ))}
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={`bright-star-${i}`}
          className="absolute rounded-full bg-white/90"
          style={{
            width: `${1.5 + (i % 2) * 0.5}px`,
            height: `${1.5 + (i % 2) * 0.5}px`,
            top: `${12 + i * 9}%`,
            left: `${12 + i * 17}%`,
            boxShadow: "0 0 6px 2px rgba(255,255,255,0.3)",
            animation: `twinkle ${4 + i}s ease-in-out infinite`,
            animationDelay: `${i * 0.8}s`,
          }}
        />
      ))}
      <div className="absolute -top-20 right-1/4 size-48 rounded-full bg-gradient-radial from-indigo-400/8 via-purple-500/5 to-transparent blur-3xl" />
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-purple-900/30 to-transparent" />
    </div>
  );
}

export function AnimatedBackground({ timeOfDay }: AnimatedBackgroundProps) {
  const reduced = useReducedMotion();

  if (reduced) return null;

  switch (timeOfDay) {
    case "morning":
      return <MorningBackground />;
    case "afternoon":
      return <AfternoonBackground />;
    case "evening":
      return <EveningBackground />;
    case "night":
      return <NightBackground />;
  }
}
