# 06 - Data Models

## Назначение

Полное описание всех TypeScript интерфейсов и типов, используемых в игре.

---

## Core Types

### Базовые перечисления

```typescript
// core/types.ts

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
```

### Ship Size Mapping

```typescript
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
```

---

## Ship Models

```typescript
// === Ship Definition (from config) ===

export interface Ship {
  /** Unique identifier */
  id: string;

  /** Display name */
  name: string;

  /** Emoji for placeholder visuals */
  emoji: string;

  /** Size category */
  size: ShipSize;

  /** Amount of cargo to unload */
  load: number;

  /** Type of cargo */
  loadType: LoadType;

  /** Target container for unloading */
  targetContainer: ContainerId;

  /** Optional description for UI */
  description?: string;

  /** Optional tags for special effects (future) */
  tags?: string[];
}

// === Placed Ship (in planning grid) ===

export interface PlacedShip {
  /** Unique instance ID (uuid) */
  instanceId: string;

  /** Reference to ship definition */
  shipId: string;

  /** Which day segment */
  segment: DaySegment;

  /** Which row (0 = top/unloading, 1 = bottom/waiting) */
  row: 0 | 1;

  /** Starting slot index (0, 1, or 2) */
  startSlot: number;
}

// === Queued Ship (waiting in simulation) ===

export interface QueuedShip extends PlacedShip {
  /** Calculated end slot */
  endSlot: number;

  /** Has this ship started unloading? */
  hasStarted: boolean;
}

// === Unloading Ship (currently active) ===

export interface UnloadingShip {
  /** Instance ID from PlacedShip */
  instanceId: string;

  /** Ship definition ID */
  shipId: string;

  /** Remaining ticks until complete */
  remainingTicks: number;

  /** Total ticks for this ship */
  totalTicks: number;

  /** Cargo unloaded per tick */
  loadPerTick: number;

  /** Reference to ship config */
  ship: Ship;
}
```

---

## Container Models

```typescript
// === Container State (runtime) ===

export interface ContainerState {
  /** Container identifier */
  id: ContainerId;

  /** Current level */
  level: number;

  /** Maximum capacity */
  capacity: number;

  /** Decay rate per tick (for effect containers) */
  decayRate?: number;
}

// === All Containers ===

export type ContainerStates = Record<ContainerId, ContainerState>;

// === Container Config (from config) ===

export interface ContainerConfig {
  id: ContainerId;
  name: string;
  capacity: number;
  initialLevel: number;
  decayRate?: number;
  thresholds?: BGThresholds;
}

export interface BGThresholds {
  low: number;      // 70
  target: number;   // 100
  high: number;     // 200
  critical: number; // 300
}
```

---

## Rule Models

```typescript
// === Condition ===

export type ConditionOperator = 'lt' | 'lte' | 'eq' | 'gte' | 'gt';

export interface RuleCondition {
  /** Which container to check */
  container: ContainerId;

  /** Comparison operator */
  operator: ConditionOperator;

  /** Value to compare against */
  value: number | 'full' | 'empty';
}

// === Action ===

export type ActionType = 'transfer' | 'setRate' | 'excrete' | 'modifyEffect';

export interface RuleAction {
  /** Type of action */
  type: ActionType;

  /** Source container (for transfer/excrete) */
  from?: ContainerId;

  /** Destination container (for transfer) */
  to?: ContainerId;

  /** Rate tier to apply */
  rateTier?: number;

  /** Amount (number or percentage string like '30%') */
  amount?: number | string;

  /** For modifyEffect: which effect to modify */
  effectId?: string;

  /** For modifyEffect: tier bonus */
  tierBonus?: number;
}

// === Rule ===

export interface Rule {
  /** Unique rule ID */
  id: string;

  /** Human-readable description */
  description: string;

  /** Higher priority = evaluated first */
  priority: number;

  /** Condition to check */
  condition: RuleCondition;

  /** Action to execute when condition is true */
  action: RuleAction;

  /** Minimum ticks between triggers */
  cooldown?: number;

  /** Is this a manual (player-triggered) rule? */
  isManual?: boolean;
}

// === Rule State (runtime) ===

export interface RuleState {
  /** Rule ID */
  ruleId: string;

  /** Ticks until can trigger again (0 = ready) */
  cooldownRemaining: number;

  /** Was triggered this tick? */
  triggeredThisTick: boolean;
}
```

---

## Effect Models

```typescript
// === Effect Threshold ===

export interface EffectThreshold {
  /** Minimum level to activate this tier */
  level: number;

  /** Effects to apply */
  effects: EffectModifier[];
}

export interface EffectModifier {
  /** What to modify */
  target: 'liverDegradation' | 'muscleRateTier' | 'kidneyThreshold';

  /** Modification type */
  type: 'suppress' | 'bonus' | 'multiply';

  /** Value of modification */
  value: number;
}

// === Effect Config ===

export interface EffectConfig {
  /** Effect container ID */
  id: ContainerId;

  /** Display name */
  name: string;

  /** Thresholds with effects */
  thresholds: EffectThreshold[];
}

// === Active Effect (runtime) ===

export interface ActiveEffect {
  /** Effect container ID */
  effectId: ContainerId;

  /** Current tier (0 = inactive) */
  currentTier: number;

  /** Active modifiers */
  modifiers: EffectModifier[];
}
```

---

## Simulation Models

```typescript
// === Simulation State ===

export interface SimulationState {
  // Time
  /** Current tick (0-17) */
  currentTick: number;

  /** Current segment */
  currentSegment: DaySegment;

  /** Current game hour (6-23) */
  currentHour: number;

  // Containers
  /** All container states */
  containers: ContainerStates;

  // Ships
  /** Ships waiting to unload */
  shipQueue: QueuedShip[];

  /** Ships currently unloading */
  unloadingShips: UnloadingShip[];

  // Rules
  /** Rule states (cooldowns) */
  ruleStates: Record<string, RuleState>;

  // Effects
  /** Active effects */
  activeEffects: ActiveEffect[];

  // History
  /** BG level at each tick */
  bgHistory: number[];

  // Controls
  /** Is simulation running? */
  isRunning: boolean;

  /** Is simulation paused? */
  isPaused: boolean;

  /** Playback speed */
  speed: 1 | 2 | 4;

  // Player interventions
  /** Intervention states */
  interventions: InterventionStates;
}

// === Intervention State ===

export interface InterventionState {
  /** Available charges */
  charges: number;

  /** Maximum charges */
  maxCharges: number;

  /** Cooldown ticks remaining */
  cooldownRemaining: number;

  /** Maximum cooldown */
  cooldownMax: number;

  /** Is currently active? */
  isActive: boolean;

  /** Remaining active duration */
  activeDurationRemaining: number;
}

export interface InterventionStates {
  liverBoost: InterventionState;
  pancreasBoost: InterventionState;
}
```

---

## Results Models

```typescript
// === Day Metrics ===

export interface DayMetrics {
  /** Average BG over all ticks */
  averageBG: number;

  /** Minimum BG */
  minBG: number;

  /** Maximum BG */
  maxBG: number;

  /** Ticks with BG in range (70-200) */
  timeInRange: number;

  /** Ticks with BG > 200 */
  timeAboveHigh: number;

  /** Ticks with BG > 300 */
  timeAboveCritical: number;

  /** Ticks with BG < 70 */
  timeBelowLow: number;

  /** Sum of (BG - 200) for ticks where BG > 200 */
  excessBG: number;
}

// === Degradation Points ===

export interface DegradationPoints {
  /** Total points this day */
  total: number;

  /** Points allocated to liver */
  liver: number;

  /** Points allocated to pancreas */
  pancreas: number;

  /** Points allocated to kidney */
  kidney: number;
}

// === Day Results ===

export interface DayResults {
  /** Day number */
  day: number;

  /** Full BG history */
  bgHistory: number[];

  /** Calculated metrics */
  metrics: DayMetrics;

  /** Degradation applied */
  degradation: DegradationPoints;

  /** Final rank (1-5) */
  rank: 1 | 2 | 3 | 4 | 5;

  /** Rank message */
  message: string;

  /** Interventions used count */
  interventionsUsed: {
    liverBoosts: number;
    pancreasBoosts: number;
  };
}
```

---

## Degradation Models

```typescript
// === Organ Degradation State ===

export interface OrganDegradationState {
  /** Organ ID */
  organId: OrganId;

  /** Current degradation value */
  currentValue: number;

  /** Maximum degradation */
  maxValue: number;

  /** Current tier (based on thresholds) */
  currentTier: number;

  /** Effect description for current tier */
  currentEffect: string;
}

// === All Degradation ===

export interface DegradationState {
  liver: OrganDegradationState;
  pancreas: OrganDegradationState;
  kidney: OrganDegradationState;
}

// === Simple degradation for store ===

export interface SimpleDegradation {
  liver: number;
  pancreas: number;
  kidney: number;
}
```

---

## Level Models

```typescript
// === Level Config ===

export interface LevelConfig {
  /** Unique level ID */
  id: string;

  /** Display name */
  name: string;

  /** Description */
  description: string;

  /** Number of days to complete */
  days: number;

  /** Carb requirements */
  carbRequirements: {
    min: number;
    max: number;
  };

  /** Available ship IDs */
  availableShips: string[];

  /** Starting degradation (optional) */
  initialDegradation?: SimpleDegradation;

  /** Intervention charges for this level */
  interventionCharges: {
    liverBoost: number;
    pancreasBoost: number;
  };

  /** Win conditions */
  winCondition: {
    minRank: 1 | 2 | 3 | 4 | 5;
    allDaysPassed: boolean;
  };
}

// === Level Progress ===

export interface LevelProgress {
  /** Level ID */
  levelId: string;

  /** Current day (1-indexed) */
  currentDay: number;

  /** Results for completed days */
  dayResults: DayResults[];

  /** Is level complete? */
  isComplete: boolean;

  /** Did player win? */
  isWon: boolean;
}
```

---

## Store Models

```typescript
// === Game State (Zustand) ===

export interface GameState {
  // === Current State ===

  /** Current game phase */
  phase: GamePhase;

  /** Current level config */
  currentLevel: LevelConfig | null;

  /** Current day number */
  currentDay: number;

  // === Planning ===

  /** Ships placed in current plan */
  placedShips: PlacedShip[];

  /** Validation state */
  planValidation: PlanValidation;

  // === Simulation ===

  /** Simulation runtime state */
  simulation: SimulationState | null;

  // === Results ===

  /** Results of current/last day */
  results: DayResults | null;

  // === Persistent ===

  /** Accumulated degradation */
  degradation: SimpleDegradation;

  /** Level progress */
  levelProgress: LevelProgress | null;
}

// === Plan Validation ===

export interface PlanValidation {
  /** Is plan valid? */
  isValid: boolean;

  /** Total carbs planned */
  totalCarbs: number;

  /** Min carbs required */
  minCarbs: number;

  /** Max carbs recommended */
  maxCarbs: number;

  /** Validation errors */
  errors: string[];

  /** Validation warnings */
  warnings: string[];
}
```

---

## Slot Models

```typescript
// === Slot Position ===

export interface SlotPosition {
  segment: DaySegment;
  row: 0 | 1;
  index: 0 | 1 | 2;
}

// === Slot ID (string format) ===

export type SlotId = `${DaySegment}-${0 | 1}-${0 | 1 | 2}`;

// Example: "Morning-0-0", "Day-1-2"

// === Slot State ===

export interface SlotState {
  /** Position */
  position: SlotPosition;

  /** Is occupied? */
  isOccupied: boolean;

  /** Ship instance ID if occupied */
  shipInstanceId?: string;

  /** Is this a continuation slot? (part of multi-slot ship) */
  isContinuation: boolean;
}
```

---

## UI Models

```typescript
// === Drag and Drop ===

export interface DragData {
  /** Ship being dragged */
  ship: Ship;

  /** Is from placed position? */
  isPlaced: boolean;

  /** Instance ID if placed */
  instanceId?: string;
}

export interface DropResult {
  /** Was drop successful? */
  success: boolean;

  /** Target slot */
  slot?: SlotPosition;

  /** Error message if failed */
  error?: string;
}

// === Animation State ===

export interface AnimationState {
  /** Is animating? */
  isAnimating: boolean;

  /** Animation type */
  type: 'unload' | 'transfer' | 'excrete' | 'boost';

  /** Source */
  from?: ContainerId | SlotId;

  /** Destination */
  to?: ContainerId;

  /** Progress (0-1) */
  progress: number;
}
```

---

## Utility Types

```typescript
// === Generic helpers ===

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// === Action result ===

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

// === Event types ===

export type GameEventType =
  | 'shipPlaced'
  | 'shipRemoved'
  | 'simulationStarted'
  | 'simulationTick'
  | 'simulationEnded'
  | 'interventionUsed'
  | 'thresholdReached'
  | 'degradationApplied';

export interface GameEvent {
  type: GameEventType;
  timestamp: number;
  data: unknown;
}
```

---

## Type Guards

```typescript
// === Type guards for runtime checks ===

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
```

---

## Constants from Types

```typescript
// === Derived constants ===

export const DAY_SEGMENTS: DaySegment[] = ['Morning', 'Day', 'Evening'];

export const SLOTS_PER_ROW = 3;
export const ROWS_PER_SEGMENT = 2;
export const SLOTS_PER_SEGMENT = SLOTS_PER_ROW * ROWS_PER_SEGMENT; // 6
export const TOTAL_SLOTS = SLOTS_PER_SEGMENT * DAY_SEGMENTS.length; // 18

export const HOURS_PER_SEGMENT = 6;
export const TOTAL_HOURS = HOURS_PER_SEGMENT * DAY_SEGMENTS.length; // 18

export const STARTING_HOUR = 6; // 06:00
```

---

## Export Index

```typescript
// core/types/index.ts

export * from './enums';
export * from './ship';
export * from './container';
export * from './rule';
export * from './effect';
export * from './simulation';
export * from './results';
export * from './degradation';
export * from './level';
export * from './store';
export * from './slot';
export * from './ui';
export * from './utils';
export * from './guards';
export * from './constants';
```

---

## TODO

- [ ] Добавить JSDoc комментарии ко всем интерфейсам
- [ ] Создать Zod схемы для runtime валидации
- [ ] Добавить примеры использования
