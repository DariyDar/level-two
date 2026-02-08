// ============================================
// Core Types for Port Management Game
// ============================================

// === Enums / Unions ===

export type ShipSize = 'S' | 'M' | 'L';

export type LoadType = 'Glucose' | 'Treatment';

export type DaySegment = 'Morning' | 'Day' | 'Evening';

export type GamePhase = 'Planning' | 'Simulation' | 'Results';

// === Willpower Points ===

export const DEFAULT_WP_BUDGET = 16;

// Naming Convention Mapping (Excel v0.6 ↔ Code):
// Containers (store substances):
//   'bg' (code) = BGContainer (Excel) - blood glucose
//   'liver' (code) = LiverContainer (Excel) - liver glucose buffer
//   'metforminEffect' (code) = Metformin Effect Container (Excel)
//   'exerciseEffect' (code) = Exercise Effect Container (Excel)
export type ContainerId =
  | 'liver'
  | 'bg'
  | 'metforminEffect'
  | 'exerciseEffect'
  | 'intenseExerciseEffect';

// Organs (process/utilize substances):
//   'liver' (code) = Liver (Excel) - organ with container
//   'pancreas' (code) = Pancreas (Excel) - controls insulin response
//   'muscles' (code) = Muscle (Excel) - glucose utilization
export type OrganId = 'liver' | 'pancreas' | 'muscles';

// === Constants ===

export const SHIP_SIZE_TO_SLOTS: Record<ShipSize, number> = {
  S: 1,
  M: 2,
  L: 3,
};

export const SHIP_SIZE_TO_HOURS: Record<ShipSize, number> = {
  S: 1,
  M: 2,
  L: 3,
};

export const DAY_SEGMENTS: DaySegment[] = ['Morning', 'Day', 'Evening'];

export const SLOTS_PER_ROW = 3;
export const ROWS_PER_SEGMENT = 2;
export const SLOTS_PER_SEGMENT = SLOTS_PER_ROW * ROWS_PER_SEGMENT; // 6
export const TOTAL_SLOTS = SLOTS_PER_SEGMENT * DAY_SEGMENTS.length; // 18

export const HOURS_PER_SEGMENT = 6;
export const TOTAL_HOURS = HOURS_PER_SEGMENT * DAY_SEGMENTS.length; // 18

export const STARTING_HOUR = 6; // 06:00

// === Ship Models ===

export interface Ship {
  id: string;
  name: string;
  emoji: string;
  size: ShipSize;
  load: number;
  carbs?: number; // Carbohydrates in grams (for display on food ships)
  loadType: LoadType;
  targetContainer: ContainerId;
  description?: string;
  wpCost?: number; // Willpower cost (0-9, 0 = free)
  fiber?: boolean; // Fiber content (displays leaf icon)
  group?: string; // Group for per-segment limits (e.g., "exercise")
  requiresEmptySlotBefore?: boolean; // Previous slot must not contain food
}

export interface PlacedShip {
  instanceId: string;
  shipId: string;
  segment: DaySegment;
  row: 0 | 1;
  startSlot: number;
  isPreOccupied?: boolean; // Can't be moved or removed
}

// === Container Models ===

export interface ContainerState {
  id: ContainerId;
  level: number;
  capacity: number;
  decayRate?: number;
}

export type ContainerStates = Record<ContainerId, ContainerState>;

export interface BGThresholds {
  low: number;      // 70
  target: number;   // 100
  high: number;     // 200
  critical: number; // 300
}

// === Degradation Models ===

// v0.5.0: Tier-based degradation system
export interface DegradationState {
  liver: {
    tier: number;        // Current degradation tier (0-5)
    tierEffects: {
      capacityReduction: number; // mg/dL reduction from base capacity
    };
  };
  pancreas: {
    tier: number;        // Current degradation tier (0-4)
    tierEffects: {
      maxTierReduction: number; // Reduction in max muscle activation tier
    };
  };
}

// Legacy type for backward compatibility
export type SimpleDegradation = {
  liver: number;
  pancreas: number;
};

// === Level Config ===

export interface AvailableFood {
  id: string;
  count: number;
}

export interface PreOccupiedSlot {
  slot: number;  // 1-18 (sequential slot number)
  shipId: string;
}

export interface SegmentCarbLimits {
  min: number;
  optimal: number;
  max: number;
}

export interface DayConfig {
  day: number;
  availableFoods: AvailableFood[];
  availableInterventions: AvailableFood[];
  preOccupiedSlots?: PreOccupiedSlot[];
  blockedSlots?: number[]; // Slot numbers (1-18) that cannot accept any cards
  wpBudget?: number; // Override WP budget for this day
  // Legacy day-level carb requirements
  carbRequirements?: {
    min: number;
    max: number;
  };
  // Segment-level carb requirements (preferred)
  segmentCarbs?: {
    Morning?: SegmentCarbLimits;
    Day?: SegmentCarbLimits;
    Evening?: SegmentCarbLimits;
  };
}

export interface LevelConfig {
  id: string;
  name: string;
  description?: string;
  days: number;
  initialBG?: number; // Starting BG level (default 100)
  wpBudget?: number; // Level-wide WP budget override
  // Legacy fields (used if dayConfigs not present)
  availableFoods?: AvailableFood[];
  carbRequirements?: {
    min: number;
    max: number;
  };
  // Day-specific configs (overrides legacy fields)
  dayConfigs?: DayConfig[];
  availableInterventions?: AvailableFood[]; // Legacy: level-wide (use dayConfigs instead)
  preOccupiedSlots?: PreOccupiedSlot[];
  initialDegradation?: SimpleDegradation;
  interventionCharges: {
    liverBoost: number;
    pancreasBoost: number;
  };
  winCondition: {
    maxDegradationCircles?: number; // Default: 5. Defeat if circles >= this value
  };
}

// === Results Models ===

export type DayAssessment = 'Excellent' | 'Decent' | 'Poor' | 'Defeat';

export const DEFAULT_ASSESSMENT_THRESHOLDS = {
  excellent: 0,  // 0 circles
  decent: 1,     // 1 circle
  poor: 2,       // 2-3 circles
  defeat: 4,     // 4-5 circles
} as const;

export interface DayMetrics {
  averageBG: number;
  minBG: number;
  maxBG: number;
  timeInRange: number;
  timeAboveHigh: number;
  timeAboveCritical: number;
  timeBelowLow: number;
  excessBG: number;
}

export interface DegradationBuffer {
  totalCircles: number;      // 0-5 circles activated based on excessBG
  distribution: {
    liver: number;            // Number of circles assigned to liver
    pancreas: number;         // Number of circles assigned to pancreas
  };
}

export interface DayResults {
  day: number;
  bgHistory: number[];
  metrics: DayMetrics;
  degradation: SimpleDegradation;
  degradationBuffer: DegradationBuffer;
  assessment: DayAssessment;
}

// === Slot Models ===

export interface SlotPosition {
  segment: DaySegment;
  row: 0 | 1;
  index: 0 | 1 | 2;
}

export type SlotId = `${DaySegment}-${0 | 1}-${0 | 1 | 2}`;

// === Validation ===

export interface SegmentValidation {
  segment: DaySegment;
  currentCarbs: number;
  min: number;
  optimal: number;
  max: number;
}

export interface PlanValidation {
  isValid: boolean;
  totalCarbs: number;
  minCarbs: number;
  maxCarbs: number;
  segments: SegmentValidation[];
  errors: string[];
  warnings: string[];
}

// === Boost Config ===

export interface BoostConfig {
  cooldownHours: number;
  durationHours: number;
  rateTier?: number;    // For Liver Boost
  tierBonus?: number;   // For Pancreas Boost
}

export interface BoostsConfig {
  liverBoost: BoostConfig;
  pancreasBoost: BoostConfig;
}

// === Type Guards ===

export function isGlucoseShip(ship: Ship): boolean {
  return ship.loadType === 'Glucose';
}

export function isTreatmentShip(ship: Ship): boolean {
  return ship.loadType === 'Treatment';
}

export function isEffectContainer(id: ContainerId): boolean {
  return id === 'metforminEffect' || id === 'exerciseEffect';
}

export function isValidSlotIndex(index: number): index is 0 | 1 | 2 {
  return index === 0 || index === 1 || index === 2;
}

export function isValidRow(row: number): row is 0 | 1 {
  return row === 0 || row === 1;
}

// === Utility Functions ===

/**
 * Convert sequential slot number (1-18) to SlotPosition
 */
export function slotNumberToPosition(slotNum: number): SlotPosition {
  if (slotNum < 1 || slotNum > 18) {
    throw new Error(`Invalid slot number: ${slotNum}. Must be 1-18.`);
  }

  const zeroIndexed = slotNum - 1;
  const segmentIndex = Math.floor(zeroIndexed / 6);
  const withinSegment = zeroIndexed % 6;
  const row = Math.floor(withinSegment / 3) as 0 | 1;
  const index = (withinSegment % 3) as 0 | 1 | 2;

  return {
    segment: DAY_SEGMENTS[segmentIndex],
    row,
    index,
  };
}

/**
 * Convert SlotPosition to sequential slot number (1-18)
 */
export function positionToSlotNumber(pos: SlotPosition): number {
  const segmentIndex = DAY_SEGMENTS.indexOf(pos.segment);
  return segmentIndex * 6 + pos.row * 3 + pos.index + 1;
}
