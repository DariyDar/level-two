import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  GamePhase,
  PlacedShip,
  SimpleDegradation,
  LevelConfig,
  DayResults,
  PlanValidation,
} from '../core/types';

interface GameState {
  // Current state
  phase: GamePhase;
  currentLevel: LevelConfig | null;
  currentDay: number;

  // Planning
  placedShips: PlacedShip[];
  planValidation: PlanValidation;

  // Results
  results: DayResults | null;

  // Persistent (between days/levels)
  degradation: SimpleDegradation;

  // Actions
  setPhase: (phase: GamePhase) => void;
  setLevel: (level: LevelConfig) => void;
  placeShip: (ship: PlacedShip) => void;
  removeShip: (instanceId: string) => void;
  clearPlan: () => void;
  setResults: (results: DayResults) => void;
  startNextDay: () => void;
  retryLevel: () => void;
  updateValidation: (validation: PlanValidation) => void;
}

const initialDegradation: SimpleDegradation = {
  liver: 0,
  pancreas: 0,
  kidney: 0,
};

const initialValidation: PlanValidation = {
  isValid: false,
  totalCarbs: 0,
  minCarbs: 0,
  maxCarbs: 0,
  errors: [],
  warnings: [],
};

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      // Initial state
      phase: 'Planning',
      currentLevel: null,
      currentDay: 1,
      placedShips: [],
      planValidation: initialValidation,
      results: null,
      degradation: initialDegradation,

      // Actions
      setPhase: (phase) => set({ phase }),

      setLevel: (level) =>
        set({
          currentLevel: level,
          currentDay: 1,
          placedShips: [],
          planValidation: {
            ...initialValidation,
            minCarbs: level.carbRequirements.min,
            maxCarbs: level.carbRequirements.max,
          },
          results: null,
          degradation: level.initialDegradation ?? initialDegradation,
        }),

      placeShip: (ship) =>
        set((state) => ({
          placedShips: [...state.placedShips, ship],
        })),

      removeShip: (instanceId) =>
        set((state) => ({
          placedShips: state.placedShips.filter((s) => s.instanceId !== instanceId),
        })),

      clearPlan: () => set({ placedShips: [] }),

      setResults: (results) =>
        set((state) => ({
          results,
          degradation: {
            liver: state.degradation.liver + results.degradation.liver,
            pancreas: state.degradation.pancreas + results.degradation.pancreas,
            kidney: state.degradation.kidney + results.degradation.kidney,
          },
        })),

      startNextDay: () =>
        set((state) => ({
          currentDay: state.currentDay + 1,
          phase: 'Planning',
          placedShips: [],
          results: null,
        })),

      retryLevel: () =>
        set((state) => ({
          currentDay: 1,
          phase: 'Planning',
          placedShips: [],
          results: null,
          degradation: state.currentLevel?.initialDegradation ?? initialDegradation,
        })),

      updateValidation: (validation) => set({ planValidation: validation }),
    }),
    {
      name: 'port-management-save',
      partialize: (state) => ({
        degradation: state.degradation,
        currentDay: state.currentDay,
      }),
    }
  )
);
