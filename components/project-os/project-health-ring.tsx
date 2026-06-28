"use client";

interface Props {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const SIZE_MAP = {
  sm: { size: 28, stroke: 3, r: 10 },
  md: { size: 48, stroke: 4, r: 18 },
  lg: { size: 72, stroke: 5, r: 28 },
};

function scoreColor(score: number) {
  if (score >= 80) return "#10b981";
  if (score >= 60) return "#f59e0b";
  if (score >= 40) return "#f97316";
  return "#ef4444";
}

export function ProjectHealthRing({ score, size = "md", showLabel = false }: Props) {
  const { size: px, stroke, r } = SIZE_MAP[size];
  const center = px / 2;
  const circumference = 2 * Math.PI * r;
  const filled = circumference * (score / 100);
  const color = scoreColor(score);

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={px} height={px} viewBox={`0 0 ${px} ${px}`} className="-rotate-90">
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-white/10"
        />
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={`${filled} ${circumference}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.5s ease" }}
        />
      </svg>
      {showLabel && (
        <span className="text-xs font-medium" style={{ color }}>
          {score}
        </span>
      )}
    </div>
  );
}
