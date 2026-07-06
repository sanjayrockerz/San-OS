export { EntityResolutionEngine } from "./engine";
export { fuzzyMatch, normalize, levenshteinDistance, wordInsightScore, acronymMatch } from "./fuzzy";
export type {
  EntityCandidate,
  EntityResolutionResult,
  EntityType,
  ResolvedEntity,
  ResolutionContext,
} from "./types";
