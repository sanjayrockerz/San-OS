import { captureEvent } from "@/lib/observability/logger";
import type { PredictionModel, PredictionResult } from "./types";
import {
  AcademicPredictionModel,
  PlacementPredictionModel,
  BusinessPredictionModel,
  ExecutionPredictionModel,
} from "./models";

export class PredictionEngine {
  private readonly models = new Map<string, PredictionModel<unknown, unknown>>();

  constructor() {
    this.register(new AcademicPredictionModel());
    this.register(new PlacementPredictionModel());
    this.register(new BusinessPredictionModel());
    this.register(new ExecutionPredictionModel());
  }

  register<I, O>(model: PredictionModel<I, O>): void {
    this.models.set(model.id, model as PredictionModel<unknown, unknown>);
    captureEvent("prediction.model_registered", { modelId: model.id, name: model.name });
  }

  predict<I, O>(modelId: string, input: I): PredictionResult<O> | null {
    const model = this.models.get(modelId);
    if (!model) return null;
    return model.predict(input) as unknown as PredictionResult<O>;
  }

  getModels(): PredictionModel<unknown, unknown>[] {
    return [...this.models.values()];
  }

  getModel(modelId: string): PredictionModel<unknown, unknown> | undefined {
    return this.models.get(modelId);
  }
}
