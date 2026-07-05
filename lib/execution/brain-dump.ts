/**
 * Brain Dump Parser (Execution Intelligence — §2).
 *
 * Turns completely unstructured text (one thought per line, or comma/bullet
 * separated) into classified, prioritised capture items. Pure and deterministic
 * so it runs identically on the server (persisting captures) and on the client
 * (live preview while typing) — no network, no model calls. A later phase can
 * swap the heuristics for an LLM without changing callers, exactly as the rest
 * of the codebase treats "AI".
 *
 * Every line is classified into:
 *   • type      — idea | task | note | link | code | meeting
 *   • domain    — learning | academic | project | business | health | personal | finance
 *   • a suggested destination bucket (§13 "never leave content uncategorized")
 *   • an estimated duration, urgency and importance
 *   • a 0–100 priority score (via {@link scorePriority})
 */
import { scorePriority } from "./priority";

export type CaptureType = "idea" | "task" | "note" | "link" | "code" | "meeting" | "goal" | "project" | "event" | "notification";
export type CaptureDomain =
  | "learning"
  | "academic"
  | "project"
  | "business"
  | "health"
  | "personal"
  | "finance";

/** Where a captured item most likely belongs — the §13 routing target. */
export type CaptureDestination =
  | "Knowledge"
  | "Projects"
  | "Academic"
  | "Business"
  | "Finance"
  | "Personal"
  | "Timeline";

export interface ParsedCaptureItem {
  /** The cleaned line as written by the user. */
  content: string;
  type: CaptureType;
  domain: CaptureDomain;
  destination: CaptureDestination;
  /** Best-effort duration estimate in minutes. */
  estimatedMinutes: number;
  /** 0–100: how time-sensitive this looks (deadline/time-of-day words). */
  urgency: number;
  /** 0–100: how much this matters (career / academic / financial weight). */
  importance: number;
  /** 0–100 composite execution priority. */
  priority: number;
  /** Parsed clock time (HH:MM, 24h) when the line names one, else null. */
  scheduledTime: string | null;
}

const DOMAIN_DESTINATION: Record<CaptureDomain, CaptureDestination> = {
  learning: "Knowledge",
  academic: "Academic",
  project: "Projects",
  business: "Business",
  finance: "Finance",
  health: "Personal",
  personal: "Personal",
};

/**
 * Domain keyword signals, most-specific first. Each entry is matched
 * case-insensitively as a whole word / phrase against the line.
 */
const DOMAIN_SIGNALS: Array<[CaptureDomain, RegExp]> = [
  ["finance", /\b(invoice|payment|budget|expense|salary|tax|refund|revenue|pay(?:ing)?)\b/i],
  ["academic", /\b(assignment|exam|lecture|gpa|semester|pdsa|homework|quiz|thesis|professor|submission)\b/i],
  ["learning", /\b(dsa|leetcode|machine learning|ml|study|studying|learn|revise|revision|course|read|reading|algorithms?|neetcode)\b/i],
  ["business", /\b(client|cold call|cold calling|sales|pitch|proposal|lead|outreach|deal|quote|contract|standup|stand-up)\b/i],
  ["health", /\b(gym|workout|run|running|jog|yoga|meditat|sleep|diet|walk|exercise)\b/i],
  ["project", /\b(deploy|git|push|pull request|\bpr\b|merge|build|ship|ui|ux|feature|bug|refactor|api|backend|frontend|design|film|creator|app)\b/i],
  ["personal", /\b(call parents|call mom|call dad|family|birthday|anniversary|groceries|clean|laundry|friend)\b/i],
];

const TYPE_SIGNALS: Array<[CaptureType, RegExp]> = [
  ["link", /\bhttps?:\/\/|\bwww\.|\.(com|io|dev|org|net)\b/i],
  ["meeting", /\b(meeting|meet|call with|1:1|1-1|sync|standup|stand-up|catch ?up|interview|appointment)\b/i],
  ["code", /\b(deploy|git|push|pull request|\bpr\b|merge|build|ship|bug|refactor|api|backend|frontend|commit|hotfix)\b/i],
  ["goal", /\b(goal|achieve|target|objective|milestone|aim to)\b/i],
  ["project", /\b(project|initiative|campaign|launch|build out|create app|start business)\b/i],
  ["event", /\b(event|happened|occurred|attended|went to)\b/i],
  ["notification", /\b(remind|notify|alert|ping)\b/i],
];

/** Verbs that make a line an actionable task rather than a bare idea/note. */
const ACTION_VERB = /\b(call|email|send|finish|complete|write|fix|review|prepare|book|schedule|buy|pay|submit|update|clean|plan|do|start)\b/i;

/** Time-of-day patterns like "4PM", "at 3", "@ 09:30", "3:30pm". */
const TIME_RE = /\b(?:@\s*)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b|\bat\s+(\d{1,2})(?::(\d{2}))?\b/i;

/** Words that raise urgency independent of a clock time. */
const URGENCY_RE = /\b(today|tonight|now|asap|urgent|eod|deadline|due|tomorrow|this week|week \d+)\b/i;

const ESTIMATE_BY_TYPE: Record<CaptureType, number> = {
  meeting: 30,
  code: 60,
  task: 30,
  link: 10,
  note: 10,
  idea: 15,
  goal: 120,
  project: 240,
  event: 0,
  notification: 0,
};

const ESTIMATE_OVERRIDE: Array<[RegExp, number]> = [
  [/\b(gym|workout|film|short film|movie)\b/i, 90],
  [/\b(dsa|leetcode|study|learn|course|machine learning|ml)\b/i, 90],
  [/\b(deploy|build|ship)\b/i, 45],
  [/\b(call|email|text)\b/i, 15],
];

/** Inserts soft separators into compact plan text without changing prose. */
function normaliseCompactText(raw: string): string {
  return raw
    .replace(/([a-z\d])([A-Z])/g, "$1\n$2")
    .replace(/([A-Za-z])([0-9])/g, "$1\n$2")
    .replace(/([0-9])([A-Za-z])/g, "$1\n$2")
    .replace(/[–—]/g, "-");
}

/** Base importance per domain (0–100) — career / money / grades weigh more. */
const DOMAIN_IMPORTANCE: Record<CaptureDomain, number> = {
  finance: 80,
  business: 75,
  academic: 70,
  project: 60,
  learning: 55,
  health: 50,
  personal: 45,
};

function detectDomain(line: string): CaptureDomain {
  for (const [domain, re] of DOMAIN_SIGNALS) {
    if (re.test(line)) return domain;
  }
  return "personal";
}

function detectType(line: string, domain: CaptureDomain): CaptureType {
  for (const [type, re] of TYPE_SIGNALS) {
    if (re.test(line)) return type;
  }
  if (ACTION_VERB.test(line)) return "task";
  // A single short noun-phrase in a work domain reads as a task to do, not a stray idea.
  if (domain !== "personal" && line.split(/\s+/).length <= 4) return "task";
  return "idea";
}

/** Extracts a 24h HH:MM string from time-of-day phrasing, else null. */
function detectTime(line: string): string | null {
  const m = TIME_RE.exec(line);
  if (!m) return null;
  const hour12 = m[1] ?? m[4];
  const minute = m[2] ?? m[5] ?? "00";
  const meridiem = m[3]?.toLowerCase();
  if (!hour12) return null;
  let hour = Number(hour12);
  if (Number.isNaN(hour) || hour > 23) return null;
  if (meridiem === "pm" && hour < 12) hour += 12;
  if (meridiem === "am" && hour === 12) hour = 0;
  return `${String(hour).padStart(2, "0")}:${minute.padStart(2, "0")}`;
}

function estimateMinutes(line: string, type: CaptureType): number {
  for (const [re, mins] of ESTIMATE_OVERRIDE) {
    if (re.test(line)) return mins;
  }
  return ESTIMATE_BY_TYPE[type];
}

/** Splits raw text into candidate lines, tolerating bullets and inline lists. */
function splitLines(raw: string): string[] {
  return normaliseCompactText(raw)
    .split(/\r?\n/)
    .flatMap((line) => {
      const trimmed = line.replace(/^[\s•\-*\d.)]+/, "").trim();
      if (!trimmed) return [];
      // Only split on commas when the line clearly isn't prose (short fragments).
      if (trimmed.length <= 60 && /,/.test(trimmed) && !/\b(and|but|because)\b/i.test(trimmed)) {
        return trimmed.split(/\s*,\s*/).filter(Boolean);
      }
      return [trimmed];
    })
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

/**
 * Parses a raw brain-dump into fully classified, prioritised items.
 * Deterministic and side-effect free.
 */
export function parseBrainDump(raw: string): ParsedCaptureItem[] {
  return splitLines(raw).map((content) => {
    const domain = detectDomain(content);
    const type = detectType(content, domain);
    const scheduledTime = detectTime(content);
    const estimatedMinutes = estimateMinutes(content, type);

    const hasDeadline = URGENCY_RE.test(content);
    const urgency = Math.min(
      100,
      (scheduledTime ? 55 : 0) + (hasDeadline ? 45 : 0) + (type === "meeting" ? 15 : 0),
    );
    const importance = DOMAIN_IMPORTANCE[domain];

    const priority = scorePriority({
      urgency,
      importance,
      estimatedMinutes,
      isMeeting: type === "meeting",
      domain,
    });

    return {
      content,
      type,
      domain,
      destination: DOMAIN_DESTINATION[domain],
      estimatedMinutes,
      urgency,
      importance,
      priority,
      scheduledTime,
    };
  });
}
