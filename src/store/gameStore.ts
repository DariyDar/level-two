import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type {
  PlacedFood,
  LevelConfig,
  DayConfig,
  Ship,
  GameSettings,
} from '../core/types';
import { DEFAULT_SETTINGS } from '../core/types';

// Helper to get day config
function getDayConfig(level: LevelConfig, day: number): DayConfig | null {
  if (level.dayConfigs) {
    return level.dayConfigs.find(dc => dc.day === day) ?? level.dayConfigs[0] ?? null;
  }
  // Fallback for levels without dayConfigs
  return {
    day,
    kcalBudget: level.kcalBudget ?? 2000,
    wpBudget: 10,
    availableFoods: level.availableFoods ?? [],
  };
}

interface GameState {
  // Current state
  currentLevel: LevelConfig | null;
  currentDay: number;

  // Planning (graph-based)
  placedFoods: PlacedFood[];

  // Settings
  settings: GameSettings;

  // Actions
  setLevel: (level: LevelConfig) => void;
  placeFood: (shipId: string, dropColumn: number) => void;
  removeFood: (placementId: string) => void;
  clearFoods: () => void;
  startNextDay: () => void;
  restartLevel: () => void;
  updateSettings: (settings: Partial<GameSettings>) => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      // Initial state
      currentLevel: null,
      currentDay: 1,
      placedFoods: [],
      settings: DEFAULT_SETTINGS,

      // Actions
      setLevel: (level) =>
        set({
          currentLevel: level,
          currentDay: 1,
          placedFoods: [],
        }),

      placeFood: (shipId, dropColumn) =>
        set((state) => ({
          placedFoods: [
            ...state.placedFoods,
            { id: uuidv4(), shipId, dropColumn },
          ],
        })),

      removeFood: (placementId) =>
        set((state) => ({
          placedFoods: state.placedFoods.filter((f) => f.id !== placementId),
        })),

      clearFoods: () => set({ placedFoods: [] }),

      startNextDay: () =>
        set((state) => ({
          currentDay: state.currentDay + 1,
          placedFoods: [],
        })),

      restartLevel: () =>
        set({
          currentDay: 1,
          placedFoods: [],
        }),

      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
    }),
    {
      name: 'bg-graph-save',
      version: 3,
      partialize: (state) => ({
        currentDay: state.currentDay,
        settings: state.settings,
      }),
    }
  )
);

// Export helper for use in components
export { getDayConfig };

// Selector: compute kcal usage
export function selectKcalUsed(placedFoods: PlacedFood[], allShips: Ship[]): number {
  let total = 0;
  for (const placed of placedFoods) {
    const ship = allShips.find(s => s.id === placed.shipId);
    if (ship) total += ship.kcal;
  }
  return total;
}

// Selector: compute WP usage
export function selectWpUsed(placedFoods: PlacedFood[], allShips: Ship[]): number {
  let total = 0;
  for (const placed of placedFoods) {
    const ship = allShips.find(s => s.id === placed.shipId);
    if (ship) total += (ship.wpCost ?? 0);
  }
  return total;
}
