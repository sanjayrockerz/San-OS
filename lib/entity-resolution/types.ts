export type EntityType =
  | "client"
  | "project"
  | "task"
  | "meeting"
  | "course"
  | "roadmap"
  | "problem"
  | "concept"
  | "technology"
  | "github_repo"
  | "resource"
  | "finance"
  | "invoice";

export interface ResolvedEntity {
  type: EntityType;
  id: string;
  name: string;
  confidence: number;
  context?: string;
  href: string;
}

export interface EntityResolutionResult {
  matches: ResolvedEntity[];
  best: ResolvedEntity | null;
  needsClarification: boolean;
  clarificationMessage?: string;
  ambiguousOptions?: ResolvedEntity[];
}

export interface EntityCandidate {
  type: EntityType;
  id: string;
  name: string;
  aliases: string[];
  context?: string;
  href: string;
  lastTouchedAt?: string;
}

export interface ResolutionContext {
  userId: string;
  currentProjectId?: string;
  currentClientId?: string;
  recentEntityIds?: string[];
  text: string;
}
