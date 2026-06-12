import { cn } from "@/lib/utils";
import { getPatternById } from "@/lib/utils/patterns";

interface PatternBadgeProps {
  patternId: string;
  size?: "sm" | "md";
  withEmoji?: boolean;
  className?: string;
}

export function PatternBadge({
  patternId,
  size = "sm",
  withEmoji = false,
  className,
}: PatternBadgeProps) {
  const pattern = getPatternById(patternId);
  if (!pattern) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-xs",
        className
      )}
      style={{ backgroundColor: pattern.tint, color: pattern.color }}
    >
      {withEmoji && <span aria-hidden>{pattern.emoji}</span>}
      {pattern.name}
    </span>
  );
}
