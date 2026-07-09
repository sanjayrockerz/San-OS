"use client";

import { useEffect, useState } from "react";
import type { TimeOfDay } from "@/lib/mission-control/hero-theme-engine";

interface AnimatedBackgroundProps {
  timeOfDay: TimeOfDay;
}

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
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
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={`cloud-${i}`}
          className="absolute h-12 rounded-full bg-white/10 blur-xl"
          style={{
            width: `${60 + Math.random() * 120}px`,
            top: `${10 + Math.random() * 40}%`,
            left: `${Math.random() * 100}%`,
            animation: `cloud-drift ${15 + Math.random() * 20}s linear infinite`,
            animationDelay: `${Math.random() * 10}s`,
          }}
        />
      ))}
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={`bird-${i}`}
          className="absolute size-1 rounded-full bg-orange-300/40"
          style={{
            top: `${5 + Math.random() * 25}%`,
            left: `${Math.random() * 100}%`,
            animation: `bird-fly ${8 + Math.random() * 12}s linear infinite`,
            animationDelay: `${Math.random() * 15}s`,
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
      {Array.from({ length: 15 }).map((_, i) => (
        <div
          key={`particle-${i}`}
          className="absolute size-1.5 rounded-full bg-sky-300/30"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animation: `float-particle ${6 + Math.random() * 8}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 10}s`,
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
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={`glow-${i}`}
          className="absolute size-2 rounded-full bg-orange-400/20"
          style={{
            top: `${Math.random() * 60}%`,
            left: `${Math.random() * 100}%`,
            animation: `sunset-particle ${5 + Math.random() * 7}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 8}s`,
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
      {Array.from({ length: 50 }).map((_, i) => (
        <div
          key={`star-${i}`}
          className="absolute rounded-full bg-white"
          style={{
            width: `${1 + Math.random() * 2.5}px`,
            height: `${1 + Math.random() * 2.5}px`,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animation: `twinkle ${3 + Math.random() * 5}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 6}s`,
            opacity: 0.3 + Math.random() * 0.7,
          }}
        />
      ))}
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={`bright-star-${i}`}
          className="absolute rounded-full bg-white/90"
          style={{
            width: `${1.5 + Math.random()}px`,
            height: `${1.5 + Math.random()}px`,
            top: `${10 + Math.random() * 30}%`,
            left: `${Math.random() * 60}%`,
            boxShadow: "0 0 6px 2px rgba(255,255,255,0.3)",
            animation: `twinkle ${4 + Math.random() * 4}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 4}s`,
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