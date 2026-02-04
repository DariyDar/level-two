import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  GamePhase,
  PlacedShip,
  SimpleDegradation,
  LevelConfig,
  DayResults,
  PlanValidation,
  MoodLevel,
  MoodEffect,
} from '../core/types';

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

  // Mood system
  currentMood: MoodLevel; // Current mood level (1-5)
  negativeEventPlanned: boolean; // Whether negative event is planned for this day
  negativeEventsToday: number; // Count of negative events today (max 1 per day)

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
  updateValidation: (validation: PlanValidation) => void;
  updateMood: (delta: MoodEffect) => void;
  checkNegativeEvent: () => void;
  resetDayCounters: () => void;
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
      currentMood: 3, // Start at middle mood level
      negativeEventPlanned: false,
      negativeEventsToday: 0,

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
          // Can't remove pre-occupied ships
          placedShips: state.placedShips.filter(
            (s) => s.instanceId !== instanceId || s.isPreOccupied
          ),
        })),

      clearPlan: () =>
        set((state) => ({
          // Keep pre-occupied ships when clearing
          placedShips: state.placedShips.filter((s) => s.isPreOccupied),
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
        set((state) => ({
          currentDay: state.currentDay + 1,
          phase: 'Planning',
          placedShips: [],
          bgHistory: [],
          results: null,
          negativeEventPlanned: false,
          negativeEventsToday: 0,
        })),

      // Retry returns to Planning of the same day (not reset level)
      retryDay: () =>
        set((state) => ({
          phase: 'Planning',
          placedShips: state.placedShips.filter((s) => s.isPreOccupied),
          bgHistory: [],
          results: null,
          negativeEventPlanned: false,
          negativeEventsToday: 0,
        })),

      updateValidation: (validation) => set({ planValidation: validation }),

      // Mood system actions
      updateMood: (delta) =>
        set((state) => ({
          currentMood: Math.max(1, Math.min(5, state.currentMood + delta)) as MoodLevel,
        })),

      checkNegativeEvent: () =>
        set((state) => {
          const maxNegEventsPerDay = 1;

          // If already at max negative events, skip check
          if (state.negativeEventsToday >= maxNegEventsPerDay) {
            console.log('[Mood] Max negative events reached, skipping check');
            return {};
          }

          // Calculate probability based on mood
          const probabilities: Record<MoodLevel, number> = {
            1: 1.0,   // 100%
            2: 0.75,  // 75%
            3: 0.5,   // 50%
            4: 0.25,  // 25%
            5: 0.0,   // 0%
          };

          const probability = probabilities[state.currentMood];
          const roll = Math.random();
          const eventOccurs = roll < probability;

          console.log(`[Mood] Pre-simulation check: Mood=${state.currentMood}, P=${probability * 100}%, Roll=${roll.toFixed(3)}, Event=${eventOccurs}`);

          if (eventOccurs) {
            return {
              negativeEventPlanned: true,
              negativeEventsToday: state.negativeEventsToday + 1,
            };
          }

          return { negativeEventPlanned: false };
        }),

      resetDayCounters: () =>
        set({
          negativeEventPlanned: false,
          negativeEventsToday: 0,
        }),
    }),
    {
      name: 'port-management-save',
      partialize: (state) => ({
        degradation: state.degradation,
        currentDay: state.currentDay,
        currentMood: state.currentMood,
      }),
    }
  )
);
