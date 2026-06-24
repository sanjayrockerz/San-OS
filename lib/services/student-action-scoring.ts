/**
 * The single urgency/impact/momentum -> score rubric shared by every signal
 * source that produces a {@link StudentAction}-shaped output (currently
 * StudentIntelligenceCoreService and KnowledgeCoachService). Extracted so the
 * two never drift into two competing definitions of "score" for what is
 * supposed to be one ranked list.
 *
 * Weights (0.5 / 0.35 / 0.15) favour acting on what's due now, then on what's
 * tied to a weak area, with streak-preservation as a tie-breaker.
 */
export function scoreAction(input: {
  urgency: number;
  impact: number;
  momentum: number;
}): number {
  return Math.round(100 * (0.5 * input.urgency + 0.35 * input.impact + 0.15 * input.momentum));
}
