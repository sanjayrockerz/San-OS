/**
 * Shared domain types for DSA OS.
 * Phase 1 re-exports the mock shapes; later phases will replace these
 * with database-backed models without changing import sites.
 */
export type { Difficulty, ProblemMock } from "@/lib/mock-data";
export type { Pattern } from "@/lib/utils/patterns";
