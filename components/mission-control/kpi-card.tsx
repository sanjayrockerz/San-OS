"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState, useEffect, type ElementType } from "react";
import { cn } from "@/lib/utils";
import { Sparkline } from "@/components/charts/sparkline";
import {
  Target,
  Flame,
  FolderKanban,
  Wallet,
  Heart,
  GraduationCap,
  Code2,
  Briefcase,
  HeartHandshake,
  Lightbulb,
  Calendar,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import type { WidgetSize, WidgetIconName } from "@/lib/mission-control/dashboard-widgets";

const ICON_MAP: Record<WidgetIconName, LucideIcon> = {
  Target,
  Flame,
  FolderKanban,
  Wallet,
  Heart,
  GraduationCap,
  Code2,
  Briefcase,
  HeartHandshake,
  Lightbulb,
  Calendar,
  TrendingUp,
};

interface KpiCardProps {
  icon: WidgetIconName;
  label: string;
  value: string;
  subtitle: string;
  trend?: number;
  sparklineData?: number[];
  progress?: number;
  insight?: string;
  gradient: string;
  darkGradient: string;
  color: string;
  size?: WidgetSize;
  delay?: number;
}

function CountUp({ value, duration = 1000 }: { value: string; duration?: number }) {
  const num = parseFloat(value.replace(/[^0-9.]/g, ""));
  const suffix = value.replace(/[0-9.]/g, "");
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView || isNaN(num)) return;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(num * eased);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [inView, num, duration]);

  if (isNaN(num)) return <>{value}</>;

  return (
    <span ref={ref}>
      {display.toFixed(num % 1 === 0 ? 0 : 1)}
      {suffix}
    </span>
  );
}

export function KpiCard({
  icon: iconName,
  label,
  value,
  subtitle,
  trend,
  sparklineData,
  progress,
  insight,
  gradient,
  color,
  delay = 0,
}: KpiCardProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const Icon = ICON_MAP[iconName];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.4, delay: delay * 0.04, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-white/10 p-4 backdrop-blur-sm",
        "shadow-lg transition-shadow duration-300 hover:shadow-xl",
      )}
      style={{ background: gradient }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/30" />
      <div className="absolute inset-0 bg-black/5 opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="relative z-10 flex h-full flex-col justify-between gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <Icon className="size-4 text-white" />
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-white/70">
              {label}
            </span>
          </div>
          {trend !== undefined && (
            <span
              className={cn(
                "flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold backdrop-blur-sm",
                trend >= 0 ? "bg-white/20 text-white" : "bg-red-400/30 text-red-200",
              )}
            >
              {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
            </span>
          )}
        </div>

        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-2xl font-bold tracking-tight text-white drop-shadow-sm tabular-nums">
              <CountUp value={value} />
            </p>
            <p className="mt-0.5 text-xs text-white/60 line-clamp-1">{subtitle}</p>
          </div>
          {sparklineData && sparklineData.length > 1 && (
            <div className="shrink-0">
              <Sparkline data={sparklineData} color="rgba(255,255,255,0.5)" width={60} height={28} fill={false} />
            </div>
          )}
        </div>

        {progress !== undefined && (
          <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/20">
            <motion.div
              initial={{ width: 0 }}
              animate={inView ? { width: `${Math.min(progress, 100)}%` } : { width: 0 }}
              transition={{ duration: 0.8, delay: delay * 0.04 + 0.2, ease: "easeOut" }}
              className="h-full rounded-full bg-white/60"
            />
          </div>
        )}

        {insight && (
          <p className="mt-1 text-[11px] leading-tight text-white/70 line-clamp-2">
            {insight}
          </p>
        )}
      </div>
    </motion.div>
  );
}