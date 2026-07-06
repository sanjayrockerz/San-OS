interface TraceSpan {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  tags: Record<string, unknown>;
  children: TraceSpan[];
}

interface Trace {
  id: string;
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  spans: TraceSpan[];
  tags: Record<string, unknown>;
}

class Tracer {
  private readonly traces = new Map<string, Trace>();
  private readonly maxTraces = 500;

  startTrace(name: string, tags?: Record<string, unknown>): string {
    const id = crypto.randomUUID();
    this.traces.set(id, {
      id,
      name,
      startTime: performance.now(),
      spans: [],
      tags: tags ?? {},
    });

    if (this.traces.size > this.maxTraces) {
      const oldest = [...this.traces.entries()].sort(
        (a, b) => a[1].startTime - b[1].startTime,
      )[0];
      if (oldest) this.traces.delete(oldest[0]);
    }

    return id;
  }

  endTrace(traceId: string): void {
    const trace = this.traces.get(traceId);
    if (!trace) return;
    trace.endTime = performance.now();
    trace.duration = trace.endTime - trace.startTime;
  }

  startSpan(traceId: string, name: string, tags?: Record<string, unknown>): string {
    const trace = this.traces.get(traceId);
    if (!trace) return "";

    const span: TraceSpan = {
      name,
      startTime: performance.now(),
      tags: tags ?? {},
      children: [],
    };

    if (trace.spans.length > 0) {
      const parent = trace.spans[trace.spans.length - 1];
      parent.children.push(span);
    } else {
      trace.spans.push(span);
    }

    return name;
  }

  endSpan(traceId: string, spanName: string): void {
    const trace = this.traces.get(traceId);
    if (!trace) return;

    const findSpan = (spans: TraceSpan[]): TraceSpan | undefined => {
      for (const span of spans) {
        if (span.name === spanName && !span.endTime) return span;
        const found = findSpan(span.children);
        if (found) return found;
      }
      return undefined;
    };

    const span = findSpan(trace.spans);
    if (span) {
      span.endTime = performance.now();
      span.duration = span.endTime - span.startTime;
    }
  }

  getTrace(traceId: string): Trace | undefined {
    return this.traces.get(traceId);
  }

  getRecentTraces(limit = 20): Trace[] {
    return [...this.traces.values()]
      .sort((a, b) => b.startTime - a.startTime)
      .slice(0, limit);
  }

  getSlowTraces(thresholdMs = 1000): Trace[] {
    return [...this.traces.values()]
      .filter((t) => (t.duration ?? 0) > thresholdMs)
      .sort((a, b) => (b.duration ?? 0) - (a.duration ?? 0));
  }

  clear(): void {
    this.traces.clear();
  }
}

export const tracer = new Tracer();
