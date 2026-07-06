import { captureEvent } from "@/lib/observability/logger";
import type { PredictionModel, PredictionResult } from "./types";
import {
  AcademicPredictionModel,
  PlacementPredictionModel,
  BusinessPredictionModel,
  ExecutionPredictionModel,
} from "./models";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyModel = PredictionModel<any, any>;

export class PredictionEngine {
  private readonly models = new Map<string, AnyModel>();

  constructor() {
    this.registerModel(new AcademicPredictionModel());
    this.registerModel(new PlacementPredictionModel());
    this.registerModel(new BusinessPredictionModel());
    this.registerModel(new ExecutionPredictionModel());
  }

  private registerModel(model: AnyModel): void {
    this.models.set(model.id, model);
    captureEvent("prediction.model_registered", { modelId: model.id, name: model.name });
  }

  predict<I, O>(modelId: string, input: I): PredictionResult<O> | null {
    const model = this.models.get(modelId);
    if (!model) return null;
    return model.predict(input) as PredictionResult<O>;
  }

  getModels(): AnyModel[] {
    return [...this.models.values()];
  }

  getModel(modelId: string): AnyModel | undefined {
    return this.models.get(modelId);
  }
}
