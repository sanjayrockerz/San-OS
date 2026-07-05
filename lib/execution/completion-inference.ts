import { parseBrainDump, type CaptureDomain } from "./brain-dump";

export interface CompletionSignal {
  raw: string;
  completed: boolean;
  confidence: number;
  task: string | null;
  domain: CaptureDomain;
  durationMinutes: number | null;
  verb: string | null;
}

const COMPLETION_VERBS: Array<[RegExp, string]> = [
  [/\b(completed|finished|done|wrapped up|closed|submitted|reviewed|worked on)\b/i, "completed"],
  [/\b(did|spent|handled|cranked through|knocked out)\b/i, "worked"],
  [/\b(முடிச்சேன்|முடித்தேன்|பண்ணேன்|செய்தேன்|வேலை பண்ணேன்)\b/i, "completed"],
  [/\b(mudichen|mudichiten|pannen|panninen|panniten|pannuren|seidhen|seithen|sejten|seijten|seyyren|seyyraen)\b/i, "completed"],
  [/\b(panen|panniten|pannitten|panninaen|panniyaen|pannuren|panniya)\b/i, "worked"],
  [/\b(seidhen|seithen|seijten|sejten|seyyren|seyyraen)\b/i, "completed"],
];

const TASK_STOP_WORDS = new Set([
  "today",
  "yesterday",
  "tonight",
  "morning",
  "afternoon",
  "evening",
  "night",
  "now",
  "for",
  "on",
  "with",
  "in",
  "the",
  "a",
  "an",
  "project",
  "task",
  "work",
  "today.",
  "இன்று",
  "நேற்று",
  "inniku",
  "innaiku",
  "indru",
  "na",
  "naan",
  "la",
  "le",
  "vittu",
  "panninen",
  "panniten",
  "pannen",
  "mudichen",
  "mudichiten",
  "seithen",
  "seidhen",
]);

const DURATION_PATTERNS: Array<[RegExp, number]> = [
  [/\b(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)\b/i, 60],
  [/\b(\d+)\s*(?:m|min|mins|minute|minutes)\b/i, 1],
  [/\b(\d+)\s*(?:மணி|மணி\s*நேரம்)\b/i, 60],
  [/\b(\d+)\s*(?:நிமி|நிமிடம்)\b/i, 1],
];

const DOMAIN_HINTS: Array<[CaptureDomain, RegExp]> = [
  ["learning", /\b(dsa|leetcode|dp|revision|revise|study|studied|reading|course|assignment|homework)\b/i],
  ["academic", /\b(college|semester|exam|assignment|lecture|submission|gpa|class)\b/i],
  ["project", /\b(project|ui|frontend|backend|deploy|ship|build|fix|feature|bug|shawarma)\b/i],
  ["business", /\b(client|invoice|call|proposal|deal|sales|payment|business)\b/i],
  ["health", /\b(gym|workout|run|walk|sleep|diet|exercise|yoga)\b/i],
  ["finance", /\b(invoice|bill|revenue|expense|budget|salary|tax|payment)\b/i],
];

function inferTask(raw: string): string | null {
  const cleaned = raw
    .replace(/\b(worked on|worked|completed|finished|done|reviewed|spent|did|முடிச்சேன்|முடித்தேன்|பண்ணேன்|செய்தேன்|வேலை பண்ணேன்|mudichen|mudichiten|pannen|panninen|panniten|seithen|seidhen)\b/gi, "")
    .replace(/\b(today|yesterday|tonight|morning|afternoon|evening|night|இன்று|நேற்று|inniku|innaiku|indru|na|naan)\b/gi, "")
    .replace(/\b(about|on|for|with|in|the|a|an|la|le|vittu)\b/gi, " ")
    .replace(/[.,!?]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return null;
  const parts = cleaned.split(" ").filter((part) => part && !TASK_STOP_WORDS.has(part.toLowerCase()));
  if (parts.length === 0) return null;
  return parts.slice(0, 6).join(" ");
}

function inferDurationMinutes(raw: string): number | null {
  for (const [pattern, factor] of DURATION_PATTERNS) {
    const match = pattern.exec(raw);
    if (!match?.[1]) continue;
    const value = Number(match[1]);
    if (Number.isNaN(value)) continue;
    return Math.max(1, Math.round(value * factor));
  }
  return null;
}

function inferDomain(raw: string): CaptureDomain {
  for (const [domain, pattern] of DOMAIN_HINTS) {
    if (pattern.test(raw)) return domain;
  }
  return "personal";
}

function inferVerb(raw: string): string | null {
  for (const [pattern, verb] of COMPLETION_VERBS) {
    if (pattern.test(raw)) return verb;
  }
  return null;
}

/**
 * Deterministic completion inference for free-form execution notes.
 */
export function inferCompletionSignal(raw: string): CompletionSignal {
  const verb = inferVerb(raw);
  const durationMinutes = inferDurationMinutes(raw);
  const domain = inferDomain(raw);
  const parsed = parseBrainDump(raw);
  const task = inferTask(raw) ?? parsed[0]?.content ?? null;

  let confidence = verb ? 0.55 : 0.2;
  if (durationMinutes != null) confidence += 0.2;
  if (task) confidence += 0.1;
  if (domain !== "personal") confidence += 0.05;
  if (/(worked on|completed|finished|done|முடிச்சேன்|முடித்தேன்|பண்ணேன்|செய்தேன்|வேலை பண்ணேன்|mudichen|mudichiten|pannen|panninen|panniten|seithen|seidhen)/i.test(raw)) {
    confidence += 0.1;
  }

  return {
    raw,
    completed: confidence >= 0.5,
    confidence: Math.min(0.98, confidence),
    task,
    domain,
    durationMinutes,
    verb,
  };
}
