export interface PredictionModel<I, O> {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  predict(input: I): PredictionResult<O>;
}

export interface PredictionResult<T> {
  value: T;
  confidence: number;
  explanation: string;
  factors: PredictionFactor[];
}

export interface PredictionFactor {
  name: string;
  contribution: number;
  direction: "positive" | "negative";
  description: string;
}

export interface AcademicPredictionInput {
  currentGpa: number;
  completedCredits: number;
  totalCredits: number;
  currentSemester: number;
  targetCgpa: number;
  semesterGrades: { gpa: number; credits: number }[];
}

export interface AcademicPredictionOutput {
  expectedCgpa: number;
  requiredGpaForTarget: number;
  probabilityOfTarget: number;
  semestersToTarget: number;
}

export interface PlacementPredictionInput {
  solvedProblems: number;
  topicCoverage: number;
  averageDifficulty: number;
  consistency: number;
  revisionHealth: number;
  targetCompanies: string[];
}

export interface PlacementPredictionOutput {
  readinessScore: number;
  topicGaps: { topic: string; coverage: number; priority: number }[];
  estimatedPreparationDays: number;
  weakAreas: string[];
}

export interface BusinessPredictionInput {
  monthlyRevenue: number[];
  monthlyExpenses: number[];
  activeClients: number;
  pipelineValue: number;
  averageDealSize: number;
  conversionRate: number;
}

export interface BusinessPredictionOutput {
  projectedRevenue: number;
  confidence: number;
  growthRate: number;
  factors: PredictionFactor[];
}

export interface ExecutionPredictionInput {
  dailyFocusMinutes: number[];
  completionRate: number;
  missedDays: number;
  totalDays: number;
  averageSessionLength: number;
}

export interface ExecutionPredictionOutput {
  burnoutRisk: number;
  projectedConsistency: number;
  estimatedRecoveryDays: number;
  riskFactors: PredictionFactor[];
}
