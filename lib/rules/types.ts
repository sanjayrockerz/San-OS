export interface RuleCondition {
  field: string;
  operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "in" | "not_in" | "contains" | "exists" | "not_exists";
  value: unknown;
}

export interface RuleAction {
  type: string;
  params: Record<string, unknown>;
}

export interface RuleDefinition {
  id: string;
  name: string;
  description?: string;
  domain: string;
  enabled: boolean;
  priority: number;
  conditions: RuleCondition[];
  actions: RuleAction[];
  metadata?: Record<string, unknown>;
}

export interface RuleEvaluationContext {
  userId: string;
  entityType?: string;
  entityId?: string;
  data: Record<string, unknown>;
  timestamp: string;
}

export interface RuleEvaluationResult {
  ruleId: string;
  ruleName: string;
  matched: boolean;
  actions: RuleAction[];
  explanation: string;
}

export type RuleActionHandler = (action: RuleAction, ctx: RuleEvaluationContext) => Promise<void>;
