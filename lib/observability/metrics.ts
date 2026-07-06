interface MetricPoint {
  timestamp: string;
  value: number;
  tags?: Record<string, string>;
}

interface MetricSeries {
  name: string;
  points: MetricPoint[];
  unit: string;
  description: string;
}

class MetricsCollector {
  private readonly series = new Map<string, MetricSeries>();
  private readonly maxPointsPerSeries = 500;

  gauge(name: string, value: number, tags?: Record<string, string>): void {
    this.record(name, value, "gauge", tags);
  }

  count(name: string, value = 1, tags?: Record<string, string>): void {
    this.record(name, value, "count", tags);
  }

  timing(name: string, durationMs: number, tags?: Record<string, string>): void {
    this.record(name, durationMs, "ms", tags);
  }

  getSeries(name: string): MetricSeries | undefined {
    return this.series.get(name);
  }

  getAllSeries(): MetricSeries[] {
    return [...this.series.values()];
  }

  getSummary(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const summary: Record<string, { avg: number; min: number; max: number; count: number }> = {};
    for (const [name, series] of this.series) {
      const values = series.points.map((p) => p.value);
      summary[name] = {
        avg: values.reduce((s, v) => s + v, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        count: values.length,
      };
    }
    return summary;
  }

  reset(): void {
    this.series.clear();
  }

  private record(name: string, value: number, unit: string, tags?: Record<string, string>): void {
    let series = this.series.get(name);
    if (!series) {
      series = { name, points: [], unit, description: "" };
      this.series.set(name, series);
    }

    series.points.push({ timestamp: new Date().toISOString(), value, tags });
    if (series.points.length > this.maxPointsPerSeries) series.points.shift();
  }
}

export const metrics = new MetricsCollector();
