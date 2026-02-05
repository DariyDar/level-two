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
  currentMuscleTier: number; // Tier assigned by pancreas
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

  // Boosts
  liverBoostCooldown: number;
  liverBoostDuration: number;
  liverBoostTier: number;
  pancreasBoostCooldown: number;
  pancreasBoostDuration: number;
  pancreasBoostTierBonus: number;

  // Timing (Substep Simulation)
  substepsPerHour: number; // Number of substeps per interpreted hour

  // Initial
  initialBG: number;
  initialLiver: number;
}

// Default configuration values - Updated to match Excel v0.6 "System Parameters" sheet
// Naming convention: bg = BGContainer, liver = LiverContainer (see types.ts for full mapping)
const DEFAULT_CONFIG: SimulationConfig = {
  liverCapacity: 100, // LiverContainer capacity (Excel: 100 mg/dL)
  bgCapacity: 400, // BGContainer capacity (Excel: 400 mg/dL)
  bgLow: 70,
  bgTarget: 100,
  bgHigh: 200,
  bgCritical: 300,
  liverTransferRates: [0, 50, 75], // Excel v0.6: Tier 0=0, Tier 1=50, Tier 2=75 mg/dL/hour
  muscleDrainRates: [0, 30, 35, 40, 45, 50], // Excel v0.6: Linear 30→50 progression
  metforminDecayRate: 7, // TODO: Excel v0.6 specifies 10/hour (to be updated in v0.4.0)
  exerciseDecayRate: 100, // Excel v0.6: 100/hour (1 hour to full decay)
  liverBoostCooldown: 3, // Excel v0.6: 3 hours
  liverBoostDuration: 1,
  liverBoostTier: 2,
  pancreasBoostCooldown: 3,
  pancreasBoostDuration: 1,
  pancreasBoostTierBonus: 1,
  substepsPerHour: 10, // Substep simulation: 10 substeps per interpreted hour for smooth animation
  initialBG: 100,
  initialLiver: 0,
};

// === Helper Functions ===

/**
 * Convert SimpleDegradation (buffer values) to DegradationState (tier-based)
 */
function convertToDegradationState(simple: SimpleDegradation): DegradationState {
  const liverConfig = degradationConfig.organs.liver;
  const pancreasConfig = degradationConfig.organs.pancreas;

  // Calculate liver tier from buffer
  const liverTier = liverConfig.tierThresholds.findIndex(
    (t) => simple.liver >= t.bufferMin && simple.liver <= t.bufferMax
  );
  const liverTierEffect = liverConfig.tierEffects[liverTier >= 0 ? liverTier : 0];

  // Calculate pancreas tier from buffer
  const pancreasTier = pancreasConfig.tierThresholds.findIndex(
    (t) => simple.pancreas >= t.bufferMin && simple.pancreas <= t.bufferMax
  );
  const pancreasTierEffect = pancreasConfig.tierEffects[pancreasTier >= 0 ? pancreasTier : 0];

  return {
    liver: {
      tier: liverTier >= 0 ? liverTier : 0,
      tierEffects: {
        capacityReduction: liverTierEffect?.capacityReduction ?? 0,
      },
    },
    pancreas: {
      tier: pancreasTier >= 0 ? pancreasTier : 0,
      tierEffects: {
        maxTierReduction: pancreasTierEffect?.maxTierReduction ?? 0,
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
        charges: 2,
        maxCharges: 2,
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
      currentMuscleTier: 0,
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
  }

  private processLiverTransfer(substepFraction: number): void {
    const context = this.buildRuleContext();
    const result = RuleEngine.evaluateOrganRules(this.rulesConfig.liver, context);

    this.state.currentLiverRate = result.finalRate;

    // Transfer from liver to BG (proportional to substep fraction)
    const liver = this.state.containers.liver;
    const transfer = Math.min(result.finalRate * substepFraction, liver);
    this.state.containers.liver -= transfer;
    this.state.containers.bg += transfer;

    // Clamp BG
    this.state.containers.bg = Math.min(
      this.state.containers.bg,
      this.config.bgCapacity
    );
  }

  private processPancreasRegulation(): void {
    // Pancreas monitors BG and determines muscle activation tier
    const context = this.buildRuleContext();
    const result = RuleEngine.evaluateOrganRules(this.rulesConfig.pancreas, context);

    this.state.currentMuscleTier = result.tier;
  }

  private processMuscleDrain(substepFraction: number): void {
    // Muscles use tier assigned by pancreas, then apply modifiers
    const muscleConfig = this.rulesConfig.muscles;
    const context = this.buildRuleContext();

    let tier = this.state.currentMuscleTier;

    // Apply muscle modifiers (degradation, exercise, boost)
    const modifiers = muscleConfig.modifiers ?? [];
    for (const modifier of modifiers) {
      if (!modifier.condition) continue;
      const conditionMet = RuleEngine.evaluateCondition(modifier.condition, context);

      if (conditionMet) {
        if (modifier.effect.type === 'addTier') {
          tier += modifier.effect.amount;
        } else if (modifier.effect.type === 'subtractTier') {
          tier -= modifier.effect.amount;
        }
      }
    }

    // Clamp tier to valid range, accounting for pancreas degradation
    const minTier = muscleConfig.minTier ?? 0;
    const maxTier = muscleConfig.maxTier ?? (muscleConfig.rates.length - 1);
    const effectiveMaxTier = Math.max(
      minTier,
      maxTier - this.state.degradation.pancreas.tierEffects.maxTierReduction
    );
    tier = Math.max(minTier, Math.min(tier, effectiveMaxTier));
    const drainRate = muscleConfig.rates[tier] ?? 0;

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
