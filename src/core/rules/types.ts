// ============================================
// Rule System Types
// Configuration-driven organ behavior rules
// ============================================

import type { ContainerId, OrganId } from '../types';

// === Condition Types ===

export type ComparisonOperator = '>' | '>=' | '<' | '<=' | '==' | '!=';

export type ConditionType =
  | 'container'    // Check container level
  | 'boost'        // Check boost state
  | 'effect'       // Check effect container
  | 'degradation'  // Check degradation level
  | 'default';     // Default/fallback rule

/**
 * Container level condition
 * Example: { type: 'container', container: 'bg', operator: '<=', value: 100 }
 */
export interface ContainerCondition {
  type: 'container';
  container: ContainerId;
  operator: ComparisonOperator;
  value: number;
  relative?: 'capacity' | 'absolute'; // Compare against capacity (0-1) or absolute value
}

/**
 * Boost state condition
 * Example: { type: 'boost', boost: 'liverBoost', state: 'active' }
 */
export interface BoostCondition {
  type: 'boost';
  boost: 'liverBoost' | 'pancreasBoost';
  state: 'active' | 'inactive' | 'ready' | 'cooldown';
}

/**
 * Effect container condition
 * Example: { type: 'effect', container: 'exerciseEffect', operator: '>', value: 50 }
 */
export interface EffectCondition {
  type: 'effect';
  container: ContainerId;
  operator: ComparisonOperator;
  value: number;
}

/**
 * Degradation level condition
 * Example: { type: 'degradation', organ: 'pancreas', operator: '>=', value: 25 }
 */
export interface DegradationCondition {
  type: 'degradation';
  organ: OrganId;
  operator: ComparisonOperator;
  value: number;
}

/**
 * Default/fallback condition (always true)
 */
export interface DefaultCondition {
  type: 'default';
}

export type RuleCondition =
  | ContainerCondition
  | BoostCondition
  | EffectCondition
  | DegradationCondition
  | DefaultCondition;

// === Action Types ===

export type ActionType =
  | 'setTier'      // Set rate tier
  | 'addTier'      // Add to current tier
  | 'subtractTier' // Subtract from current tier
  | 'transfer'     // Transfer between containers
  | 'activate';    // Activate organ function

/**
 * Set rate tier action
 * Example: { type: 'setTier', tier: 2 }
 */
export interface SetTierAction {
  type: 'setTier';
  tier: number;
}

/**
 * Modify tier action (add/subtract)
 * Example: { type: 'addTier', amount: 1 }
 */
export interface ModifyTierAction {
  type: 'addTier' | 'subtractTier';
  amount: number;
}

/**
 * Transfer action
 * Example: { type: 'transfer', from: 'liver', to: 'bg', rateTier: 1 }
 */
export interface TransferAction {
  type: 'transfer';
  from: ContainerId;
  to: ContainerId;
  rateTier: number;
}

/**
 * Activate action
 * Example: { type: 'activate', organ: 'muscles', tier: 3 }
 */
export interface ActivateAction {
  type: 'activate';
  organ: OrganId;
  tier: number;
}

export type RuleAction =
  | SetTierAction
  | ModifyTierAction
  | TransferAction
  | ActivateAction;

// === Rule Definition ===

/**
 * Single rule with condition and action
 */
export interface Rule {
  id: string;
  description?: string;
  priority: number;        // Lower = higher priority (evaluated first)
  condition: RuleCondition;
  action: RuleAction;
  enabled?: boolean;       // Default: true
}

// === Modifier Definition ===

/**
 * Modifier that adjusts tier after base rules
 * Example: degradation penalty, exercise bonus, boost effects
 */
export interface TierModifier {
  id: string;
  description?: string;
  type: 'degradation' | 'effect' | 'boost';
  condition?: RuleCondition;
  effect: ModifyTierAction;
  enabled?: boolean;
  ignoresDegradation?: boolean; // If true, this modifier bypasses degradation limits
  minBaseTier?: number; // Modifier only applies if base tier (before modifiers) >= this value
}

// === Organ Rule Configuration ===

/**
 * Complete rule set for an organ
 */
export interface OrganRuleSet {
  organ: OrganId | 'liver' | 'muscles';
  description?: string;

  // Base rules (evaluated by priority)
  rules: Rule[];

  // Modifiers applied after base tier determined
  modifiers?: TierModifier[];

  // Rate values for each tier
  rates: number[];

  // Constraints
  minTier?: number;  // Default: 0
  maxTier?: number;  // Default: rates.length - 1
  boostedMaxTier?: number; // Max tier when boost active (can exceed maxTier)
}

// === Complete Rules Configuration ===

export interface RulesConfig {
  version: string;
  liver: OrganRuleSet;
  pancreas: OrganRuleSet;
  muscles: OrganRuleSet;
}

// === Rule Evaluation Context ===

/**
 * Context provided to rule evaluator
 */
export interface RuleEvaluationContext {
  // Container levels
  containers: {
    liver: number;
    bg: number;
    metforminEffect: number;
    exerciseEffect: number;
    intenseExerciseEffect: number;
  };

  // Container capacities
  capacities: {
    liver: number;
    bg: number;
  };

  // Boost states
  boosts: {
    liverBoost: {
      isActive: boolean;
      charges: number;
      cooldownTicks: number;
    };
    pancreasBoost: {
      isActive: boolean;
      charges: number;
      cooldownTicks: number;
    };
  };

  // Degradation levels
  degradation: {
    liver: number;
    pancreas: number;
  };

  // Thresholds
  thresholds: {
    bgLow: number;
    bgTarget: number;
    bgHigh: number;
    bgCritical: number;
  };
}

// === Rule Evaluation Result ===

export interface RuleEvaluationResult {
  tier: number;
  matchedRules: string[];  // IDs of rules that matched
  appliedModifiers: string[];  // IDs of modifiers that applied
  finalRate: number;
}
