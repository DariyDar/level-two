import type {
  Ship,
  PlacedShip,
  DaySegment,
  SimpleDegradation,
} from '../types';
import { SHIP_SIZE_TO_HOURS, positionToSlotNumber } from '../types';

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

export interface SimulationState {
  // Time
  currentTick: number; // 0-17
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

  // Current rates (for display)
  currentLiverRate: number;
  currentMuscleRate: number;
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

  // Initial
  initialBG: number;
  initialLiver: number;
}

const DEFAULT_CONFIG: SimulationConfig = {
  liverCapacity: 100,
  bgCapacity: 400,
  bgLow: 70,
  bgTarget: 100,
  bgHigh: 200,
  bgCritical: 300,
  liverTransferRates: [0, 30, 50],
  muscleDrainRates: [0, 20, 30, 50, 70, 90],
  metforminDecayRate: 7,
  exerciseDecayRate: 50,
  liverBoostCooldown: 1,
  liverBoostDuration: 1,
  liverBoostTier: 2,
  pancreasBoostCooldown: 3,
  pancreasBoostDuration: 1,
  pancreasBoostTierBonus: 1,
  initialBG: 100,
  initialLiver: 0,
};

// === Simulation Engine ===

export class SimulationEngine {
  private state: SimulationState;
  private config: SimulationConfig;
  private ships: Map<string, Ship>;
  private degradation: SimpleDegradation;

  constructor(
    placedShips: PlacedShip[],
    allShips: Ship[],
    initialDegradation: SimpleDegradation,
    config: Partial<SimulationConfig> = {}
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.ships = new Map(allShips.map((s) => [s.id, s]));
    this.degradation = initialDegradation;

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
      currentLiverRate: 0,
      currentMuscleRate: 0,
    };
  }

  getState(): SimulationState {
    return this.state;
  }

  isComplete(): boolean {
    return this.state.isComplete;
  }

  // Main tick function - advances simulation by 1 hour
  tick(): SimulationState {
    if (this.state.isComplete) return this.state;

    // 1. Check if we need to start unloading a new ship
    this.checkShipQueue();

    // 2. Process ship unloading (adds to liver)
    this.processShipUnloading();

    // 3. Process effect decay
    this.processEffectDecay();

    // 4. Process liver → BG transfer
    this.processLiverTransfer();

    // 5. Process muscles drain (BG → utilization)
    this.processMuscleDrain();

    // 6. Update boost cooldowns
    this.updateBoostCooldowns();

    // 7. Record BG history
    this.state.bgHistory.push(this.state.containers.bg);

    // 8. Advance time
    this.state.currentTick++;
    this.updateSegment();

    // 9. Check completion
    if (this.state.currentTick >= 18) {
      this.state.isComplete = true;
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

  private checkShipQueue(): void {
    // If already unloading, skip
    if (this.state.unloadingShip) return;

    // Find next ship that should start this tick
    // Ships start when their slot's hour begins
    // Slot 1-3 = hour 0-2, slot 4-6 = hour 3-5, etc.
    const currentHour = this.state.currentTick;

    const nextShip = this.state.remainingShips.find((s) => {
      const slotHour = s.slotNumber - 1; // slot 1 = hour 0
      return slotHour <= currentHour;
    });

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

  private processShipUnloading(): void {
    const unloading = this.state.unloadingShip;
    if (!unloading) return;

    // Add load to target container
    const container = unloading.targetContainer;
    this.state.containers[container] += unloading.loadPerTick;

    // Clamp liver to capacity
    if (container === 'liver') {
      this.state.containers.liver = Math.min(
        this.state.containers.liver,
        this.config.liverCapacity
      );
    }

    // Decrease remaining ticks
    unloading.remainingTicks--;

    // Check if done
    if (unloading.remainingTicks <= 0) {
      this.state.unloadingShip = null;
    }
  }

  private processEffectDecay(): void {
    // Metformin decay
    this.state.containers.metforminEffect = Math.max(
      0,
      this.state.containers.metforminEffect - this.config.metforminDecayRate
    );

    // Exercise decay
    this.state.containers.exerciseEffect = Math.max(
      0,
      this.state.containers.exerciseEffect - this.config.exerciseDecayRate
    );
  }

  private processLiverTransfer(): void {
    const { liver, bg } = this.state.containers;
    const { bgTarget, bgHigh, liverCapacity, liverTransferRates } = this.config;

    // Determine transfer tier
    let tier = 0;

    // Liver boost active = force tier 2
    if (this.state.liverBoost.isActive) {
      tier = this.config.liverBoostTier;
    }
    // Liver overflow = tier 2 (emergency dump)
    else if (liver >= liverCapacity * 0.9) {
      tier = 2;
    }
    // BG low = tier 1 (release glucose)
    else if (bg <= bgTarget) {
      tier = 1;
    }
    // BG high = tier 0 (stop release)
    else if (bg >= bgHigh) {
      tier = 0;
    }
    // Normal = tier 1
    else {
      tier = 1;
    }

    const rate = liverTransferRates[tier] || 0;
    this.state.currentLiverRate = rate;

    // Transfer from liver to BG
    const transfer = Math.min(rate, liver);
    this.state.containers.liver -= transfer;
    this.state.containers.bg += transfer;

    // Clamp BG
    this.state.containers.bg = Math.min(
      this.state.containers.bg,
      this.config.bgCapacity
    );
  }

  private processMuscleDrain(): void {
    const { bg } = this.state.containers;
    const { bgTarget, bgHigh, bgCritical, muscleDrainRates } = this.config;

    // Determine base tier based on BG level (Pancreas response)
    let tier = 0;

    if (bg <= bgTarget) {
      tier = 0; // Low BG = no drain
    } else if (bg <= bgHigh) {
      tier = 2; // Normal high = moderate drain
    } else if (bg <= bgCritical) {
      tier = 3; // High = increased drain
    } else {
      tier = 4; // Critical = maximum drain
    }

    // Apply degradation penalty (reduce max tier)
    const degradationPenalty = Math.floor(this.degradation.pancreas / 25);
    const maxTier = Math.max(0, muscleDrainRates.length - 1 - degradationPenalty);
    tier = Math.min(tier, maxTier);

    // Apply exercise bonus
    if (this.state.containers.exerciseEffect > 50) {
      tier = Math.min(tier + 1, maxTier);
    }

    // Apply pancreas boost
    if (this.state.pancreasBoost.isActive) {
      tier = Math.min(tier + this.config.pancreasBoostTierBonus, maxTier);
    }

    const rate = muscleDrainRates[tier] || 0;
    this.state.currentMuscleRate = rate;

    // Drain from BG
    this.state.containers.bg = Math.max(0, this.state.containers.bg - rate);
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
