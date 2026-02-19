import type { Ship, LevelConfig, LoadType, AvailableFood } from '../core/types';

// Raw JSON types (before transformation)
interface RawFoodConfig {
  id: string;
  name: string;
  emoji?: string;
  glucose: number;
  carbs: number;
  protein?: number;
  fat?: number;
  duration: number;
  kcal: number;
  description?: string;
  wpCost?: number;
}

interface RawLevelConfig {
  id: string;
  name: string;
  description?: string;
  days: number;
  kcalBudget?: number;
  availableFoods?: AvailableFood[] | string[];
  dayConfigs?: Array<{
    day: number;
    kcalBudget: number;
    wpBudget?: number;
    availableFoods: AvailableFood[] | string[];
    availableInterventions?: AvailableFood[] | string[];
  }>;
}

// Transform raw food config to Ship
function transformFood(raw: RawFoodConfig): Ship {
  return {
    id: raw.id,
    name: raw.name,
    emoji: raw.emoji || '🍽️',
    load: raw.glucose,
    carbs: raw.carbs,
    protein: raw.protein,
    fat: raw.fat,
    duration: raw.duration,
    kcal: raw.kcal,
    loadType: 'Glucose' as LoadType,
    targetContainer: 'bg',
    description: raw.description,
    wpCost: raw.wpCost ?? 0,
  };
}

// Normalize availableFoods to always be AvailableFood[]
function normalizeAvailableFoods(foods?: AvailableFood[] | string[]): AvailableFood[] {
  if (!foods || foods.length === 0) return [];

  if (typeof foods[0] === 'object') {
    return foods as AvailableFood[];
  }

  return (foods as string[]).map(id => ({ id, count: 99 }));
}

// Transform raw level config
function transformLevel(raw: RawLevelConfig): LevelConfig {
  const transformed: LevelConfig = {
    id: raw.id,
    name: raw.name,
    description: raw.description,
    days: raw.days,
    kcalBudget: raw.kcalBudget,
  };

  if (raw.availableFoods) {
    transformed.availableFoods = normalizeAvailableFoods(raw.availableFoods);
  }

  if (raw.dayConfigs) {
    transformed.dayConfigs = raw.dayConfigs.map((dc) => ({
      day: dc.day,
      kcalBudget: dc.kcalBudget,
      wpBudget: dc.wpBudget ?? 10,
      availableFoods: normalizeAvailableFoods(dc.availableFoods),
      availableInterventions: dc.availableInterventions
        ? normalizeAvailableFoods(dc.availableInterventions)
        : undefined,
    }));
  }

  return transformed;
}

// Cache for loaded configs
let foodsCache: Ship[] | null = null;

export async function loadFoods(): Promise<Ship[]> {
  if (foodsCache) return foodsCache;

  const response = await fetch('/data/foods.json', { cache: 'no-store' });
  const data = await response.json();
  const ships = data.foods.map(transformFood);
  foodsCache = ships;
  return ships;
}

export async function loadLevel(levelId: string): Promise<LevelConfig> {
  const response = await fetch(`/data/levels/${levelId}.json`, { cache: 'no-store' });
  const data = await response.json();
  return transformLevel(data);
}

// Get ship by ID from cache
export function getShipById(ships: Ship[], id: string): Ship | undefined {
  return ships.find(s => s.id === id);
}

// Clear cache (useful for testing)
export function clearConfigCache(): void {
  foodsCache = null;
}
