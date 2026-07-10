"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Zap } from "lucide-react";
import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { AnimatedBackground } from "./animated-background";
import type { HeroTheme } from "@/lib/mission-control/hero-theme-engine";

interface MissionHeroV2Props {
  theme: HeroTheme;
  time: string;
  coachInsight?: string;
  estimatedMinutes: number;
  priorityCount: number;
  mission?: string;
  planner: { currentTitle: string | null; currentWindow: string | null; completionRate: number };
}

export function MissionHeroV2({
  theme,
  time,
  coachInsight,
  estimatedMinutes,
  priorityCount,
  mission,
  planner,
}: MissionHeroV2Props) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const heroScale = useTransform(scrollY, [0, 300], [1, 0.85]);
  const heroOpacity = useTransform(scrollY, [0, 200], [1, 0]);
  const greetingY = useTransform(scrollY, [0, 150], [0, -20]);
  const greetingOpacity = useTransform(scrollY, [0, 150], [1, 0]);

  return (
    <motion.div
      ref={ref}
      style={{ scale: heroScale, opacity: heroOpacity }}
      className="relative mx-auto mb-5 w-full overflow-hidden rounded-3xl sm:mb-6"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: theme.backgroundGradient }}
      />
      <AnimatedBackground timeOfDay={theme.timeOfDay} />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/10" />

      <div
        className="relative z-10 flex h-[220px] flex-col justify-between p-4 sm:h-[250px] sm:p-5 md:h-[280px] md:p-6"
      >
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-medium text-white/80 backdrop-blur-sm">
            <Zap className="size-3 text-white/70" />
            Mission Control
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-medium text-white/80 backdrop-blur-sm">
            <span className="size-1.5 animate-pulse rounded-full bg-green-400" />
            {time}
          </div>
        </div>

        <motion.div
          style={{ y: greetingY, opacity: greetingOpacity }}
          className="space-y-1.5"
        >
          <p className="text-xl font-bold leading-tight text-white drop-shadow-lg sm:text-2xl md:text-3xl">
            {theme.greeting}
          </p>
          {mission && <p className="max-w-xl text-sm font-medium text-white/90 sm:text-base">{mission}</p>}
          {coachInsight && (
            <p className="max-w-lg text-sm leading-snug text-white/70 sm:text-base">
              {coachInsight}
            </p>
          )}
        </motion.div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/execution" className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-white px-3.5 text-xs font-semibold text-slate-900 shadow-lg transition-transform hover:scale-[1.02]">
            <Play className="size-3.5 fill-current" /> {planner.currentTitle ? "Continue working" : "Design my day"} <ArrowRight className="size-3.5" />
          </Link>
          {estimatedMinutes > 0 && (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs text-white/80 backdrop-blur-sm">
              <Zap className="size-3" />
              {estimatedMinutes} min planned
            </div>
          )}
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs text-white/80 backdrop-blur-sm">
            {priorityCount} {priorityCount === 1 ? "priority" : "priorities"}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
