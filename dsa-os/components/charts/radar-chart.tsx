"use client";

interface RadarDatum {
  label: string;
  value: number; // 0-100
}

interface RadarChartProps {
  data: RadarDatum[];
  size?: number;
  color?: string;
}

export function RadarChart({ data, size = 220, color = "var(--primary)" }: RadarChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 28;
  const n = data.length;
  const rings = [0.25, 0.5, 0.75, 1];

  const point = (i: number, r: number) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r] as const;
  };

  const ringPath = (scale: number) =>
    data
      .map((_, i) => {
        const [x, y] = point(i, radius * scale);
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ") + "Z";

  const valuePath =
    data
      .map((d, i) => {
        const [x, y] = point(i, radius * (d.value / 100));
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ") + "Z";

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
      <defs>
        <radialGradient id="radarFill" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity="0.45" />
          <stop offset="100%" stopColor={color} stopOpacity="0.12" />
        </radialGradient>
      </defs>

      {/* grid rings */}
      {rings.map((s, i) => (
        <path key={i} d={ringPath(s)} fill="none" stroke="var(--border)" strokeWidth={1} />
      ))}

      {/* spokes */}
      {data.map((_, i) => {
        const [x, y] = point(i, radius);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--border)" strokeWidth={1} />;
      })}

      {/* value polygon */}
      <path d={valuePath} fill="url(#radarFill)" stroke={color} strokeWidth={2} strokeLinejoin="round" />
      {data.map((d, i) => {
        const [x, y] = point(i, radius * (d.value / 100));
        return <circle key={i} cx={x} cy={y} r={3} fill={color} />;
      })}

      {/* labels */}
      {data.map((d, i) => {
        const [x, y] = point(i, radius + 16);
        return (
          <text
            key={i}
            x={x}
            y={y}
            textAnchor={Math.abs(x - cx) < 4 ? "middle" : x > cx ? "start" : "end"}
            dominantBaseline="middle"
            className="fill-muted-foreground text-[9px] font-medium"
          >
            {d.label}
          </text>
        );
      })}
    </svg>
  );
}
