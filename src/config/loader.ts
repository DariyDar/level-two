import type { Ship, LevelConfig, ShipSize, LoadType, AvailableFood, BlockedSlotConfig } from '../core/types';

// Raw JSON types (before transformation)
interface RawFoodConfig {
  id: string;
  name: string;
  image?: string;
  emoji?: string;
  size: ShipSize;
  glucose: number;
  carbs: number; // Carbohydrates in grams (for UI display)
  description?: string;
  mood?: number; // Mood impact (-5 to +5)
  fiber?: boolean;
}

interface RawInterventionConfig {
  id: string;
  name: string;
  image?: string;
  emoji?: string;
  size: ShipSize;
  load: number;
  targetContainer: string;
  description?: string;
  mood?: number; // Mood impact (-5 to +5)
  group?: string;
  requiresEmptySlotBefore?: boolean;
}

interface RawLevelConfig {
  id: string;
  name: string;
  description?: string;
  days: number;
  initialBG?: number;
  availableInterventions?: AvailableFood[] | string[]; // Legacy: level-wide
  preOccupiedSlots?: { slot: number; shipId: string; narrative?: string }[];
  dayConfigs?: Array<{
    day: number;
    availableInterventions?: AvailableFood[] | string[];
    preOccupiedSlots?: { slot: number; shipId: string; narrative?: string }[];
    blockedSlots?: Array<number | { slot: number; narrative?: string }>;
    pancreasBoostCharges?: number;
  }>;
  initialDegradation?: {
    liver: number;
    pancreas: number;
  };
  interventionCharges: {
    liverBoost: number;
    pancreasBoost: number;
  };
  winCondition: {
    maxDegradationCircles?: number;
  };
}

// Transform raw food config to Ship
function transformFood(raw: RawFoodConfig): Ship {
  return {
    id: raw.id,
    name: raw.name,
    emoji: raw.emoji || '🍽️',
    size: raw.size,
    load: raw.glucose,
    carbs: raw.carbs,
    loadType: 'Glucose' as LoadType,
    targetContainer: 'liver',
    description: raw.description,
    mood: raw.mood ?? 0,
    fiber: raw.fiber,
  };
}

// Transform raw intervention config to Ship
function transformIntervention(raw: RawInterventionConfig): Ship {
  return {
    id: raw.id,
    name: raw.name,
    emoji: raw.emoji || '💊',
    size: raw.size,
    load: raw.load,
    loadType: 'Treatment' as LoadType,
    targetContainer: raw.targetContainer as 'metforminEffect' | 'exerciseEffect' | 'intenseExerciseEffect',
    description: raw.description,
    mood: raw.mood ?? 0,
    group: raw.group,
    requiresEmptySlotBefore: raw.requiresEmptySlotBefore,
  };
}

// Normalize availableInterventions to always be AvailableFood[]
function normalizeAvailableInterventions(interventions?: AvailableFood[] | string[]): AvailableFood[] {
  if (!interventions || interventions.length === 0) return [];

  if (typeof interventions[0] === 'object') {
    return interventions as AvailableFood[];
  }

  return (interventions as string[]).map(id => ({ id, count: 99 }));
}

// Normalize blockedSlots: convert raw number entries to BlockedSlotConfig objects
function normalizeBlockedSlots(slots?: Array<number | { slot: number; narrative?: string }>): BlockedSlotConfig[] {
  if (!slots || slots.length === 0) return [];
  return slots.map(s => typeof s === 'number' ? { slot: s } : s);
}

// Transform raw level config
function transformLevel(raw: RawLevelConfig): LevelConfig {
  const transformed: LevelConfig = {
    id: raw.id,
    name: raw.name,
    description: raw.description,
    days: raw.days,
    initialBG: raw.initialBG ?? 100,
    preOccupiedSlots: raw.preOccupiedSlots ?? [],
    initialDegradation: raw.initialDegradation ?? { liver: 0, pancreas: 0 },
    interventionCharges: raw.interventionCharges,
    winCondition: raw.winCondition,
  };

  // Handle legacy level-wide availableInterventions
  if (raw.availableInterventions) {
    transformed.availableInterventions = normalizeAvailableInterventions(raw.availableInterventions);
  }

  // Normalize dayConfigs if present
  if (raw.dayConfigs) {
    transformed.dayConfigs = raw.dayConfigs.map((dc) => ({
      day: dc.day,
      availableInterventions: normalizeAvailableInterventions(dc.availableInterventions),
      preOccupiedSlots: dc.preOccupiedSlots ?? [],
      blockedSlots: normalizeBlockedSlots(dc.blockedSlots),
      pancreasBoostCharges: dc.pancreasBoostCharges,
    }));
  }

  return transformed;
}

// Cache for loaded configs
let foodsCache: Ship[] | null = null;
let interventionsCache: Ship[] | null = null;

export async function loadFoods(): Promise<Ship[]> {
  if (foodsCache) return foodsCache;

  const response = await fetch('/data/foods.json', { cache: 'no-store' });
  const data = await response.json();
  const ships = data.foods.map(transformFood);
  foodsCache = ships;
  return ships;
}

export async function loadInterventions(): Promise<Ship[]> {
  if (interventionsCache) return interventionsCache;

  const response = await fetch('/data/interventions.json', { cache: 'no-store' });
  const data = await response.json();
  const ships = data.interventions.map(transformIntervention);
  interventionsCache = ships;
  return ships;
}

export async function loadLevel(levelId: string): Promise<LevelConfig> {
  const response = await fetch(`/data/levels/${levelId}.json`, { cache: 'no-store' });
  const data = await response.json();
  return transformLevel(data);
}

export async function loadAllShips(): Promise<Ship[]> {
  const [foods, interventions] = await Promise.all([
    loadFoods(),
    loadInterventions(),
  ]);
  return [...foods, ...interventions];
}

// Get ship by ID from cache
export function getShipById(ships: Ship[], id: string): Ship | undefined {
  return ships.find(s => s.id === id);
}

// Clear cache (useful for testing)
export function clearConfigCache(): void {
  foodsCache = null;
  interventionsCache = null;
}
