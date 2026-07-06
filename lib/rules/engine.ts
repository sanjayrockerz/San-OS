import { captureException, captureEvent } from "@/lib/observability/logger";
import type { RuleAction, RuleActionHandler, RuleDefinition, RuleEvaluationContext, RuleEvaluationResult, RuleCondition } from "./types";

export class RuleEngine {
  private readonly rules: RuleDefinition[] = [];
  private readonly actionHandlers = new Map<string, RuleActionHandler>();

  register(rule: RuleDefinition): void {
    if (this.rules.find((r) => r.id === rule.id)) return;
    this.rules.push(rule);
    this.rules.sort((a, b) => b.priority - a.priority);
    captureEvent("rule.registered", { ruleId: rule.id, domain: rule.domain });
  }

  registerActionHandler(type: string, handler: RuleActionHandler): void {
    this.actionHandlers.set(type, handler);
  }

  registerRules(rules: RuleDefinition[]): void {
    for (const rule of rules) this.register(rule);
  }

  async evaluate(ctx: RuleEvaluationContext): Promise<RuleEvaluationResult[]> {
    const results: RuleEvaluationResult[] = [];

    for (const rule of this.rules) {
      if (!rule.enabled) continue;

      const matched = this.matchesConditions(rule.conditions, ctx);
      const explanation = matched
        ? `Rule "${rule.name}" triggered: all ${rule.conditions.length} condition(s) met`
        : `Rule "${rule.name}" not triggered`;

      results.push({
        ruleId: rule.id,
        ruleName: rule.name,
        matched,
        actions: matched ? rule.actions : [],
        explanation,
      });

      if (matched) {
        await this.executeActions(rule.actions, ctx);
      }
    }

    return results;
  }

  async evaluateSingle(ruleId: string, ctx: RuleEvaluationContext): Promise<RuleEvaluationResult | null> {
    const rule = this.rules.find((r) => r.id === ruleId);
    if (!rule || !rule.enabled) return null;

    const matched = this.matchesConditions(rule.conditions, ctx);
    if (matched) {
      await this.executeActions(rule.actions, ctx);
    }

    return {
      ruleId: rule.id,
      ruleName: rule.name,
      matched,
      actions: matched ? rule.actions : [],
      explanation: matched
        ? `Rule "${rule.name}" triggered`
        : `Rule "${rule.name}" not triggered`,
    };
  }

  getRules(): RuleDefinition[] {
    return [...this.rules];
  }

  getRulesByDomain(domain: string): RuleDefinition[] {
    return this.rules.filter((r) => r.domain === domain);
  }

  enable(ruleId: string): void {
    const rule = this.rules.find((r) => r.id === ruleId);
    if (rule) rule.enabled = true;
  }

  disable(ruleId: string): void {
    const rule = this.rules.find((r) => r.id === ruleId);
    if (rule) rule.enabled = false;
  }

  remove(ruleId: string): void {
    const idx = this.rules.findIndex((r) => r.id === ruleId);
    if (idx >= 0) this.rules.splice(idx, 1);
  }

  clear(): void {
    this.rules.length = 0;
  }

  private matchesConditions(conditions: RuleCondition[], ctx: RuleEvaluationContext): boolean {
    return conditions.every((condition) => this.matchesCondition(condition, ctx));
  }

  private matchesCondition(condition: RuleCondition, ctx: RuleEvaluationContext): boolean {
    const actualValue = this.resolveValue(condition.field, ctx);

    switch (condition.operator) {
      case "eq":
        return actualValue === condition.value;
      case "neq":
        return actualValue !== condition.value;
      case "gt":
        return typeof actualValue === "number" && typeof condition.value === "number" && actualValue > condition.value;
      case "gte":
        return typeof actualValue === "number" && typeof condition.value === "number" && actualValue >= condition.value;
      case "lt":
        return typeof actualValue === "number" && typeof condition.value === "number" && actualValue < condition.value;
      case "lte":
        return typeof actualValue === "number" && typeof condition.value === "number" && actualValue <= condition.value;
      case "in":
        return Array.isArray(condition.value) && condition.value.includes(actualValue);
      case "not_in":
        return Array.isArray(condition.value) && !condition.value.includes(actualValue);
      case "contains":
        return typeof actualValue === "string" && typeof condition.value === "string" && actualValue.includes(condition.value as string);
      case "exists":
        return actualValue !== undefined && actualValue !== null;
      case "not_exists":
        return actualValue === undefined || actualValue === null;
      default:
        return false;
    }
  }

  private resolveValue(field: string, ctx: RuleEvaluationContext): unknown {
    if (field.startsWith("data.")) {
      const key = field.slice(5);
      return ctx.data[key];
    }
    if (field === "userId") return ctx.userId;
    if (field === "entityType") return ctx.entityType;
    if (field === "entityId") return ctx.entityId;
    if (field === "timestamp") return ctx.timestamp;
    return ctx.data[field];
  }

  private async executeActions(actions: RuleAction[], ctx: RuleEvaluationContext): Promise<void> {
    for (const action of actions) {
      const handler = this.actionHandlers.get(action.type);
      if (handler) {
        try {
          await handler(action, ctx);
        } catch (error) {
          captureException(error, {
            context: "RuleEngine.executeAction",
            ruleId: ctx.entityId,
            actionType: action.type,
          });
        }
      }
    }
  }
}
