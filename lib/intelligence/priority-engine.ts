import type { RankedSignal, Signal, PriorityConfig } from "./types";
import { DEFAULT_PRIORITY_CONFIG } from "./types";

export class PriorityEngine {
  private config: PriorityConfig;

  constructor(config?: Partial<PriorityConfig>) {
    this.config = { ...DEFAULT_PRIORITY_CONFIG, ...config };
  }

  rank(signals: Signal[]): RankedSignal[] {
    const now = Date.now();

    const ranked = signals.map((signal) => {
      const domainWeight = this.config.domainWeights[signal.domain] ?? 0.5;

      let urgencyDecay = 0;
      if (signal.expiresAt) {
        const expiryTime = new Date(signal.expiresAt).getTime();
        const remaining = (expiryTime - now) / 3600000;
        urgencyDecay = remaining < 0 ? 0.5 : Math.max(0, 1 - remaining / 168);
      }

      const adjustedUrgency = signal.urgency * (1 + urgencyDecay);
      const adjustedImpact = signal.impact * domainWeight;

      const score =
        adjustedUrgency * this.config.urgencyWeight +
        adjustedImpact * this.config.impactWeight +
        signal.confidence * this.config.confidenceWeight;

      const explanations: string[] = [];
      if (adjustedUrgency > 0.7) explanations.push(`Time-sensitive (urgency: ${Math.round(adjustedUrgency * 100)}%)`);
      if (adjustedImpact > 0.7) explanations.push(`High-impact in ${signal.domain} domain`);
      if (signal.confidence > 0.8) explanations.push(`High-confidence signal`);
      if (urgencyDecay > 0.3) explanations.push(`Expiring soon`);
      if (domainWeight > 1) explanations.push(`Priority domain: ${signal.domain}`);

      const explanation = explanations.length > 0
        ? explanations.join("; ")
        : `Score ${Math.round(score * 100)}/100 from urgency=${Math.round(signal.urgency * 100)}, impact=${Math.round(signal.impact * 100)}, confidence=${Math.round(signal.confidence * 100)}`;

      return {
        ...signal,
        score,
        explanation,
      };
    });

    return ranked.sort((a, b) => b.score - a.score).slice(0, this.config.maxSignals);
  }

  updateConfig(config: Partial<PriorityConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): PriorityConfig {
    return { ...this.config };
  }
}
