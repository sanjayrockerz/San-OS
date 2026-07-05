export type SignalDomain =
  | "academic"
  | "projects"
  | "business"
  | "finance"
  | "execution"
  | "knowledge"
  | "placement"
  | "health"
  | "relationships"
  | "learning";

export interface Signal {
  id: string;
  domain: SignalDomain;
  type: string;
  title: string;
  description: string;
  urgency: number;
  impact: number;
  confidence: number;
  entityType?: string;
  entityId?: string;
  createdAt: string;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
}

export interface SignalProvider {
  readonly id: string;
  readonly domain: SignalDomain;
  collect(userId: string): Promise<Signal[]>;
}

export interface PriorityConfig {
  domainWeights: Record<SignalDomain, number>;
  urgencyWeight: number;
  impactWeight: number;
  confidenceWeight: number;
  decayRate: number;
  maxSignals: number;
}

export interface RankedSignal extends Signal {
  score: number;
  explanation: string;
}

export interface IntelligenceRecommendation {
  id: string;
  type: string;
  title: string;
  body: string;
  href?: string;
  actionLabel: string;
  priority: number;
  domain: SignalDomain;
  source: string;
  reason: string;
}

export interface MissionControlEntry {
  id: string;
  domain: SignalDomain;
  title: string;
  signals: Signal[];
  priority: number;
  estimatedMinutes: number;
  recommendation?: IntelligenceRecommendation;
}

export interface LifeIntelligenceSnapshot {
  rankedSignals: RankedSignal[];
  recommendations: IntelligenceRecommendation[];
  missionControl: MissionControlEntry[];
  domainBreakdown: Record<SignalDomain, { count: number; avgPriority: number }>;
  generatedAt: string;
}

export const DEFAULT_PRIORITY_CONFIG: PriorityConfig = {
  domainWeights: {
    academic: 1.0,
    projects: 0.9,
    business: 0.9,
    finance: 1.1,
    execution: 0.8,
    knowledge: 0.7,
    placement: 1.0,
    health: 1.2,
    relationships: 0.6,
    learning: 0.8,
  },
  urgencyWeight: 0.4,
  impactWeight: 0.35,
  confidenceWeight: 0.25,
  decayRate: 0.1,
  maxSignals: 50,
};
