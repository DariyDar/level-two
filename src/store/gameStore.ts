import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  GamePhase,
  PlacedShip,
  SimpleDegradation,
  LevelConfig,
  DayResults,
  PlanValidation,
  Ship,
} from '../core/types';
import { DEFAULT_MOVE_BUDGET } from '../core/types';
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

  // Match-3 move system (replaces WP)
  moveBudget: number;
  movesUsed: number;

  // Match-3 inventory (food tiles that dropped from board)
  match3Inventory: Ship[];

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
  setMoveBudget: (budget: number) => void;
  useMove: () => void;
  addToMatch3Inventory: (ship: Ship) => void;
  clearMatch3Inventory: () => void;
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
      moveBudget: DEFAULT_MOVE_BUDGET,
      movesUsed: 0,
      match3Inventory: [],
      showDetailedIndicators: false,

      // Actions
      setPhase: (phase) => set({ phase }),

      setLevel: (level) => {
        const dayConfig = getDayConfig(level, 1); // Day 1 config
        const moveBudget = dayConfig.moveBudget ?? level.moveBudget ?? DEFAULT_MOVE_BUDGET;
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
          moveBudget,
          movesUsed: 0,
          match3Inventory: [],
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
        set((_state) => ({
          // Keep pre-occupied ships when clearing
          placedShips: _state.placedShips.filter((s) => s.isPreOccupied),
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
          let moveBudget = DEFAULT_MOVE_BUDGET;
          if (state.currentLevel) {
            const dayConfig = getDayConfig(state.currentLevel, state.currentDay + 1);
            moveBudget = dayConfig.moveBudget ?? state.currentLevel.moveBudget ?? DEFAULT_MOVE_BUDGET;
          }
          return {
            currentDay: state.currentDay + 1,
            phase: 'Planning',
            placedShips: [],
            bgHistory: [],
            results: null,
            moveBudget,
            movesUsed: 0,
            match3Inventory: [],
          };
        }),

      retryDay: () =>
        set((state) => ({
          phase: 'Planning',
          placedShips: state.placedShips.filter((s) => s.isPreOccupied),
          bgHistory: [],
          results: null,
          movesUsed: 0,
          match3Inventory: [],
        })),

      restartLevel: () =>
        set((state) => {
          const level = state.currentLevel;
          let moveBudget = DEFAULT_MOVE_BUDGET;
          if (level) {
            const dayConfig = getDayConfig(level, 1);
            moveBudget = dayConfig.moveBudget ?? level.moveBudget ?? DEFAULT_MOVE_BUDGET;
          }
          const points = state.difficultyLevel * 25;
          return {
            currentDay: 1,
            phase: 'Planning',
            placedShips: [],
            bgHistory: [],
            results: null,
            degradation: points > 0 ? { liver: points, pancreas: points } : (level?.initialDegradation ?? initialDegradation),
            moveBudget,
            movesUsed: 0,
            match3Inventory: [],
          };
        }),

      restartWithDifficulty: (level: number) =>
        set((state) => {
          const config = state.currentLevel;
          let moveBudget = DEFAULT_MOVE_BUDGET;
          if (config) {
            const dayConfig = getDayConfig(config, 1);
            moveBudget = dayConfig.moveBudget ?? config.moveBudget ?? DEFAULT_MOVE_BUDGET;
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
            moveBudget,
            movesUsed: 0,
            match3Inventory: [],
          };
        }),

      updateValidation: (validation) => set({ planValidation: validation }),

      setMoveBudget: (budget) => set({ moveBudget: budget }),

      useMove: () =>
        set((state) => ({ movesUsed: state.movesUsed + 1 })),

      addToMatch3Inventory: (ship) =>
        set((state) => ({ match3Inventory: [...state.match3Inventory, ship] })),

      clearMatch3Inventory: () => set({ match3Inventory: [] }),

      toggleDetailedIndicators: () =>
        set((state) => ({ showDetailedIndicators: !state.showDetailedIndicators })),
    }),
    {
      name: 'port-management-save',
      version: 3, // Increment to reset saved state (WP → moves migration)
      partialize: (state) => ({
        degradation: state.degradation,
        difficultyLevel: state.difficultyLevel,
        currentDay: state.currentDay,
      }),
    }
  )
);
