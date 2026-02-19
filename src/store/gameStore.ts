import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type {
  PlacedFood,
  PlacedIntervention,
  LevelConfig,
  DayConfig,
  Ship,
  Intervention,
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
  placedInterventions: PlacedIntervention[];
  activeMedications: string[];

  // Settings
  settings: GameSettings;

  // Actions
  setLevel: (level: LevelConfig) => void;
  placeFood: (shipId: string, dropColumn: number) => void;
  removeFood: (placementId: string) => void;
  placeIntervention: (interventionId: string, dropColumn: number) => void;
  removeIntervention: (placementId: string) => void;
  toggleMedication: (medicationId: string) => void;
  clearFoods: () => void;
  goToDay: (day: number) => void;
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
      placedInterventions: [],
      activeMedications: [],
      settings: DEFAULT_SETTINGS,

      // Actions
      setLevel: (level) =>
        set({
          currentLevel: level,
          currentDay: 1,
          placedFoods: [],
          placedInterventions: [],
          activeMedications: [],
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

      placeIntervention: (interventionId, dropColumn) =>
        set((state) => ({
          placedInterventions: [
            ...state.placedInterventions,
            { id: uuidv4(), interventionId, dropColumn },
          ],
        })),

      removeIntervention: (placementId) =>
        set((state) => ({
          placedInterventions: state.placedInterventions.filter((i) => i.id !== placementId),
        })),

      toggleMedication: (medicationId) =>
        set((state) => ({
          activeMedications: state.activeMedications.includes(medicationId)
            ? state.activeMedications.filter(id => id !== medicationId)
            : [...state.activeMedications, medicationId],
        })),

      clearFoods: () => set({ placedFoods: [], placedInterventions: [], activeMedications: [] }),

      goToDay: (day) =>
        set({
          currentDay: day,
          placedFoods: [],
          placedInterventions: [],
          activeMedications: [],
        }),

      startNextDay: () =>
        set((state) => ({
          currentDay: state.currentDay + 1,
          placedFoods: [],
          placedInterventions: [],
          activeMedications: [],
        })),

      restartLevel: () =>
        set({
          currentDay: 1,
          placedFoods: [],
          placedInterventions: [],
          activeMedications: [],
        }),

      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
    }),
    {
      name: 'bg-graph-save',
      version: 5,
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

// Selector: compute WP usage (food + interventions)
export function selectWpUsed(
  placedFoods: PlacedFood[],
  allShips: Ship[],
  placedInterventions: PlacedIntervention[],
  allInterventions: Intervention[],
): number {
  let total = 0;
  for (const placed of placedFoods) {
    const ship = allShips.find(s => s.id === placed.shipId);
    if (ship) total += (ship.wpCost ?? 0);
  }
  for (const placed of placedInterventions) {
    const intervention = allInterventions.find(i => i.id === placed.interventionId);
    if (intervention) total += intervention.wpCost;
  }
  return total;
}
