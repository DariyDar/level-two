// ============================================
// Rule Engine
// Evaluates configuration-driven rules
// ============================================

import type {
  Rule,
  RuleCondition,
  RuleAction,
  TierModifier,
  OrganRuleSet,
  RuleEvaluationContext,
  RuleEvaluationResult,
  ComparisonOperator,
} from './types';

export class RuleEngine {
  /**
   * Evaluate rules for an organ and return the tier
   */
  static evaluateOrganRules(
    ruleSet: OrganRuleSet,
    context: RuleEvaluationContext
  ): RuleEvaluationResult {
    const matchedRules: string[] = [];
    const appliedModifiers: string[] = [];

    // Step 1: Find first matching rule (sorted by priority)
    const sortedRules = [...ruleSet.rules]
      .filter((r) => r.enabled !== false)
      .sort((a, b) => a.priority - b.priority);

    let baseTier = 0;

    for (const rule of sortedRules) {
      if (this.evaluateCondition(rule.condition, context)) {
        baseTier = this.executeAction(rule.action, baseTier, context);
        matchedRules.push(rule.id);
        break; // Stop after first match (highest priority)
      }
    }

    // Step 2: Apply modifiers
    let finalTier = baseTier;

    if (ruleSet.modifiers) {
      for (const modifier of ruleSet.modifiers) {
        if (modifier.enabled === false) continue;

        // Check modifier condition if present
        if (modifier.condition && !this.evaluateCondition(modifier.condition, context)) {
          continue;
        }

        // Apply modifier effect
        if (modifier.effect.type === 'addTier') {
          finalTier += modifier.effect.amount;
          appliedModifiers.push(modifier.id);
        } else if (modifier.effect.type === 'subtractTier') {
          finalTier -= modifier.effect.amount;
          appliedModifiers.push(modifier.id);
        }
      }
    }

    // Step 3: Clamp tier to valid range
    const minTier = ruleSet.minTier ?? 0;
    const maxTier = ruleSet.maxTier ?? ruleSet.rates.length - 1;
    finalTier = Math.max(minTier, Math.min(maxTier, finalTier));

    // Step 4: Get rate for tier
    const finalRate = ruleSet.rates[finalTier] ?? 0;

    return {
      tier: finalTier,
      matchedRules,
      appliedModifiers,
      finalRate,
    };
  }

  /**
   * Evaluate a condition
   */
  private static evaluateCondition(
    condition: RuleCondition,
    context: RuleEvaluationContext
  ): boolean {
    switch (condition.type) {
      case 'container':
        return this.evaluateContainerCondition(condition, context);

      case 'boost':
        return this.evaluateBoostCondition(condition, context);

      case 'effect':
        return this.evaluateEffectCondition(condition, context);

      case 'degradation':
        return this.evaluateDegradationCondition(condition, context);

      case 'default':
        return true;

      default:
        console.warn('Unknown condition type:', condition);
        return false;
    }
  }

  private static evaluateContainerCondition(
    condition: Extract<RuleCondition, { type: 'container' }>,
    context: RuleEvaluationContext
  ): boolean {
    const level = context.containers[condition.container];

    let compareValue = condition.value;

    // If relative to capacity, convert to absolute
    if (condition.relative === 'capacity') {
      const capacity = context.capacities[condition.container as 'liver' | 'bg'];
      if (capacity !== undefined) {
        compareValue = capacity * condition.value;
      }
    }

    return this.compare(level, condition.operator, compareValue);
  }

  private static evaluateBoostCondition(
    condition: Extract<RuleCondition, { type: 'boost' }>,
    context: RuleEvaluationContext
  ): boolean {
    const boost = context.boosts[condition.boost];

    switch (condition.state) {
      case 'active':
        return boost.isActive;
      case 'inactive':
        return !boost.isActive;
      case 'ready':
        return boost.charges > 0 && boost.cooldownTicks === 0;
      case 'cooldown':
        return boost.cooldownTicks > 0;
      default:
        return false;
    }
  }

  private static evaluateEffectCondition(
    condition: Extract<RuleCondition, { type: 'effect' }>,
    context: RuleEvaluationContext
  ): boolean {
    const level = context.containers[condition.container];
    return this.compare(level, condition.operator, condition.value);
  }

  private static evaluateDegradationCondition(
    condition: Extract<RuleCondition, { type: 'degradation' }>,
    context: RuleEvaluationContext
  ): boolean {
    const level = context.degradation[condition.organ];
    return this.compare(level, condition.operator, condition.value);
  }

  /**
   * Compare two values with an operator
   */
  private static compare(a: number, operator: ComparisonOperator, b: number): boolean {
    switch (operator) {
      case '>':
        return a > b;
      case '>=':
        return a >= b;
      case '<':
        return a < b;
      case '<=':
        return a <= b;
      case '==':
        return a === b;
      case '!=':
        return a !== b;
      default:
        return false;
    }
  }

  /**
   * Execute an action
   */
  private static executeAction(
    action: RuleAction,
    currentTier: number,
    context: RuleEvaluationContext
  ): number {
    switch (action.type) {
      case 'setTier':
        return action.tier;

      case 'addTier':
        return currentTier + action.amount;

      case 'subtractTier':
        return currentTier - action.amount;

      case 'transfer':
        // Transfer actions set tier for the transfer rate
        return action.rateTier;

      case 'activate':
        // Activate actions set tier for the organ
        return action.tier;

      default:
        console.warn('Unknown action type:', action);
        return currentTier;
    }
  }
}
