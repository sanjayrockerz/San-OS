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

export function KpiCard({
  icon: iconName,
  label,
  value,
  subtitle,
  trend,
  sparklineData,
  progress,
  insight,
  color,
}: KpiCardProps) {
  const Icon = ICON_MAP[iconName];

  return (
    <div
      className="group relative min-h-[152px] overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md"
      style={{ borderTopColor: `${color}55` }}
    >
      <div className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: color }} />
      <div className="relative z-10 flex h-full flex-col justify-between gap-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-xl" style={{ backgroundColor: `${color}18` }}>
              <Icon className="size-4" style={{ color }} />
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {label}
            </span>
          </div>
          {trend !== undefined && (
            <span
              className={cn(
                "flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                trend >= 0 ? "bg-success/10 text-success" : "bg-danger/10 text-danger",
              )}
            >
              {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
            </span>
          )}
        </div>

        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-2xl font-semibold tracking-tight text-foreground tabular-nums">{value}</p>
            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{subtitle}</p>
          </div>
          {sparklineData && sparklineData.length > 1 && (
            <div className="shrink-0">
              <Sparkline data={sparklineData} color={color} width={64} height={28} fill={false} />
            </div>
          )}
        </div>

        {progress !== undefined && (
          <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full" style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: color }} />
          </div>
        )}

        {insight && (
          <p className="mt-1 line-clamp-2 text-[11px] leading-tight text-muted-foreground">
            {insight}
          </p>
        )}
      </div>
    </div>
  );
}
