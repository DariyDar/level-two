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
import { MOOD_INITIAL, MOOD_MIN, MOOD_MAX } from '../core/types';

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

  // Mood System (replaces WP)
  mood: number;           // Current mood (-50..+50), carries between days
  moodAtDayStart: number; // Saved for retry

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
  updateValidation: (validation: PlanValidation) => void;
  setMood: (mood: number) => void;
  applyMoodDelta: (delta: number) => void;
  toggleDetailedIndicators: () => void;
}

const initialDegradation: SimpleDegradation = {
  liver: 0,
  pancreas: 0,
};

const initialValidation: PlanValidation = {
  isValid: false,
  errors: [],
  warnings: [],
};

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      // Initial state
      phase: 'PreGame',
      currentLevel: null,
      currentDay: 1,
      placedShips: [],
      planValidation: initialValidation,
      bgHistory: [],
      results: null,
      degradation: initialDegradation,
      mood: MOOD_INITIAL,
      moodAtDayStart: MOOD_INITIAL,
      showDetailedIndicators: false,

      // Actions
      setPhase: (phase) => set({ phase }),

      setLevel: (level) => {
        return set({
          currentLevel: level,
          currentDay: 1,
          phase: 'PreGame',
          placedShips: [],
          planValidation: initialValidation,
          results: null,
          degradation: level.initialDegradation ?? initialDegradation,
          mood: MOOD_INITIAL,
          moodAtDayStart: MOOD_INITIAL,
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
          phase: 'PreGame',
          placedShips: [],
          bgHistory: [],
          results: null,
          moodAtDayStart: state.mood, // Snapshot mood for retry
        })),

      retryDay: () =>
        set((state) => ({
          phase: 'Planning',
          placedShips: state.placedShips.filter((s) => s.isPreOccupied),
          bgHistory: [],
          results: null,
          mood: state.moodAtDayStart, // Reset to start-of-day value
        })),

      updateValidation: (validation) => set({ planValidation: validation }),

      setMood: (mood) => set({ mood: Math.max(MOOD_MIN, Math.min(MOOD_MAX, mood)) }),

      applyMoodDelta: (delta) =>
        set((state) => ({
          mood: Math.max(MOOD_MIN, Math.min(MOOD_MAX, state.mood + delta)),
        })),

      toggleDetailedIndicators: () =>
        set((state) => ({ showDetailedIndicators: !state.showDetailedIndicators })),
    }),
    {
      name: 'port-management-save',
      version: 2, // Incremented to reset saved state from v1
      partialize: (state) => ({
        degradation: state.degradation,
        currentDay: state.currentDay,
        mood: state.mood,
        moodAtDayStart: state.moodAtDayStart,
      }),
    }
  )
);
