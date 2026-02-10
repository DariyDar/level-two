// === Food Card ===

export interface FoodCardModifiers {
  fiber?: boolean    // whole meal: glucoseSpeed ×0.7
  protein?: boolean  // this card: releaseDuration ×1.5
  fat?: boolean      // this card: glucoseSpeed ×0.85, releaseDuration ×1.3
  sugar?: boolean    // whole meal: glucoseSpeed ×1.4
}

export interface FoodCard {
  id: string
  name: string
  emoji: string
  carbs: number            // displayed (grams)
  glucose: number          // total glucose (mg)
  glucoseSpeed: number     // projectile fall speed (1-4)
  releaseDuration: number  // seconds to release all glucose
  tier: 1 | 2 | 3         // 1=healthy, 2=neutral, 3=junk
  tag: string              // grain, meat, dairy, vegetable, fruit, junk, sweet
  modifiers: FoodCardModifiers
}

// === Projectile ===

export interface Projectile {
  id: string
  sourceSlot: number    // 0, 1, 2
  glucose: number       // remaining mg
  position: number      // 0.0 (top) → 1.0 (base)
  speed: number         // current effective speed (units/sec)
  baseSpeed: number     // from card glucoseSpeed (after modifiers applied at spawn)
}

// === Organ State ===

export interface LiverState {
  slowFactor: number    // 0.5 default, worsens with degradation
  zoneStart: number     // 0.15
  zoneEnd: number       // 0.35
  capacity: number      // max projectiles slowed simultaneously
  activeCount: number   // currently being slowed
}

export interface PancreasState {
  currentTier: number   // 0-4
  maxTier: number       // 4, reduced by degradation
}

export interface MusclesState {
  dps: number           // pancreasTier × 25
  rangeStart: number    // 0.3
  rangeEnd: number      // 0.75
  maxTargets: number    // 2
  targets: string[]     // projectile IDs being attacked
}

export interface KidneysState {
  dps: number           // 15, reduced by degradation
  rangeStart: number    // 0.8
  rangeEnd: number      // 0.95
  maxTargets: number    // 1
  targets: string[]     // projectile IDs being attacked
}

export interface OrganState {
  liver: LiverState
  pancreas: PancreasState
  muscles: MusclesState
  kidneys: KidneysState
}

// === Degradation ===

export type DegradationTarget = 'liver' | 'pancreas' | 'kidneys'

export const DEGRADATION_CYCLE: DegradationTarget[] = ['liver', 'pancreas', 'kidneys']

export interface DegradationState {
  totalCircles: number
  liverCircles: number
  pancreasCircles: number
  kidneysCircles: number
}

// === Slot Spawn State ===

export interface SlotSpawnState {
  slotIndex: number
  remainingGlucose: number
  spawnTimer: number
  spawnInterval: number
  projectileGlucose: number // glucose per projectile
  baseSpeed: number         // speed for spawned projectiles
}

// === Impact VFX ===

export interface ImpactVFX {
  id: string
  sourceSlot: number
  time: number   // simulation time when impact happened
}

// === Simulation State ===

export interface SimulationState {
  time: number                    // current time in seconds
  projectiles: Projectile[]
  organs: OrganState
  excessGlucose: number
  impacts: ImpactVFX[]               // recent base impacts for VFX
  slotSpawnStates: SlotSpawnState[]  // one per active slot
  nextSlotToActivate: number         // 0, 1, 2 or 3 (done)
  nextSlotActivationTime: number     // when the next slot starts
  isComplete: boolean
}

// === Game Flow ===

export type GamePhase = 'Planning' | 'Simulation' | 'Results'
export type MealSegment = 'Breakfast' | 'Lunch' | 'Dinner'

export const MEAL_SEGMENTS: MealSegment[] = ['Breakfast', 'Lunch', 'Dinner']

// === Offer System ===

export type OfferTemplate = [number, number, number] // tier for each of 3 cards

export interface OfferConstraints {
  noRepeatCardIds?: string[]  // IDs already offered this segment
  maxSameTag?: number         // max cards of same tag across all offers
  requireTags?: string[]      // must include at least one of each
}

export interface SegmentConfig {
  segment: MealSegment
  offerTemplates: OfferTemplate[]  // typically 3 templates
  segmentDelay: number             // seconds between slot activations in simulation
}

// === Level Config ===

export interface DayConfig {
  day: number
  segments: SegmentConfig[]
}

export interface LevelConfig {
  id: string
  name: string
  days: DayConfig[]
  initialInventory: string[]      // FoodCard IDs to start in inventory
  defeatThreshold: number         // total excess glucose for defeat
  degradationThresholds: number[] // e.g. [100, 250, 500, 800, 1200]
}

// === Results ===

export type DayAssessment = 'Excellent' | 'Decent' | 'Poor' | 'Defeat'

export interface SegmentResult {
  excessGlucose: number
  newDegradationCircles: number
  assessment: DayAssessment
}

// === Simulation Config Constants ===

export const SIM_CONSTANTS = {
  SPEED_SCALE: 0.04,          // glucoseSpeed 1 → 0.04 pos/sec → ~25 sec to cross
  PROJECTILE_SIZE: 10,        // mg per projectile
  SEGMENT_DELAY: 3,           // seconds between slot activations

  // Liver (slowdown ~25% weaker: factor 0.5→0.6 means less slowdown)
  LIVER_SLOW_FACTOR: 0.6,
  LIVER_ZONE_START: 0.15,
  LIVER_ZONE_END: 0.35,
  LIVER_CAPACITY: 4,

  // Pancreas tier thresholds (by active projectile count)
  PANCREAS_TIER_THRESHOLDS: [0, 1, 3, 5, 8] as readonly number[],
  PANCREAS_MAX_TIER: 4,

  // Muscles (halved: 14→7)
  MUSCLE_RANGE_START: 0.3,
  MUSCLE_RANGE_END: 0.75,
  MUSCLE_MAX_TARGETS: 2,
  MUSCLE_DPS_PER_TIER: 7,     // mg/sec per tier (was 14)

  // Kidneys (~25% weaker: 15→11)
  KIDNEY_RANGE_START: 0.8,
  KIDNEY_RANGE_END: 0.95,
  KIDNEY_MAX_TARGETS: 1,
  KIDNEY_DPS: 8,               // mg/sec (was 11)

  // Modifiers
  FIBER_SPEED_MULTIPLIER: 0.7,
  SUGAR_SPEED_MULTIPLIER: 1.4,
  PROTEIN_DURATION_MULTIPLIER: 1.5,
  FAT_SPEED_MULTIPLIER: 0.85,
  FAT_DURATION_MULTIPLIER: 1.3,

  // Tag-based effects
  PROTEIN_TAG_MUSCLE_BOOST: 1.25,  // muscle DPS ×1.25 if any card has "protein" tag

  // Degradation per circle
  LIVER_SLOW_PENALTY: 0.1,    // slowFactor increases by 0.1 per circle
  PANCREAS_TIER_PENALTY: 1,   // maxTier decreases by 1 per circle
  KIDNEYS_DPS_PENALTY: 5,     // dps decreases by 5 per circle
} as const

// Speed label display mapping
export const SPEED_LABELS: Record<number, string> = {
  1: 'Slow',
  2: 'Medium',
  3: 'Fast',
  4: 'Very Fast',
}
