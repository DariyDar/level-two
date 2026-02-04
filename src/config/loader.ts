import type { Ship, LevelConfig, ShipSize, LoadType, AvailableFood } from '../core/types';

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
  mood?: 1 | -1; // Mood effect: +1 (positive) or -1 (negative)
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
}

interface RawLevelConfig {
  id: string;
  name: string;
  description?: string;
  days: number;
  initialBG?: number;
  availableFoods: AvailableFood[] | string[];
  availableInterventions: string[];
  preOccupiedSlots?: { slot: number; shipId: string }[];
  carbRequirements: {
    min: number;
    max: number;
  };
  initialDegradation?: {
    liver: number;
    pancreas: number;
  };
  interventionCharges: {
    liverBoost: number;
    pancreasBoost: number;
  };
  winCondition: {
    minRank: 1 | 2 | 3 | 4 | 5;
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
    mood: raw.mood,
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
    targetContainer: raw.targetContainer as 'metforminEffect' | 'exerciseEffect',
    description: raw.description,
  };
}

// Normalize availableFoods to always be AvailableFood[]
function normalizeAvailableFoods(foods: AvailableFood[] | string[]): AvailableFood[] {
  if (foods.length === 0) return [];

  // Check if it's already in the new format
  if (typeof foods[0] === 'object') {
    return foods as AvailableFood[];
  }

  // Convert old string[] format to new format (unlimited count = 99)
  return (foods as string[]).map(id => ({ id, count: 99 }));
}

// Transform raw level config
function transformLevel(raw: RawLevelConfig): LevelConfig {
  return {
    ...raw,
    initialBG: raw.initialBG ?? 100,
    availableFoods: normalizeAvailableFoods(raw.availableFoods),
    preOccupiedSlots: raw.preOccupiedSlots ?? [],
    initialDegradation: raw.initialDegradation ?? { liver: 0, pancreas: 0 },
  };
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
