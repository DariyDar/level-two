import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Ship } from '../../core/types';
import { SimulationEngine } from '../../core/simulation';
import type { SimulationState } from '../../core/simulation';
import { useGameStore } from '../../store/gameStore';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useInterpolatedValues } from '../../hooks/useInterpolatedValue';
import { loadAllShips } from '../../config/loader';
import { BodyDiagram } from './BodyDiagram';
import { BoostButton } from './BoostButton';
import { ShipQueue } from './ShipQueue';
import './SimulationPhase.css';

// Available simulation speeds
type SimSpeed = 0.25 | 0.5 | 0.75 | 1 | 2 | 4;
const SPEEDS: SimSpeed[] = [0.25, 0.5, 0.75, 1, 2, 4];

export function SimulationPhase() {
  const {
    placedShips,
    currentLevel,
    degradation,
    setPhase,
    setBgHistory,
  } = useGameStore();

  const [allShips, setAllShips] = useState<Ship[]>([]);
  const [engine, setEngine] = useState<SimulationEngine | null>(null);
  const [simState, setSimState] = useState<SimulationState | null>(null);
  const [speed, setSpeed] = useState<SimSpeed>(0.25); // Default to slowest
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load ships and create engine
  useEffect(() => {
    async function init() {
      const ships = await loadAllShips();
      setAllShips(ships);

      if (currentLevel) {
        const eng = new SimulationEngine(
          placedShips,
          ships,
          degradation,
          {
            initialBG: currentLevel.initialBG ?? 100,
          }
        );
        setEngine(eng);
        setSimState(eng.getState());
      }

      setIsLoading(false);
    }
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ships map for lookups
  const shipsMap = useMemo(
    () => new Map(allShips.map((s) => [s.id, s])),
    [allShips]
  );

  // Game loop callbacks
  const handleTick = useCallback((state: SimulationState) => {
    // Deep copy to trigger React re-render
    setSimState({
      ...state,
      containers: { ...state.containers },
      unloadingShip: state.unloadingShip ? { ...state.unloadingShip } : null,
      remainingShips: [...state.remainingShips],
      bgHistory: [...state.bgHistory],
      liverBoost: { ...state.liverBoost },
      pancreasBoost: { ...state.pancreasBoost },
    });
  }, []);

  const handleComplete = useCallback(() => {
    // Save BG history before transitioning
    if (engine) {
      setBgHistory(engine.getState().bgHistory);
    }
    setPhase('Results');
  }, [setPhase, setBgHistory, engine]);

  // Use game loop hook
  useGameLoop({
    engine,
    speed,
    isPaused,
    onTick: handleTick,
    onComplete: handleComplete,
  });

  // Interpolated values for smooth animation
  const tickDuration = 1000 / speed;
  const interpolated = useInterpolatedValues({
    targetLiver: simState?.containers.liver ?? 0,
    targetBG: simState?.containers.bg ?? 100,
    targetMuscleRate: simState?.currentMuscleRate ?? 0,
    targetLiverRate: simState?.currentLiverRate ?? 0,
    duration: tickDuration * 0.9, // Finish slightly before next tick
    isPaused,
  });

  // Boost handlers
  const handleLiverBoost = useCallback(() => {
    if (engine) {
      engine.activateLiverBoost();
      setSimState(engine.getState());
    }
  }, [engine]);

  const handlePancreasBoost = useCallback(() => {
    if (engine) {
      engine.activatePancreasBoost();
      setSimState(engine.getState());
    }
  }, [engine]);

  if (isLoading || !simState || !currentLevel) {
    return (
      <div className="simulation-phase simulation-phase--loading">
        Loading simulation...
      </div>
    );
  }

  const gameHour = 6 + simState.currentTick; // Start at 06:00
  const hourString = `${gameHour.toString().padStart(2, '0')}:00`;
  const progressPercent = (simState.currentTick / 18) * 100;

  return (
    <div className="simulation-phase">
      {/* Header */}
      <div className="simulation-phase__header">
        <div className="simulation-phase__time">
          <span className="simulation-phase__hour">{hourString}</span>
          <span className="simulation-phase__segment">{simState.currentSegment}</span>
        </div>

        <div className="simulation-phase__progress">
          <div className="simulation-phase__progress-bar">
            <div
              className="simulation-phase__progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="simulation-phase__progress-text">
            {simState.currentTick}/18h
          </span>
        </div>

        <div className="simulation-phase__controls">
          <button
            className={`simulation-phase__control ${isPaused ? 'simulation-phase__control--active' : ''}`}
            onClick={() => setIsPaused(!isPaused)}
          >
            {isPaused ? '▶' : '⏸'}
          </button>
          {SPEEDS.map((s) => (
            <button
              key={s}
              className={`simulation-phase__control ${speed === s && !isPaused ? 'simulation-phase__control--active' : ''}`}
              onClick={() => {
                setSpeed(s);
                setIsPaused(false);
              }}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Body Diagram */}
      <BodyDiagram state={simState} degradation={degradation} interpolated={interpolated} speed={speed} />

      {/* Ship Queue */}
      <ShipQueue
        placedShips={placedShips}
        unloadingShip={simState.unloadingShip}
        remainingShips={simState.remainingShips}
        ships={shipsMap}
        currentTick={simState.currentTick}
      />

      {/* Boost Buttons */}
      <div className="simulation-phase__boosts">
        <BoostButton
          label="Liver Boost"
          emoji="🔥"
          boost={simState.liverBoost}
          cooldownMax={1}
          onActivate={handleLiverBoost}
        />
        <BoostButton
          label="Muscle Boost"
          emoji="💪"
          boost={simState.pancreasBoost}
          cooldownMax={3}
          onActivate={handlePancreasBoost}
        />
      </div>
    </div>
  );
}
