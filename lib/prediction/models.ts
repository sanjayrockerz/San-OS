import type {
  PredictionModel,
  AcademicPredictionInput,
  AcademicPredictionOutput,
  PlacementPredictionInput,
  PlacementPredictionOutput,
  BusinessPredictionInput,
  BusinessPredictionOutput,
  ExecutionPredictionInput,
  ExecutionPredictionOutput,
} from "./types";

export class AcademicPredictionModel
  implements PredictionModel<AcademicPredictionInput, AcademicPredictionOutput>
{
  readonly id = "academic-cgpa";
  readonly name = "Academic CGPA Projection";
  readonly description = "Predicts expected CGPA and probability of reaching target";

  predict(input: AcademicPredictionInput): {
    value: AcademicPredictionOutput;
    confidence: number;
    explanation: string;
    factors: { name: string; contribution: number; direction: "positive" | "negative"; description: string }[];
  } {
    const totalGpaPoints = input.semesterGrades.reduce(
      (sum, s) => sum + s.gpa * s.credits,
      0,
    );
    const totalCreditsSoFar = input.semesterGrades.reduce(
      (sum, s) => sum + s.credits,
      0,
    );
    const currentCgpa =
      totalCreditsSoFar > 0 ? totalGpaPoints / totalCreditsSoFar : input.currentGpa;

    const remainingCredits = input.totalCredits - totalCreditsSoFar;
    const requiredGpa =
      remainingCredits > 0
        ? ((input.targetCgpa * input.totalCredits - totalGpaPoints) / remainingCredits)
        : input.targetCgpa;

    const possible =
      requiredGpa <= 10 && requiredGpa >= 0;
    const probability = possible
      ? Math.max(0, Math.min(100, 100 - Math.abs(requiredGpa - currentCgpa) * 15))
      : 0;

    const semesterGpaAvg =
      input.semesterGrades.length > 0
        ? input.semesterGrades.reduce((s, g) => s + g.gpa, 0) / input.semesterGrades.length
        : currentCgpa;

    const trend = input.semesterGrades.length >= 2
      ? input.semesterGrades[input.semesterGrades.length - 1].gpa -
        input.semesterGrades[0].gpa
      : 0;

    const expectedCgpa = Math.min(
      10,
      Math.max(0, currentCgpa + trend * 0.3),
    );

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
      explanation: `Based on ${input.semesterGrades.length} semesters of data. Current trend: ${trend >= 0 ? "improving" : "declining"}. Target ${input.targetCgpa} CGPA requires ${requiredGpa.toFixed(2)} GPA in remaining semesters.`,
      factors: [
        {
          name: "Current CGPA",
          contribution: 50,
          direction: currentCgpa >= input.targetCgpa ? "positive" : "negative",
          description: `Current CGPA: ${currentCgpa.toFixed(2)}`,
        },
        {
          name: "Academic Trend",
          contribution: 25,
          direction: trend >= 0 ? "positive" : "negative",
          description: trend >= 0 ? "Improving trend" : "Declining trend",
        },
        {
          name: "Remaining Credits",
          contribution: 15,
          direction: remainingCredits > 0 ? "positive" : "negative",
          description: `${remainingCredits} credits remaining to improve`,
        },
        {
          name: "Consistency",
          contribution: 10,
          direction: semesterGpaAvg >= 7 ? "positive" : "negative",
          description: `Average semester GPA: ${semesterGpaAvg.toFixed(2)}`,
        },
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

  predict(input: PlacementPredictionInput) {
    const targetProblems = 300;
    const problemScore = Math.min(100, (input.solvedProblems / targetProblems) * 100);
    const topicScore = input.topicCoverage * 100;
    const consistencyScore = input.consistency * 100;
    const revisionScore = input.revisionHealth * 100;
    const difficultyBonus = input.averageDifficulty >= 3 ? 10 : input.averageDifficulty >= 2 ? 5 : 0;

    const readinessScore = Math.min(
      100,
      Math.round(problemScore * 0.35 + topicScore * 0.3 + consistencyScore * 0.2 + revisionScore * 0.15 + difficultyBonus),
    );

    const estimatedDays = Math.max(
      30,
      Math.round((100 - readinessScore) * 3),
    );

    const weakAreas: string[] = [];
    if (problemScore < 50) weakAreas.push("Problem count");
    if (topicScore < 50) weakAreas.push("Topic coverage");
    if (consistencyScore < 50) weakAreas.push("Consistency");
    if (revisionScore < 50) weakAreas.push("Revision health");

    return {
      value: {
        readinessScore,
        topicGaps: [
          { topic: "Arrays", coverage: 0, priority: 0 },
          { topic: "Graphs", coverage: 0, priority: 0 },
          { topic: "DP", coverage: 0, priority: 0 },
        ],
        estimatedPreparationDays: estimatedDays,
        weakAreas,
      },
      confidence: Math.round(75 + input.solvedProblems * 0.05),
      explanation: `Readiness: ${readinessScore}% (${input.solvedProblems}/${targetProblems} problems, ${(input.topicCoverage * 100).toFixed(0)}% topic coverage). Need ~${estimatedDays} more days of preparation.`,
      factors: [
        {
          name: "Problem Count",
          contribution: 35,
          direction: problemScore > 50 ? "positive" : "negative",
          description: `${input.solvedProblems}/${targetProblems} problems solved`,
        },
        {
          name: "Topic Coverage",
          contribution: 30,
          direction: topicScore > 50 ? "positive" : "negative",
          description: `${(input.topicCoverage * 100).toFixed(0)}% topics covered`,
        },
        {
          name: "Consistency",
          contribution: 20,
          direction: consistencyScore > 50 ? "positive" : "negative",
          description: `${(input.consistency * 100).toFixed(0)}% consistency`,
        },
        {
          name: "Revision Health",
          contribution: 15,
          direction: revisionScore > 50 ? "positive" : "negative",
          description: `${(input.revisionHealth * 100).toFixed(0)}% revision health`,
        },
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

  predict(input: BusinessPredictionInput) {
    const n = input.monthlyRevenue.length;
    if (n < 2) {
      return {
        value: {
          projectedRevenue: input.monthlyRevenue[0] ?? 0,
          confidence: 30,
          growthRate: 0,
          factors: [],
        },
        confidence: 30,
        explanation: "Insufficient data for projection (need ≥2 months)",
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
          {
            name: "Revenue Trend",
            contribution: 40,
            direction: growthRate > 0 ? "positive" : "negative",
            description: `Trend: ${(growthRate * 100).toFixed(1)}% over ${n} months`,
          },
          {
            name: "Recent Average",
            contribution: 30,
            direction: avgRecent > input.monthlyRevenue[0] ? "positive" : "negative",
            description: `Recent 3-month avg: $${avgRecent.toFixed(0)}`,
          },
          {
            name: "Pipeline Health",
            contribution: 20,
            direction: input.pipelineValue > 0 ? "positive" : "negative",
            description: `Pipeline value: $${input.pipelineValue}`,
          },
          {
            name: "Cost Efficiency",
            contribution: 10,
            direction: avgExpenses < avgRecent * 0.7 ? "positive" : "negative",
            description: `Avg expenses: $${avgExpenses.toFixed(0)}/mo`,
          },
        ],
      },
    };
  }
}

export class ExecutionPredictionModel
  implements PredictionModel<ExecutionPredictionInput, ExecutionPredictionOutput>
{
  readonly id = "execution-burnout";
  readonly name = "Execution Burnout Risk";
  readonly description = "Predicts burnout risk based on focus patterns";

  predict(input: ExecutionPredictionInput) {
    const avgMinutes = input.dailyFocusMinutes.length > 0
      ? input.dailyFocusMinutes.reduce((s, m) => s + m, 0) / input.dailyFocusMinutes.length
      : 0;

    const consistency = input.completionRate;

    const missedRatio = input.totalDays > 0 ? input.missedDays / input.totalDays : 0;

    const longDays = input.dailyFocusMinutes.filter((m) => m > 240).length;
    const longDayRatio = input.dailyFocusMinutes.length > 0 ? longDays / input.dailyFocusMinutes.length : 0;

    const burnoutScore = Math.min(
      100,
      Math.round(
        (avgMinutes > 240 ? (avgMinutes - 240) * 0.2 : 0) +
          (1 - consistency) * 30 +
          missedRatio * 25 +
          longDayRatio * 25,
      ),
    );

    const projectedConsistency = Math.max(
      0,
      Math.min(1, consistency - burnoutScore * 0.005),
    );

    const recoveryDays = Math.max(1, Math.round(burnoutScore * 0.3));

    return {
      value: {
        burnoutRisk: burnoutScore,
        projectedConsistency: Math.round(projectedConsistency * 100),
        estimatedRecoveryDays: recoveryDays,
        riskFactors: [
          {
            name: "Extended Sessions",
            contribution: 35,
            direction: longDayRatio > 0.3 ? "negative" : "positive",
            description: `${longDays} sessions > 4 hours`,
          },
          {
            name: "Missed Days",
            contribution: 25,
            direction: missedRatio > 0.2 ? "negative" : "positive",
            description: `${input.missedDays}/${input.totalDays} days missed`,
          },
          {
            name: "Completion Rate",
            contribution: 25,
            direction: consistency > 0.7 ? "positive" : "negative",
            description: `${(consistency * 100).toFixed(0)}% completion rate`,
          },
          {
            name: "Session Length",
            contribution: 15,
            direction: avgMinutes > 180 ? "negative" : "positive",
            description: `Avg ${Math.round(avgMinutes)} min/session`,
          },
        ],
      },
    };
  }
}
