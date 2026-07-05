import type { Repositories } from "@/lib/repositories";
import { EventBus } from "@/lib/event-bus";
import { PriorityEngine } from "./priority-engine";
import type { SignalProvider, IntelligenceRecommendation, LifeIntelligenceSnapshot, MissionControlEntry, RankedSignal } from "./types";
import { DEFAULT_PRIORITY_CONFIG } from "./types";

export class LifeIntelligenceEngine {
  private readonly priorityEngine: PriorityEngine;
  private providers: SignalProvider[] = [];
  private static readonly cache = new Map<string, { at: number; snapshot: LifeIntelligenceSnapshot }>();
  private static readonly CACHE_TTL = 15_000;

  constructor(
    private readonly repos: Repositories,
    private readonly eventBus: EventBus,
  ) {
    this.priorityEngine = new PriorityEngine();
  }

  registerProvider(provider: SignalProvider): void {
    this.providers.push(provider);
  }

  registerProviders(providers: SignalProvider[]): void {
    this.providers.push(...providers);
  }

  async analyze(userId: string, useCache = true): Promise<LifeIntelligenceSnapshot> {
    if (useCache) {
      const hit = LifeIntelligenceEngine.cache.get(userId);
      if (hit && Date.now() - hit.at < LifeIntelligenceEngine.CACHE_TTL) return hit.snapshot;
    }

    const allSignals = await this.gatherSignals(userId);
    const rankedSignals = this.priorityEngine.rank(allSignals);
    const recommendations = this.buildRecommendations(rankedSignals);
    const missionControl = this.buildMissionControl(rankedSignals, recommendations);
    const domainBreakdown = this.computeDomainBreakdown(rankedSignals);

    const snapshot: LifeIntelligenceSnapshot = {
      rankedSignals,
      recommendations,
      missionControl,
      domainBreakdown,
      generatedAt: new Date().toISOString(),
    };

    LifeIntelligenceEngine.cache.set(userId, { at: Date.now(), snapshot });
    return snapshot;
  }

  async rankedSignals(userId: string): Promise<RankedSignal[]> {
    return (await this.analyze(userId)).rankedSignals;
  }

  async recommendations(userId: string): Promise<IntelligenceRecommendation[]> {
    return (await this.analyze(userId)).recommendations;
  }

  async missionControl(userId: string): Promise<MissionControlEntry[]> {
    return (await this.analyze(userId)).missionControl;
  }

  static invalidate(userId: string): void {
    LifeIntelligenceEngine.cache.delete(userId);
  }

  getPriorityEngine(): PriorityEngine {
    return this.priorityEngine;
  }

  private async gatherSignals(userId: string) {
    const results = await Promise.allSettled(
      this.providers.map((p) => p.collect(userId)),
    );

    const allSignals = [];
    for (const result of results) {
      if (result.status === "fulfilled") {
        allSignals.push(...result.value);
      }
    }

    return allSignals;
  }

  private buildRecommendations(ranked: RankedSignal[]): IntelligenceRecommendation[] {
    const seenSources = new Set<string>();
    return ranked
      .filter((s) => {
        if (seenSources.has(s.type)) return false;
        seenSources.add(s.type);
        return s.score > 0.3;
      })
      .slice(0, 5)
      .map((s) => ({
        id: `rec-${s.id}`,
        type: s.type,
        title: s.title,
        body: s.description,
        href: s.entityId ? `/${s.entityType?.replace(/_/g, "-")}/${s.entityId}` : undefined,
        actionLabel: "View",
        priority: Math.round(s.score * 100),
        domain: s.domain,
        source: s.domain,
        reason: s.explanation,
      }));
  }

  private buildMissionControl(
    ranked: RankedSignal[],
    recommendations: IntelligenceRecommendation[],
  ): MissionControlEntry[] {
    const domainGroups = new Map<string, RankedSignal[]>();

    for (const signal of ranked) {
      const group = domainGroups.get(signal.domain) ?? [];
      group.push(signal);
      domainGroups.set(signal.domain, group);
    }

    const entries: MissionControlEntry[] = [];
    for (const [domain, signals] of domainGroups) {
      const rec = recommendations.find((r) => r.domain === domain);
      entries.push({
        id: `mc-${domain}`,
        domain: domain as MissionControlEntry["domain"],
        title: `${domain.charAt(0).toUpperCase() + domain.slice(1)} Signals`,
        signals: signals.slice(0, 5),
        priority: Math.round(signals[0]?.score ?? 0 * 100),
        estimatedMinutes: signals.length * 10,
        recommendation: rec,
      });
    }

    return entries.sort((a, b) => b.priority - a.priority);
  }

  private computeDomainBreakdown(ranked: RankedSignal[]) {
    const breakdown: Record<string, { count: number; avgPriority: number }> = {};

    for (const signal of ranked) {
      if (!breakdown[signal.domain]) {
        breakdown[signal.domain] = { count: 0, avgPriority: 0 };
      }
      breakdown[signal.domain].count++;
      breakdown[signal.domain].avgPriority += signal.score;
    }

    for (const key of Object.keys(breakdown)) {
      breakdown[key].avgPriority = Math.round(
        (breakdown[key].avgPriority / breakdown[key].count) * 100,
      );
    }

    return breakdown as LifeIntelligenceSnapshot["domainBreakdown"];
  }
}
