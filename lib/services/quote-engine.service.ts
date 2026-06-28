import type { Repositories } from "@/lib/repositories";
import type { Tables } from "@/types/database";

import { BaseService } from "./base.service";

export interface QuoteFeature {
  title: string;
  description?: string;
  estimatedHours?: number;
  complexity?: "low" | "medium" | "high";
}

export interface QuoteMilestone {
  title: string;
  deliverables?: string[];
  durationWeeks?: number;
  price?: number;
}

export interface QuoteEstimate {
  feature: QuoteFeature;
  estimatedHoursMin: number;
  estimatedHoursMax: number;
  rationale: string;
}

export interface GeneratedQuote {
  title: string;
  summary: string;
  features: QuoteFeature[];
  estimates: QuoteEstimate[];
  milestones: QuoteMilestone[];
  totalHoursMin: number;
  totalHoursMax: number;
  priceMin: number;
  priceMax: number;
  paymentSchedule: Array<{ milestone: string; percentage: number; amount: number }>;
}

const COMPLEXITY_HOURS: Record<QuoteFeature["complexity"] & string, [number, number]> = {
  low: [4, 8],
  medium: [12, 24],
  high: [32, 60],
};

const DEFAULT_HOURLY_RATE_INR_MIN = 1500;
const DEFAULT_HOURLY_RATE_INR_MAX = 2500;

export interface RateOptions {
  /** User's configured hourly rate (`user_preferences.default_hourly_rate`). */
  hourlyRate?: number | null;
}

/**
 * QuoteEngineService — rule-based estimation engine that turns a feature
 * list into a structured quote with milestones, pricing, and a payment schedule.
 * No LLM calls — pure heuristics so it works offline and never hallucinates hours.
 */
export class QuoteEngineService extends BaseService {
  constructor(repos: Repositories) {
    super(repos);
  }

  estimate(features: QuoteFeature[], rateOptions?: RateOptions): GeneratedQuote {
    const estimates: QuoteEstimate[] = features.map((f) => {
      const complexity = f.complexity ?? "medium";
      let [min, max] = COMPLEXITY_HOURS[complexity];

      if (f.estimatedHours) {
        min = Math.round(f.estimatedHours * 0.8);
        max = Math.round(f.estimatedHours * 1.3);
      }

      min = Math.max(1, min);
      max = Math.max(min + 2, max);

      const keywords = (f.title + " " + (f.description ?? "")).toLowerCase();
      if (keywords.includes("auth") || keywords.includes("login")) {
        min += 4;
        max += 8;
      }
      if (keywords.includes("payment") || keywords.includes("stripe")) {
        min += 8;
        max += 16;
      }
      if (keywords.includes("dashboard") || keywords.includes("analytics")) {
        min += 6;
        max += 12;
      }
      if (keywords.includes("mobile") || keywords.includes("responsive")) {
        min += 4;
        max += 8;
      }
      if (keywords.includes("api") || keywords.includes("integration")) {
        min += 6;
        max += 10;
      }

      return {
        feature: f,
        estimatedHoursMin: min,
        estimatedHoursMax: max,
        rationale: `${complexity} complexity feature` +
          (min !== max ? `, ${min}–${max}h` : `, ~${min}h`) +
          (f.description ? `: ${f.description.slice(0, 80)}` : ""),
      };
    });

    const designBuffer = 0.15;
    const testingBuffer = 0.2;
    const deploymentBuffer = 0.1;
    const managementBuffer = 0.1;
    const totalBuffer = 1 + designBuffer + testingBuffer + deploymentBuffer + managementBuffer;

    const rawMin = estimates.reduce((sum, e) => sum + e.estimatedHoursMin, 0);
    const rawMax = estimates.reduce((sum, e) => sum + e.estimatedHoursMax, 0);
    const totalHoursMin = Math.round(rawMin * totalBuffer);
    const totalHoursMax = Math.round(rawMax * totalBuffer);

    const configuredRate = rateOptions?.hourlyRate;
    const rateMin = configuredRate ? Math.round(configuredRate * 0.85) : DEFAULT_HOURLY_RATE_INR_MIN;
    const rateMax = configuredRate ? Math.round(configuredRate * 1.15) : DEFAULT_HOURLY_RATE_INR_MAX;

    const priceMin = Math.round(totalHoursMin * rateMin);
    const priceMax = Math.round(totalHoursMax * rateMax);

    const milestones = buildMilestones(features, estimates, priceMin, priceMax);

    const paymentSchedule = [
      { milestone: "Project kickoff (advance)", percentage: 30, amount: Math.round(priceMin * 0.3) },
      { milestone: "Mid-project delivery", percentage: 40, amount: Math.round(priceMin * 0.4) },
      { milestone: "Final delivery & handover", percentage: 30, amount: Math.round(priceMin * 0.3) },
    ];

    return {
      title: "Project Quotation",
      summary: buildSummary(features, totalHoursMin, totalHoursMax, priceMin, priceMax),
      features,
      estimates,
      milestones,
      totalHoursMin,
      totalHoursMax,
      priceMin,
      priceMax,
      paymentSchedule,
    };
  }

  async getQuote(id: string): Promise<Tables<"project_quotes"> | null> {
    return this.repos.projectQuotes.findById(id);
  }

  async listForProject(projectId: string): Promise<Tables<"project_quotes">[]> {
    return this.repos.projectQuotes.findByProject(projectId);
  }
}

function buildMilestones(
  features: QuoteFeature[],
  estimates: QuoteEstimate[],
  priceMin: number,
  priceMax: number,
): QuoteMilestone[] {
  const totalFeatures = features.length;

  if (totalFeatures <= 3) {
    const totalWeeks = Math.ceil(
      estimates.reduce((s, e) => s + e.estimatedHoursMax, 0) / 40,
    );
    return [
      {
        title: "Full Development & Delivery",
        deliverables: features.map((f) => f.title),
        durationWeeks: totalWeeks || 2,
        price: Math.round((priceMin + priceMax) / 2),
      },
    ];
  }

  const third = Math.ceil(totalFeatures / 3);
  return [
    {
      title: "Phase 1 — Foundation",
      deliverables: features.slice(0, third).map((f) => f.title),
      durationWeeks: 2,
      price: Math.round((priceMin + priceMax) * 0.35),
    },
    {
      title: "Phase 2 — Core Features",
      deliverables: features.slice(third, third * 2).map((f) => f.title),
      durationWeeks: 3,
      price: Math.round((priceMin + priceMax) * 0.45),
    },
    {
      title: "Phase 3 — Polish & Launch",
      deliverables: features.slice(third * 2).map((f) => f.title),
      durationWeeks: 2,
      price: Math.round((priceMin + priceMax) * 0.2),
    },
  ];
}

function buildSummary(
  features: QuoteFeature[],
  minH: number,
  maxH: number,
  priceMin: number,
  priceMax: number,
): string {
  return (
    `This quotation covers ${features.length} feature${features.length === 1 ? "" : "s"} ` +
    `with an estimated development effort of ${minH}–${maxH} hours. ` +
    `Total investment: ₹${priceMin.toLocaleString("en-IN")}–₹${priceMax.toLocaleString("en-IN")}. ` +
    `Includes design, development, testing, and deployment.`
  );
}
