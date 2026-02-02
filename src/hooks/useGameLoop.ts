import { useEffect, useRef, useCallback } from 'react';
import type { SimulationEngine, SimulationState } from '../core/simulation';

interface UseGameLoopOptions {
  engine: SimulationEngine | null;
  speed: 1 | 2 | 4;
  isPaused: boolean;
  onTick: (state: SimulationState) => void;
  onComplete: () => void;
}

export function useGameLoop({
  engine,
  speed,
  isPaused,
  onTick,
  onComplete,
}: UseGameLoopOptions) {
  const intervalRef = useRef<number | null>(null);

  const clearLoop = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    // Clear any existing loop
    clearLoop();

    // Don't start if no engine, paused, or complete
    if (!engine || isPaused || engine.isComplete()) {
      return;
    }

    // Calculate tick duration based on speed
    // 1x = 1000ms, 2x = 500ms, 4x = 250ms
    const tickDuration = 1000 / speed;

    intervalRef.current = window.setInterval(() => {
      if (engine.isComplete()) {
        clearLoop();
        onComplete();
        return;
      }

      const newState = engine.tick();
      onTick(newState);

      if (engine.isComplete()) {
        clearLoop();
        onComplete();
      }
    }, tickDuration);

    return clearLoop;
  }, [engine, speed, isPaused, onTick, onComplete, clearLoop]);

  return { clearLoop };
}
