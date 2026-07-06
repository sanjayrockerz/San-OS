import type {
  PredictionModel,
  PredictionResult,
  PredictionFactor,
  AcademicPredictionInput,
  AcademicPredictionOutput,
  PlacementPredictionInput,
  PlacementPredictionOutput,
  BusinessPredictionInput,
  BusinessPredictionOutput,
  ExecutionPredictionInput,
  ExecutionPredictionOutput,
} from "./types";

function factor(name: string, contribution: number, direction: "positive" | "negative", description: string): PredictionFactor {
  return { name, contribution, direction, description };
}

export class AcademicPredictionModel
  implements PredictionModel<AcademicPredictionInput, AcademicPredictionOutput>
{
  readonly id = "academic-cgpa";
  readonly name = "Academic CGPA Projection";
  readonly description = "Predicts expected CGPA and probability of reaching target";

  predict(input: AcademicPredictionInput): PredictionResult<AcademicPredictionOutput> {
    const totalGpaPoints = input.semesterGrades.reduce(
      (sum, s) => sum + s.gpa * s.credits, 0,
    );
    const totalCreditsSoFar = input.semesterGrades.reduce(
      (sum, s) => sum + s.credits, 0,
    );
    const currentCgpa = totalCreditsSoFar > 0 ? totalGpaPoints / totalCreditsSoFar : input.currentGpa;

    const remainingCredits = input.totalCredits - totalCreditsSoFar;
    const requiredGpa = remainingCredits > 0
      ? ((input.targetCgpa * input.totalCredits - totalGpaPoints) / remainingCredits)
      : input.targetCgpa;

    const possible = requiredGpa <= 10 && requiredGpa >= 0;
    const probability = possible
      ? Math.max(0, Math.min(100, 100 - Math.abs(requiredGpa - currentCgpa) * 15))
      : 0;

    const semesterGpaAvg = input.semesterGrades.length > 0
      ? input.semesterGrades.reduce((s, g) => s + g.gpa, 0) / input.semesterGrades.length
      : currentCgpa;

    const trend = input.semesterGrades.length >= 2
      ? input.semesterGrades[input.semesterGrades.length - 1].gpa - input.semesterGrades[0].gpa
      : 0;

    const expectedCgpa = Math.min(10, Math.max(0, currentCgpa + trend * 0.3));
    const semestersToTarget = requiredGpa > 0 && possible
      ? Math.ceil((input.targetCgpa - currentCgpa) / (requiredGpa - currentCgpa || 1))
      : 0;

    return {
      value: {
        expectedCgpa: Math.round(expectedCgpa * 100) / 100,
        requiredGpaForTarget: Math.round(requiredGpa * 100) / 100,
        probabilityOfTarget: Math.round(probability),
        semestersToTarget: Math.max(0, semestersToTarget),
      },
      confidence: Math.round(70 + input.semesterGrades.length * 5),
      explanation: `Based on ${input.semesterGrades.length} semesters. Target ${input.targetCgpa} CGPA requires ${requiredGpa.toFixed(2)} GPA.`,
      factors: [
        factor("Current CGPA", 50, currentCgpa >= input.targetCgpa ? "positive" : "negative", `Current: ${currentCgpa.toFixed(2)}`),
        factor("Academic Trend", 25, trend >= 0 ? "positive" : "negative", trend >= 0 ? "Improving" : "Declining"),
        factor("Remaining Credits", 15, remainingCredits > 0 ? "positive" : "negative", `${remainingCredits} credits left`),
        factor("Consistency", 10, semesterGpaAvg >= 7 ? "positive" : "negative", `Avg GPA: ${semesterGpaAvg.toFixed(2)}`),
      ],
    };
  }
}

export class PlacementPredictionModel
  implements PredictionModel<PlacementPredictionInput, PlacementPredictionOutput>
{
  readonly id = "placement-readiness";
  readonly name = "Placement Readiness Assessment";
  readonly description = "Assesses placement readiness based on problem-solving metrics";

  predict(input: PlacementPredictionInput): PredictionResult<PlacementPredictionOutput> {
    const targetProblems = 300;
    const problemScore = Math.min(100, (input.solvedProblems / targetProblems) * 100);
    const topicScore = input.topicCoverage * 100;
    const consistencyScore = input.consistency * 100;
    const revisionScore = input.revisionHealth * 100;
    const difficultyBonus = input.averageDifficulty >= 3 ? 10 : input.averageDifficulty >= 2 ? 5 : 0;

    const readinessScore = Math.min(100, Math.round(
      problemScore * 0.35 + topicScore * 0.3 + consistencyScore * 0.2 + revisionScore * 0.15 + difficultyBonus,
    ));

    const estimatedDays = Math.max(30, Math.round((100 - readinessScore) * 3));
    const weakAreas: string[] = [];
    if (problemScore < 50) weakAreas.push("Problem count");
    if (topicScore < 50) weakAreas.push("Topic coverage");
    if (consistencyScore < 50) weakAreas.push("Consistency");
    if (revisionScore < 50) weakAreas.push("Revision health");

    return {
      value: {
        readinessScore,
        topicGaps: [],
        estimatedPreparationDays: estimatedDays,
        weakAreas,
      },
      confidence: Math.round(75 + input.solvedProblems * 0.05),
      explanation: `Readiness: ${readinessScore}% (${input.solvedProblems}/${targetProblems} problems). Need ~${estimatedDays} more days.`,
      factors: [
        factor("Problem Count", 35, problemScore > 50 ? "positive" : "negative", `${input.solvedProblems}/${targetProblems}`),
        factor("Topic Coverage", 30, topicScore > 50 ? "positive" : "negative", `${(input.topicCoverage * 100).toFixed(0)}%`),
        factor("Consistency", 20, consistencyScore > 50 ? "positive" : "negative", `${(input.consistency * 100).toFixed(0)}%`),
        factor("Revision Health", 15, revisionScore > 50 ? "positive" : "negative", `${(input.revisionHealth * 100).toFixed(0)}%`),
      ],
    };
  }
}

export class BusinessPredictionModel
  implements PredictionModel<BusinessPredictionInput, BusinessPredictionOutput>
{
  readonly id = "business-revenue";
  readonly name = "Business Revenue Projection";
  readonly description = "Projects monthly revenue based on historical trends";

  predict(input: BusinessPredictionInput): PredictionResult<BusinessPredictionOutput> {
    const n = input.monthlyRevenue.length;
    if (n < 2) {
      const rev = input.monthlyRevenue[0] ?? 0;
      return {
        value: { projectedRevenue: rev, confidence: 30, growthRate: 0, factors: [] },
        confidence: 30,
        explanation: "Insufficient data (need ≥2 months)",
        factors: [],
      };
    }

    const recentRevenues = input.monthlyRevenue.slice(-3);
    const avgRecent = recentRevenues.reduce((s, r) => s + r, 0) / recentRevenues.length;
    const growthRate = (input.monthlyRevenue[n - 1] - input.monthlyRevenue[0]) / input.monthlyRevenue[0];
    const projectedRevenue = Math.round(avgRecent * (1 + growthRate * 0.5));
    const avgExpenses = input.monthlyExpenses.length > 0
      ? input.monthlyExpenses.reduce((s, e) => s + e, 0) / input.monthlyExpenses.length
      : 0;

    return {
      value: {
        projectedRevenue,
        confidence: Math.min(90, 50 + n * 5),
        growthRate: Math.round(growthRate * 100),
        factors: [
          factor("Revenue Trend", 40, growthRate > 0 ? "positive" : "negative", `${(growthRate * 100).toFixed(1)}% over ${n} months`),
          factor("Recent Average", 30, avgRecent > input.monthlyRevenue[0] ? "positive" : "negative", `3mo avg: $${avgRecent.toFixed(0)}`),
          factor("Pipeline Health", 20, input.pipelineValue > 0 ? "positive" : "negative", `Pipeline: $${input.pipelineValue}`),
          factor("Cost Efficiency", 10, avgExpenses < avgRecent * 0.7 ? "positive" : "negative", `Expenses: $${avgExpenses.toFixed(0)}/mo`),
        ],
      },
      confidence: Math.min(90, 50 + n * 5),
      explanation: `${n}-month trend: ${(growthRate * 100).toFixed(1)}%. Projected: $${projectedRevenue}.`,
      factors: [
        factor("Revenue Trend", 40, growthRate > 0 ? "positive" : "negative", `${(growthRate * 100).toFixed(1)}% over ${n} months`),
        factor("Recent Average", 30, avgRecent > input.monthlyRevenue[0] ? "positive" : "negative", `3mo avg: $${avgRecent.toFixed(0)}`),
        factor("Pipeline Health", 20, input.pipelineValue > 0 ? "positive" : "negative", `Pipeline: $${input.pipelineValue}`),
        factor("Cost Efficiency", 10, avgExpenses < avgRecent * 0.7 ? "positive" : "negative", `Expenses: $${avgExpenses.toFixed(0)}/mo`),
      ],
    };
  }
}

export class ExecutionPredictionModel
  implements PredictionModel<ExecutionPredictionInput, ExecutionPredictionOutput>
{
  readonly id = "execution-burnout";
  readonly name = "Execution Burnout Risk";
  readonly description = "Predicts burnout risk based on focus patterns";

  predict(input: ExecutionPredictionInput): PredictionResult<ExecutionPredictionOutput> {
    const avgMinutes = input.dailyFocusMinutes.length > 0
      ? input.dailyFocusMinutes.reduce((s, m) => s + m, 0) / input.dailyFocusMinutes.length
      : 0;

    const consistency = input.completionRate;
    const missedRatio = input.totalDays > 0 ? input.missedDays / input.totalDays : 0;
    const longDays = input.dailyFocusMinutes.filter((m) => m > 240).length;
    const longDayRatio = input.dailyFocusMinutes.length > 0 ? longDays / input.dailyFocusMinutes.length : 0;

    const burnoutScore = Math.min(100, Math.round(
      (avgMinutes > 240 ? (avgMinutes - 240) * 0.2 : 0) +
        (1 - consistency) * 30 + missedRatio * 25 + longDayRatio * 25,
    ));

    const projectedConsistency = Math.max(0, Math.min(1, consistency - burnoutScore * 0.005));
    const recoveryDays = Math.max(1, Math.round(burnoutScore * 0.3));

    return {
      value: {
        burnoutRisk: burnoutScore,
        projectedConsistency: Math.round(projectedConsistency * 100),
        estimatedRecoveryDays: recoveryDays,
        riskFactors: [
          factor("Extended Sessions", 35, longDayRatio > 0.3 ? "negative" : "positive", `${longDays} sessions > 4h`),
          factor("Missed Days", 25, missedRatio > 0.2 ? "negative" : "positive", `${input.missedDays}/${input.totalDays} missed`),
          factor("Completion Rate", 25, consistency > 0.7 ? "positive" : "negative", `${(consistency * 100).toFixed(0)}%`),
          factor("Session Length", 15, avgMinutes > 180 ? "negative" : "positive", `Avg ${Math.round(avgMinutes)} min`),
        ],
      },
      confidence: Math.round(70 + input.dailyFocusMinutes.length * 2),
      explanation: `Burnout risk: ${burnoutScore}%. ${burnoutScore > 50 ? "High risk — consider rest." : "Manageable risk."}`,
      factors: [
        factor("Extended Sessions", 35, longDayRatio > 0.3 ? "negative" : "positive", `${longDays} sessions > 4h`),
        factor("Missed Days", 25, missedRatio > 0.2 ? "negative" : "positive", `${input.missedDays}/${input.totalDays} missed`),
        factor("Completion Rate", 25, consistency > 0.7 ? "positive" : "negative", `${(consistency * 100).toFixed(0)}%`),
        factor("Session Length", 15, avgMinutes > 180 ? "negative" : "positive", `Avg ${Math.round(avgMinutes)} min`),
      ],
    };
  }
}
