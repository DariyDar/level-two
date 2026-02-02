// ============================================
// Core Types for Port Management Game
// ============================================

// === Enums / Unions ===

export type ShipSize = 'S' | 'M' | 'L';

export type LoadType = 'Glucose' | 'Treatment';

export type DaySegment = 'Morning' | 'Day' | 'Evening';

export type GamePhase = 'Planning' | 'Simulation' | 'Results';

export type ContainerId =
  | 'liver'
  | 'bg'
  | 'kidney'
  | 'metforminEffect'
  | 'exerciseEffect';

export type OrganId = 'liver' | 'pancreas' | 'muscles' | 'kidney';

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
  loadType: LoadType;
  targetContainer: ContainerId;
  description?: string;
}

export interface PlacedShip {
  instanceId: string;
  shipId: string;
  segment: DaySegment;
  row: 0 | 1;
  startSlot: number;
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

export interface SimpleDegradation {
  liver: number;
  pancreas: number;
  kidney: number;
}

// === Level Config ===

export interface LevelConfig {
  id: string;
  name: string;
  description?: string;
  days: number;
  availableFoods: string[];
  availableInterventions: string[];
  carbRequirements: {
    min: number;
    max: number;
  };
  initialDegradation?: SimpleDegradation;
  interventionCharges: {
    liverBoost: number;
    pancreasBoost: number;
  };
  winCondition: {
    minRank: 1 | 2 | 3 | 4 | 5;
  };
}

// === Results Models ===

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

export interface DayResults {
  day: number;
  bgHistory: number[];
  metrics: DayMetrics;
  degradation: SimpleDegradation;
  rank: 1 | 2 | 3 | 4 | 5;
  message: string;
}

// === Slot Models ===

export interface SlotPosition {
  segment: DaySegment;
  row: 0 | 1;
  index: 0 | 1 | 2;
}

export type SlotId = `${DaySegment}-${0 | 1}-${0 | 1 | 2}`;

// === Validation ===

export interface PlanValidation {
  isValid: boolean;
  totalCarbs: number;
  minCarbs: number;
  maxCarbs: number;
  errors: string[];
  warnings: string[];
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
