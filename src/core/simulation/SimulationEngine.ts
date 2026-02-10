import type {
  Ship,
  PlacedShip,
  DaySegment,
  SimpleDegradation,
  DegradationState,
} from '../types';
import { SHIP_SIZE_TO_HOURS, positionToSlotNumber } from '../types';
import { RuleEngine } from '../rules/RuleEngine';
import type { RulesConfig, RuleEvaluationContext } from '../rules/types';
import organRulesConfig from '../../config/organRules.json';
import degradationConfig from '../../config/degradationConfig.json';

// === Simulation State Types ===

export interface ContainerLevel {
  liver: number;
  bg: number;
  metforminEffect: number;
  exerciseEffect: number;
  intenseExerciseEffect: number;
}

export interface UnloadingShip {
  instanceId: string;
  shipId: string;
  remainingTicks: number;
  totalTicks: number;
  loadPerTick: number;
  targetContainer: keyof ContainerLevel;
}

export interface BoostState {
  charges: number;
  maxCharges: number;
  cooldownTicks: number;
  isActive: boolean;
  activeTicks: number;
}

export interface DegradationBuffer {
  liver: number;
  pancreas: number;
}

export interface SimulationState {
  // Time
  currentTick: number; // 0-17 (interpreted hours)
  currentSubstep: number; // 0 to (substepsPerHour - 1)
  currentSegment: DaySegment;
  isComplete: boolean;

  // Containers
  containers: ContainerLevel;

  // Ships
  unloadingShip: UnloadingShip | null;
  remainingShips: QueuedShip[];

  // History for graph
  bgHistory: number[];

  // Boosts
  liverBoost: BoostState;
  pancreasBoost: BoostState;

  // Degradation (tier-based system)
  degradation: DegradationState;
  degradationBuffer: DegradationBuffer;

  // Current rates (for display)
  currentLiverRate: number;
  currentMuscleRate: number;
  currentPancreasTier: number; // Raw tier from pancreas rules (before degradation)
  currentMuscleTier: number; // Final tier for muscles (after all modifiers)
  isFastInsulinActive: boolean; // Whether Fast Insulin boost is active
  isLiverPassthrough: boolean; // Liver overflow pass-through mode active
}

interface QueuedShip {
  instanceId: string;
  shipId: string;
  slotNumber: number;
}

// === Configuration ===

export interface SimulationConfig {
  // Container capacities
  liverCapacity: number;
  bgCapacity: number;

  // Thresholds
  bgLow: number;
  bgTarget: number;
  bgHigh: number;
  bgCritical: number;

  // Rates
  liverTransferRates: number[]; // [tier0, tier1, tier2]
  muscleDrainRates: number[]; // [tier0, tier1, tier2, tier3, tier4, tier5]

  // Effect decay
  metforminDecayRate: number;
  exerciseDecayRate: number;
  intenseExerciseDecayRate: number;

  // Boosts
  liverBoostCooldown: number;
  liverBoostDuration: number;
  liverBoostTier: number;
  pancreasBoostCooldown: number;
  pancreasBoostDuration: number;
  pancreasBoostTierBonus: number;

  // Timing (Substep Simulation)
  substepsPerHour: number; // Number of substeps per interpreted hour

  // Charges
  pancreasBoostCharges: number;

  // Initial
  initialBG: number;
  initialLiver: number;
}

// Default configuration values - Updated to match Excel v0.6 "System Parameters" sheet
// Naming convention: bg = BGContainer, liver = LiverContainer (see types.ts for full mapping)
const DEFAULT_CONFIG: SimulationConfig = {
  liverCapacity: 100, // LiverContainer capacity
  bgCapacity: 400, // BGContainer capacity (Excel: 400 mg/dL)
  bgLow: 70,
  bgTarget: 100,
  bgHigh: 200,
  bgCritical: 300,
  liverTransferRates: [0, 50, 75], // Excel v0.6: Tier 0=0, Tier 1=50, Tier 2=75 mg/dL/hour
  muscleDrainRates: [0, 30, 35, 40, 45, 50], // Excel v0.6: Linear 30→50 progression
  metforminDecayRate: 7, // TODO: Excel v0.6 specifies 10/hour (to be updated in v0.4.0)
  exerciseDecayRate: 20, // 20/hour (load 60 decays over 3 hours)
  intenseExerciseDecayRate: 0, // Intense exercise never decays (persists all day)
  liverBoostCooldown: 3, // Excel v0.6: 3 hours
  liverBoostDuration: 1,
  liverBoostTier: 2,
  pancreasBoostCooldown: 3,
  pancreasBoostDuration: 1,
  pancreasBoostTierBonus: 1,
  substepsPerHour: 10, // Substep simulation: 10 substeps per interpreted hour for smooth animation
  pancreasBoostCharges: 2,
  initialBG: 100,
  initialLiver: 0,
};

// === Helper Functions ===

/**
 * Convert SimpleDegradation (buffer values) to DegradationState (tier-based)
 * Tiers are now 1-5 for both organs (1 = healthy/non-burnable)
 */
function convertToDegradationState(simple: SimpleDegradation): DegradationState {
  const liverConfig = degradationConfig.organs.liver;
  const pancreasConfig = degradationConfig.organs.pancreas;

  // Calculate liver tier from buffer (tiers 1-5, where 1 is healthy)
  const liverThreshold = liverConfig.tierThresholds.find(
    (t: { bufferMin: number; bufferMax: number }) =>
      simple.liver >= t.bufferMin && simple.liver <= t.bufferMax
  );
  const liverTier = (liverThreshold as { tier: number })?.tier ?? 1;
  const liverTierEffect = liverConfig.tierEffects.find(
    (e: { tier: number }) => e.tier === liverTier
  );

  // Calculate pancreas tier from buffer (tiers 1-5, where 1 is healthy)
  const pancreasThreshold = pancreasConfig.tierThresholds.find(
    (t: { bufferMin: number; bufferMax: number }) =>
      simple.pancreas >= t.bufferMin && simple.pancreas <= t.bufferMax
  );
  const pancreasTier = (pancreasThreshold as { tier: number })?.tier ?? 1;
  const pancreasTierEffect = pancreasConfig.tierEffects.find(
    (e: { tier: number }) => e.tier === pancreasTier
  );

  return {
    liver: {
      tier: liverTier,
      tierEffects: {
        capacityReduction: (liverTierEffect as { capacityReduction?: number })?.capacityReduction ?? 0,
      },
    },
    pancreas: {
      tier: pancreasTier,
      tierEffects: {
        maxTierReduction: (pancreasTierEffect as { maxTierReduction?: number })?.maxTierReduction ?? 0,
      },
    },
  };
}

// === Simulation Engine ===

export class SimulationEngine {
  private state: SimulationState;
  private config: SimulationConfig;
  private ships: Map<string, Ship>;
  private rulesConfig: RulesConfig;

  constructor(
    placedShips: PlacedShip[],
    allShips: Ship[],
    initialDegradation: SimpleDegradation,
    config: Partial<SimulationConfig> = {}
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.ships = new Map(allShips.map((s) => [s.id, s]));
    this.rulesConfig = organRulesConfig as RulesConfig;

    // Convert placed ships to queue, sorted by slot number
    const queue: QueuedShip[] = placedShips
      .map((p) => ({
        instanceId: p.instanceId,
        shipId: p.shipId,
        slotNumber: positionToSlotNumber({
          segment: p.segment,
          row: p.row,
          index: p.startSlot as 0 | 1 | 2,
        }),
      }))
      .sort((a, b) => a.slotNumber - b.slotNumber);

    this.state = {
      currentTick: 0,
      currentSubstep: 0,
      currentSegment: 'Morning',
      isComplete: false,
      containers: {
        liver: this.config.initialLiver,
        bg: this.config.initialBG,
        metforminEffect: 0,
        exerciseEffect: 0,
        intenseExerciseEffect: 0,
      },
      unloadingShip: null,
      remainingShips: queue,
      bgHistory: [this.config.initialBG],
      liverBoost: {
        charges: 3, // Will be set from level config
        maxCharges: 3,
        cooldownTicks: 0,
        isActive: false,
        activeTicks: 0,
      },
      pancreasBoost: {
        charges: this.config.pancreasBoostCharges,
        maxCharges: this.config.pancreasBoostCharges,
        cooldownTicks: 0,
        isActive: false,
        activeTicks: 0,
      },
      degradation: convertToDegradationState(initialDegradation),
      degradationBuffer: {
        liver: initialDegradation.liver,
        pancreas: initialDegradation.pancreas,
      },
      currentLiverRate: 0,
      currentMuscleRate: 0,
      currentPancreasTier: 0,
      currentMuscleTier: 0,
      isFastInsulinActive: false,
      isLiverPassthrough: false,
    };
  }

  getState(): SimulationState {
    return this.state;
  }

  getSubstepsPerHour(): number {
    return this.config.substepsPerHour;
  }

  isComplete(): boolean {
    return this.state.isComplete;
  }

  // Main tick function - advances simulation by 1 substep
  // Substep simulation: each interpreted hour is divided into N substeps for smooth animation
  tick(): SimulationState {
    if (this.state.isComplete) return this.state;

    const substepFraction = 1 / this.config.substepsPerHour;
    const isHourBoundary = this.state.currentSubstep === 0;

    // === DISCRETE EVENTS (only at hour boundary) ===
    if (isHourBoundary) {
      // 1. Check if we need to start unloading a new ship
      this.checkShipQueue();
    }

    // === CONTINUOUS PROCESSES (every substep) ===

    // 2. Process ship unloading (adds to liver)
    this.processShipUnloading(substepFraction);

    // 3. Process effect decay
    this.processEffectDecay(substepFraction);

    // 4. Process liver → BG transfer
    this.processLiverTransfer(substepFraction);

    // 4.5. Process pancreas regulation (determines muscle tier)
    this.processPancreasRegulation();

    // 5. Process muscles drain (BG → utilization)
    this.processMuscleDrain(substepFraction);

    // 6. Degradation accumulation disabled - now handled in Results Phase
    // this.processDegradationAccumulation(substepFraction);

    // === SUBSTEP ADVANCEMENT ===
    this.state.currentSubstep++;

    // === HOUR BOUNDARY EVENTS ===
    if (this.state.currentSubstep >= this.config.substepsPerHour) {
      this.state.currentSubstep = 0;

      // 7. Degradation tier updates disabled - tiers stay constant during simulation
      // this.updateDegradationTiers();

      // 8. Update boost cooldowns (hour boundary)
      this.updateBoostCooldowns();

      // 9. Record BG history (hour boundary)
      this.state.bgHistory.push(this.state.containers.bg);

      // 10. Advance time (hour boundary)
      this.state.currentTick++;
      this.updateSegment();

      // 9. Check completion (hour boundary)
      if (this.state.currentTick >= 18) {
        this.state.isComplete = true;
      }
    }

    return this.state;
  }

  // Player actions
  activateLiverBoost(): boolean {
    const boost = this.state.liverBoost;
    if (boost.charges <= 0 || boost.cooldownTicks > 0 || boost.isActive) {
      return false;
    }

    boost.charges--;
    boost.isActive = true;
    boost.activeTicks = this.config.liverBoostDuration;
    boost.cooldownTicks = this.config.liverBoostCooldown;
    return true;
  }

  activatePancreasBoost(): boolean {
    const boost = this.state.pancreasBoost;
    if (boost.charges <= 0 || boost.cooldownTicks > 0 || boost.isActive) {
      return false;
    }

    boost.charges--;
    boost.isActive = true;
    boost.activeTicks = this.config.pancreasBoostDuration;
    boost.cooldownTicks = this.config.pancreasBoostCooldown;
    return true;
  }

  // === Private methods ===

  /**
   * Build evaluation context for rule engine
   */
  private buildRuleContext(): RuleEvaluationContext {
    // Calculate effective liver capacity (reduced by degradation)
    const effectiveLiverCapacity = Math.max(
      0,
      this.config.liverCapacity - this.state.degradation.liver.tierEffects.capacityReduction
    );

    return {
      containers: {
        liver: this.state.containers.liver,
        bg: this.state.containers.bg,
        metforminEffect: this.state.containers.metforminEffect,
        exerciseEffect: this.state.containers.exerciseEffect,
        intenseExerciseEffect: this.state.containers.intenseExerciseEffect,
      },
      capacities: {
        liver: effectiveLiverCapacity,
        bg: this.config.bgCapacity,
      },
      boosts: {
        liverBoost: {
          isActive: this.state.liverBoost.isActive,
          charges: this.state.liverBoost.charges,
          cooldownTicks: this.state.liverBoost.cooldownTicks,
        },
        pancreasBoost: {
          isActive: this.state.pancreasBoost.isActive,
          charges: this.state.pancreasBoost.charges,
          cooldownTicks: this.state.pancreasBoost.cooldownTicks,
        },
      },
      degradation: {
        liver: this.state.degradationBuffer.liver,
        pancreas: this.state.degradationBuffer.pancreas,
      },
      thresholds: {
        bgLow: this.config.bgLow,
        bgTarget: this.config.bgTarget,
        bgHigh: this.config.bgHigh,
        bgCritical: this.config.bgCritical,
      },
    };
  }

  private checkShipQueue(): void {
    // If already unloading, skip
    if (this.state.unloadingShip) return;

    // Find next ship in queue (they're already sorted by slot number)
    // Ships unload sequentially - when one finishes, next one starts
    const nextShip = this.state.remainingShips[0];

    if (nextShip) {
      const ship = this.ships.get(nextShip.shipId);
      if (ship) {
        const totalTicks = SHIP_SIZE_TO_HOURS[ship.size];
        const targetContainer = ship.loadType === 'Glucose' ? 'liver' :
          (ship.targetContainer as keyof ContainerLevel);

        this.state.unloadingShip = {
          instanceId: nextShip.instanceId,
          shipId: nextShip.shipId,
          remainingTicks: totalTicks,
          totalTicks,
          loadPerTick: ship.load / totalTicks,
          targetContainer,
        };

        // Remove from queue
        this.state.remainingShips = this.state.remainingShips.filter(
          (s) => s.instanceId !== nextShip.instanceId
        );
      }
    }
  }

  private processShipUnloading(substepFraction: number): void {
    const unloading = this.state.unloadingShip;
    if (!unloading) return;

    // Add load to target container (proportional to substep fraction)
    const container = unloading.targetContainer;
    this.state.containers[container] += unloading.loadPerTick * substepFraction;

    // Clamp liver to effective capacity (reduced by degradation)
    if (container === 'liver') {
      const effectiveLiverCapacity = Math.max(
        0,
        this.config.liverCapacity - this.state.degradation.liver.tierEffects.capacityReduction
      );
      this.state.containers.liver = Math.min(
        this.state.containers.liver,
        effectiveLiverCapacity
      );
    }

    // Decrease remaining ticks (only on hour boundary, handled in tick())
    // Note: unloading progress is now smooth across substeps
    unloading.remainingTicks -= substepFraction;

    // Check if done
    if (unloading.remainingTicks <= 0) {
      this.state.unloadingShip = null;
    }
  }

  private processEffectDecay(substepFraction: number): void {
    // Metformin decay (proportional to substep fraction)
    this.state.containers.metforminEffect = Math.max(
      0,
      this.state.containers.metforminEffect - this.config.metforminDecayRate * substepFraction
    );

    // Exercise decay (proportional to substep fraction)
    this.state.containers.exerciseEffect = Math.max(
      0,
      this.state.containers.exerciseEffect - this.config.exerciseDecayRate * substepFraction
    );

    // Intense exercise decay (rate=0, so this is a no-op — persists all day)
    this.state.containers.intenseExerciseEffect = Math.max(
      0,
      this.state.containers.intenseExerciseEffect - this.config.intenseExerciseDecayRate * substepFraction
    );
  }

  private processLiverTransfer(substepFraction: number): void {
    const context = this.buildRuleContext();
    const result = RuleEngine.evaluateOrganRules(this.rulesConfig.liver, context);

    // Calculate effective liver capacity (with degradation)
    const effectiveLiverCapacity = Math.max(
      0,
      this.config.liverCapacity - this.state.degradation.liver.tierEffects.capacityReduction
    );

    let transferRate = result.finalRate;

    // Overflow pass-through mode:
    // If liver is ≥95% full and a ship is unloading, match output to input rate
    // This "pushes out" glucose at the same rate it comes in
    // Note: Liver Boost takes priority (uses its own Tier 2 rate)
    const liverFillPercent = effectiveLiverCapacity > 0
      ? this.state.containers.liver / effectiveLiverCapacity
      : 0;
    const isOverflow = liverFillPercent >= 0.95;
    const shipUnloadRate = this.state.unloadingShip?.loadPerTick ?? 0;

    const isPassthrough = isOverflow && shipUnloadRate > 0 && !this.state.liverBoost.isActive;
    if (isPassthrough) {
      // Pass-through mode: output rate = input rate (glucose "pushed out")
      transferRate = shipUnloadRate;
    }

    this.state.isLiverPassthrough = isPassthrough;
    this.state.currentLiverRate = transferRate;

    // Transfer from liver to BG (proportional to substep fraction)
    const liver = this.state.containers.liver;
    const transfer = Math.min(transferRate * substepFraction, liver);
    this.state.containers.liver -= transfer;
    this.state.containers.bg += transfer;

    // Clamp BG
    this.state.containers.bg = Math.min(
      this.state.containers.bg,
      this.config.bgCapacity
    );
  }

  private processPancreasRegulation(): void {
    // Pancreas monitors BG and determines insulin secretion tier
    const context = this.buildRuleContext();
    const result = RuleEngine.evaluateOrganRules(this.rulesConfig.pancreas, context);

    // Store raw pancreas tier (before degradation)
    const rawPancreasTier = result.tier;
    this.state.currentPancreasTier = rawPancreasTier;

    // Check if Fast Insulin is active
    const isFastInsulinActive = this.state.pancreasBoost.isActive;
    this.state.isFastInsulinActive = isFastInsulinActive;

    // Apply degradation to pancreas tier (unless Fast Insulin is active)
    let effectivePancreasTier = rawPancreasTier;
    if (!isFastInsulinActive) {
      const maxTierReduction = this.state.degradation.pancreas.tierEffects.maxTierReduction;
      const maxAllowedTier = Math.max(0, 5 - maxTierReduction);
      effectivePancreasTier = Math.min(rawPancreasTier, maxAllowedTier);
    }

    // Pancreas tier becomes base muscle tier
    this.state.currentMuscleTier = effectivePancreasTier;
  }

  private processMuscleDrain(substepFraction: number): void {
    // Muscles use tier from pancreas (already has degradation applied), then apply modifiers
    const muscleConfig = this.rulesConfig.muscles;
    const context = this.buildRuleContext();

    let tier = this.state.currentMuscleTier;
    const baseTier = tier; // Save base tier from pancreas (before modifiers)
    const isFastInsulinActive = this.state.isFastInsulinActive;

    // Apply muscle modifiers (exercise, Fast Insulin)
    // Note: degradation is now applied in processPancreasRegulation
    const modifiers = muscleConfig.modifiers ?? [];
    for (const modifier of modifiers) {
      if (!modifier.condition) continue;

      // Skip modifier if base tier doesn't meet minimum requirement
      // (e.g., exercise only works when muscles activated by pancreas)
      if (modifier.minBaseTier !== undefined && baseTier < modifier.minBaseTier) continue;

      const conditionMet = RuleEngine.evaluateCondition(modifier.condition, context);

      if (conditionMet) {
        if (modifier.effect.type === 'addTier') {
          tier += modifier.effect.amount;
        } else if (modifier.effect.type === 'subtractTier') {
          tier -= modifier.effect.amount;
        }
      }
    }

    // Determine max tier based on whether Fast Insulin is active
    const minTier = muscleConfig.minTier ?? 0;
    const baseMaxTier = muscleConfig.maxTier ?? 5;
    const boostedMaxTier = muscleConfig.boostedMaxTier ?? baseMaxTier;

    // Fast Insulin allows access to boosted max tier (6) and ignores degradation
    // Otherwise, degradation reduces max tier
    let effectiveMaxTier: number;
    if (isFastInsulinActive) {
      effectiveMaxTier = boostedMaxTier; // Can reach tier 6
    } else {
      const maxTierReduction = this.state.degradation.pancreas.tierEffects.maxTierReduction;
      effectiveMaxTier = Math.max(minTier, baseMaxTier - maxTierReduction);
    }

    tier = Math.max(minTier, Math.min(tier, effectiveMaxTier));
    this.state.currentMuscleTier = tier; // Update with final tier after modifiers

    const drainRate = muscleConfig.rates[tier] ?? muscleConfig.rates[muscleConfig.rates.length - 1] ?? 0;

    this.state.currentMuscleRate = drainRate;

    // Drain from BG (proportional to substep fraction)
    this.state.containers.bg = Math.max(0, this.state.containers.bg - drainRate * substepFraction);
  }

  private updateBoostCooldowns(): void {
    // Liver boost
    if (this.state.liverBoost.isActive) {
      this.state.liverBoost.activeTicks--;
      if (this.state.liverBoost.activeTicks <= 0) {
        this.state.liverBoost.isActive = false;
      }
    }
    if (this.state.liverBoost.cooldownTicks > 0) {
      this.state.liverBoost.cooldownTicks--;
    }

    // Pancreas boost
    if (this.state.pancreasBoost.isActive) {
      this.state.pancreasBoost.activeTicks--;
      if (this.state.pancreasBoost.activeTicks <= 0) {
        this.state.pancreasBoost.isActive = false;
      }
    }
    if (this.state.pancreasBoost.cooldownTicks > 0) {
      this.state.pancreasBoost.cooldownTicks--;
    }
  }

  private updateSegment(): void {
    const tick = this.state.currentTick;
    if (tick < 6) {
      this.state.currentSegment = 'Morning';
    } else if (tick < 12) {
      this.state.currentSegment = 'Day';
    } else {
      this.state.currentSegment = 'Evening';
    }
  }
}
