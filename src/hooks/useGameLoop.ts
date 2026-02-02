import { useEffect, useRef } from 'react';
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
  const onTickRef = useRef(onTick);
  const onCompleteRef = useRef(onComplete);

  // Keep refs updated
  onTickRef.current = onTick;
  onCompleteRef.current = onComplete;

  useEffect(() => {
    // Clear any existing loop
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    console.log('[GameLoop] Effect:', {
      hasEngine: !!engine,
      isPaused,
      isComplete: engine?.isComplete(),
      speed
    });

    // Don't start if no engine, paused, or complete
    if (!engine || isPaused || engine.isComplete()) {
      return;
    }

    // Calculate tick duration based on speed
    // 1x = 1000ms, 2x = 500ms, 4x = 250ms
    const tickDuration = 1000 / speed;

    console.log('[GameLoop] Starting interval, tickDuration:', tickDuration);

    intervalRef.current = window.setInterval(() => {
      if (engine.isComplete()) {
        if (intervalRef.current !== null) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        onCompleteRef.current();
        return;
      }

      const newState = engine.tick();
      console.log('[GameLoop] Tick:', newState.currentTick, 'BG:', newState.containers.bg);
      onTickRef.current(newState);

      if (engine.isComplete()) {
        if (intervalRef.current !== null) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        onCompleteRef.current();
      }
    }, tickDuration);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [engine, speed, isPaused]);

  return {
    clearLoop: () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  };
}
