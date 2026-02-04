import { useEffect, useRef } from 'react';
import type { SimulationEngine, SimulationState } from '../core/simulation';

interface UseGameLoopOptions {
  engine: SimulationEngine | null;
  speed: number; // 0.25, 0.5, 0.75, 1, 2, 4
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

    // Don't start if no engine, paused, or complete
    if (!engine || isPaused || engine.isComplete()) {
      return;
    }

    // Calculate substep duration based on speed and substeps per hour
    // With substepsPerHour=10 and speed=1x: 1000ms / (1 * 10) = 100ms per substep
    // This means 10 substeps per second, completing 1 interpreted hour per second at 1x speed
    const substepsPerHour = engine.getSubstepsPerHour();
    const substepDuration = 1000 / (speed * substepsPerHour);

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
      onTickRef.current(newState);

      if (engine.isComplete()) {
        if (intervalRef.current !== null) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        onCompleteRef.current();
      }
    }, substepDuration);

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
