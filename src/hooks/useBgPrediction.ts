import { useState, useEffect, useRef, useMemo } from 'react';
import { SimulationEngine } from '../core/simulation';
import type { PlacedShip, Ship, SimpleDegradation } from '../core/types';

export interface BgPrediction {
  bgHistory: number[];
  maxBG: number;
  minBG: number;
}

export function useBgPrediction(
  placedShips: PlacedShip[],
  allShips: Ship[],
  degradation: SimpleDegradation,
  initialBG: number,
  debounceMs = 300
): BgPrediction {
  const flatLine = useMemo(
    () => Array(19).fill(initialBG) as number[],
    [initialBG]
  );

  const [prediction, setPrediction] = useState<BgPrediction>({
    bgHistory: flatLine,
    maxBG: initialBG,
    minBG: initialBG,
  });

  const timerRef = useRef<number | null>(null);

  // Stable fingerprint of placed ships to avoid spurious recomputations
  const fingerprint = useMemo(
    () =>
      placedShips
        .map((s) => `${s.shipId}:${s.segment}:${s.row}:${s.startSlot}`)
        .sort()
        .join('|'),
    [placedShips]
  );

  useEffect(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
    }

    // No ships — flat line immediately
    if (placedShips.length === 0 || allShips.length === 0) {
      setPrediction({
        bgHistory: flatLine,
        maxBG: initialBG,
        minBG: initialBG,
      });
      return;
    }

    timerRef.current = window.setTimeout(() => {
      const engine = new SimulationEngine(
        placedShips,
        allShips,
        degradation,
        { initialBG }
      );

      while (!engine.isComplete()) {
        engine.tick();
      }

      const bgHistory = engine.getState().bgHistory;
      setPrediction({
        bgHistory,
        maxBG: Math.max(...bgHistory),
        minBG: Math.min(...bgHistory),
      });
    }, debounceMs);

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fingerprint, allShips, degradation, initialBG, debounceMs, flatLine]);

  return prediction;
}
