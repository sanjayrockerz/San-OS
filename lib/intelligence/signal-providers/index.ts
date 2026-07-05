import type { Repositories } from "@/lib/repositories";
import type { SignalProvider } from "../types";
import { AcademicSignalProvider } from "./academic-provider";
import { BusinessSignalProvider } from "./business-provider";
import { ExecutionSignalProvider } from "./execution-provider";
import { LearningSignalProvider } from "./learning-provider";

export function createSignalProviders(repos: Repositories): SignalProvider[] {
  return [
    new AcademicSignalProvider(repos),
    new BusinessSignalProvider(repos),
    new ExecutionSignalProvider(repos),
    new LearningSignalProvider(repos),
  ];
}

export { AcademicSignalProvider } from "./academic-provider";
export { BusinessSignalProvider } from "./business-provider";
export { ExecutionSignalProvider } from "./execution-provider";
export { LearningSignalProvider } from "./learning-provider";
