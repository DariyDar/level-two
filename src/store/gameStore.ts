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
import { DEFAULT_WP_BUDGET } from '../core/types';
import { getDayConfig } from '../core/utils/levelUtils';

interface GameState {
  // Current state
  phase: GamePhase;
  currentLevel: LevelConfig | null;
  currentDay: number;

  // Planning
  placedShips: PlacedShip[];
  planValidation: PlanValidation;

  // Simulation
  bgHistory: number[];

  // Results
  results: DayResults | null;

  // Persistent (between days/levels)
  degradation: SimpleDegradation;
  difficultyLevel: number; // Starting organ damage (0-4)

  // Willpower Points
  wpBudget: number;
  wpSpent: number;

  // UI toggles
  showDetailedIndicators: boolean;

  // Actions
  setPhase: (phase: GamePhase) => void;
  setLevel: (level: LevelConfig) => void;
  placeShip: (ship: PlacedShip) => void;
  removeShip: (instanceId: string) => void;
  clearPlan: () => void;
  setBgHistory: (history: number[]) => void;
  setResults: (results: DayResults) => void;
  startNextDay: () => void;
  retryDay: () => void;
  restartLevel: () => void;
  restartWithDifficulty: (level: number) => void;
  updateValidation: (validation: PlanValidation) => void;
  setWpBudget: (budget: number) => void;
  spendWp: (amount: number) => void;
  refundWp: (amount: number) => void;
  toggleDetailedIndicators: () => void;
}

const initialDegradation: SimpleDegradation = {
  liver: 0,
  pancreas: 0,
};

const initialValidation: PlanValidation = {
  isValid: false,
  totalCarbs: 0,
  minCarbs: 0,
  maxCarbs: 0,
  segments: [],
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
      bgHistory: [],
      results: null,
      degradation: initialDegradation,
      difficultyLevel: 0,
      wpBudget: DEFAULT_WP_BUDGET,
      wpSpent: 0,
      showDetailedIndicators: false,

      // Actions
      setPhase: (phase) => set({ phase }),

      setLevel: (level) => {
        const dayConfig = getDayConfig(level, 1); // Day 1 config
        const wpBudget = dayConfig.wpBudget ?? level.wpBudget ?? DEFAULT_WP_BUDGET;
        return set({
          currentLevel: level,
          currentDay: 1,
          placedShips: [],
          planValidation: {
            ...initialValidation,
            minCarbs: dayConfig.carbRequirements?.min ?? 0,
            maxCarbs: dayConfig.carbRequirements?.max ?? 999,
          },
          results: null,
          degradation: level.initialDegradation ?? initialDegradation,
          wpBudget,
          wpSpent: 0,
        });
      },

      placeShip: (ship) =>
        set((state) => ({
          placedShips: [...state.placedShips, ship],
        })),

      removeShip: (instanceId) =>
        set((state) => ({
          // Can't remove pre-occupied ships
          placedShips: state.placedShips.filter(
            (s) => s.instanceId !== instanceId || s.isPreOccupied
          ),
        })),

      clearPlan: () =>
        set((state) => ({
          // Keep pre-occupied ships when clearing
          placedShips: state.placedShips.filter((s) => s.isPreOccupied),
          wpSpent: 0, // Reset WP; PlanningPhase effect will re-add pre-occupied WP cost
        })),

      setBgHistory: (history) => set({ bgHistory: history }),

      setResults: (results) =>
        set((state) => ({
          results,
          degradation: {
            liver: state.degradation.liver + results.degradation.liver,
            pancreas: state.degradation.pancreas + results.degradation.pancreas,
          },
        })),

      startNextDay: () =>
        set((state) => {
          let wpBudget = DEFAULT_WP_BUDGET;
          if (state.currentLevel) {
            const dayConfig = getDayConfig(state.currentLevel, state.currentDay + 1);
            wpBudget = dayConfig.wpBudget ?? state.currentLevel.wpBudget ?? DEFAULT_WP_BUDGET;
          }
          return {
            currentDay: state.currentDay + 1,
            phase: 'Planning',
            placedShips: [],
            bgHistory: [],
            results: null,
            wpBudget,
            wpSpent: 0,
          };
        }),

      retryDay: () =>
        set((state) => ({
          phase: 'Planning',
          placedShips: state.placedShips.filter((s) => s.isPreOccupied),
          bgHistory: [],
          results: null,
          wpSpent: 0,
        })),

      restartLevel: () =>
        set((state) => {
          const level = state.currentLevel;
          let wpBudget = DEFAULT_WP_BUDGET;
          if (level) {
            const dayConfig = getDayConfig(level, 1);
            wpBudget = dayConfig.wpBudget ?? level.wpBudget ?? DEFAULT_WP_BUDGET;
          }
          const points = state.difficultyLevel * 25;
          return {
            currentDay: 1,
            phase: 'Planning',
            placedShips: [],
            bgHistory: [],
            results: null,
            degradation: points > 0 ? { liver: points, pancreas: points } : (level?.initialDegradation ?? initialDegradation),
            wpBudget,
            wpSpent: 0,
          };
        }),

      restartWithDifficulty: (level: number) =>
        set((state) => {
          const config = state.currentLevel;
          let wpBudget = DEFAULT_WP_BUDGET;
          if (config) {
            const dayConfig = getDayConfig(config, 1);
            wpBudget = dayConfig.wpBudget ?? config.wpBudget ?? DEFAULT_WP_BUDGET;
          }
          const d = Math.min(level, 4);
          const points = d * 25;
          return {
            currentDay: 1,
            phase: 'Planning',
            placedShips: [],
            bgHistory: [],
            results: null,
            difficultyLevel: d,
            degradation: { liver: points, pancreas: points },
            wpBudget,
            wpSpent: 0,
          };
        }),

      updateValidation: (validation) => set({ planValidation: validation }),

      setWpBudget: (budget) => set({ wpBudget: budget }),

      spendWp: (amount) =>
        set((state) => ({ wpSpent: state.wpSpent + amount })),

      refundWp: (amount) =>
        set((state) => ({ wpSpent: Math.max(0, state.wpSpent - amount) })),

      toggleDetailedIndicators: () =>
        set((state) => ({ showDetailedIndicators: !state.showDetailedIndicators })),
    }),
    {
      name: 'port-management-save',
      version: 2, // Increment to reset saved state
      partialize: (state) => ({
        degradation: state.degradation,
        difficultyLevel: state.difficultyLevel,
        currentDay: state.currentDay,
      }),
    }
  )
);
