import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Ship } from '../../core/types';
import { SimulationEngine } from '../../core/simulation';
import type { SimulationState } from '../../core/simulation';
import { useGameStore } from '../../store/gameStore';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useInterpolatedValues } from '../../hooks/useInterpolatedValue';
import { loadAllShips } from '../../config/loader';
import { getDayConfig } from '../../core/utils/levelUtils';
import { BodyDiagram } from './BodyDiagram';
import { BoostButton } from './BoostButton';
import { ShipQueue } from './ShipQueue';
import { PipeSystem } from './PipeSystem';
import { MoodScale } from '../ui/MoodScale';
import './SimulationPhase.css';

// Available simulation speeds
type SimSpeed = 0.25 | 0.5 | 0.75 | 1 | 2 | 4;
const SPEEDS: SimSpeed[] = [0.25, 0.5, 0.75, 1, 2, 4];

export function SimulationPhase() {
  const {
    placedShips,
    currentLevel,
    currentDay,
    degradation,
    setPhase,
    setBgHistory,
    mood,
    applyMoodDelta,
  } = useGameStore();

  const [allShips, setAllShips] = useState<Ship[]>([]);
  const [engine, setEngine] = useState<SimulationEngine | null>(null);
  const [simState, setSimState] = useState<SimulationState | null>(null);
  const [speed, setSpeed] = useState<SimSpeed>(0.25); // Default speed
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load ships and create engine
  useEffect(() => {
    async function init() {
      const ships = await loadAllShips();
      setAllShips(ships);

      if (currentLevel) {
        const dayConfig = getDayConfig(currentLevel, currentDay);
        const eng = new SimulationEngine(
          placedShips,
          ships,
          degradation,
          {
            initialBG: currentLevel.initialBG ?? 100,
            pancreasBoostCharges: dayConfig.pancreasBoostCharges,
            initialMood: mood,
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
      currentMood: state.currentMood,
      moodHistory: [...state.moodHistory],
    });
  }, []);

  const handleComplete = useCallback(() => {
    // Save BG history and mood before transitioning
    if (engine) {
      const finalState = engine.getState();
      setBgHistory(finalState.bgHistory);
      applyMoodDelta(finalState.currentMood - mood);
    }
    setPhase('Results');
  }, [setPhase, setBgHistory, engine, mood, applyMoodDelta]);

  // Use game loop hook
  useGameLoop({
    engine,
    speed,
    isPaused,
    onTick: handleTick,
    onComplete: handleComplete,
  });

  // Calculate dissolve progress for current unloading ship
  const targetDissolveProgress = simState?.unloadingShip
    ? (simState.unloadingShip.totalTicks - simState.unloadingShip.remainingTicks) / simState.unloadingShip.totalTicks
    : 0;

  // Interpolated values for smooth animation
  // With substep simulation, tick duration is now much shorter
  const substepsPerHour = engine?.getSubstepsPerHour() ?? 10;
  const substepDuration = 1000 / (speed * substepsPerHour);
  const interpolated = useInterpolatedValues({
    targetLiver: simState?.containers.liver ?? 0,
    targetBG: simState?.containers.bg ?? 100,
    targetMuscleRate: simState?.currentMuscleRate ?? 0,
    targetLiverRate: simState?.currentLiverRate ?? 0,
    targetDissolveProgress,
    duration: substepDuration * 0.9, // Finish slightly before next substep
    isPaused,
  });

  // Boost handlers
  // DISABLED: Liver Boost handler - preserved for future use
  // const handleLiverBoost = useCallback(() => {
  //   if (engine) {
  //     engine.activateLiverBoost();
  //     setSimState(engine.getState());
  //   }
  // }, [engine]);

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

        {/* Fast Insulin button in header */}
        <BoostButton
          label="Fast Insulin"
          emoji="💧"
          boost={simState.pancreasBoost}
          cooldownMax={3}
          onActivate={handlePancreasBoost}
          isFastInsulin={true}
        />

        {/* Mood indicator */}
        <MoodScale mood={simState?.currentMood ?? mood} />
      </div>

      {/* Main simulation area with pipe system */}
      <div className="simulation-phase__main">
        {/* Pipe System - spans both BodyDiagram and ShipQueue */}
        <PipeSystem
          activeShipSlot={
            simState.unloadingShip
              ? placedShips.find(p => p.instanceId === simState.unloadingShip!.instanceId)?.startSlot ?? null
              : null
          }
          shipUnloadingRate={simState.unloadingShip?.loadPerTick ?? 0}
          liverToBgRate={interpolated.liverRate}
          isLiverPassthrough={simState.isLiverPassthrough}
          bgToMusclesRate={interpolated.muscleRate}
          bgToKidneysRate={0}
          pancreasTier={simState.currentPancreasTier}
          speed={speed}
          isPaused={isPaused}
        />

        {/* Body Diagram */}
        <BodyDiagram state={simState} degradation={simState.degradation} interpolated={interpolated} />

        {/* Ship Queue */}
        <ShipQueue
          placedShips={placedShips}
          unloadingShip={simState.unloadingShip}
          remainingShips={simState.remainingShips}
          ships={shipsMap}
          dissolveProgress={interpolated.dissolveProgress}
        />
      </div>

      {/* DISABLED: Liver Boost - functionality preserved but UI hidden
      <div className="simulation-phase__boosts">
        <BoostButton
          label="Liver Boost"
          emoji="🔥"
          boost={simState.liverBoost}
          cooldownMax={1}
          onActivate={handleLiverBoost}
        />
      </div>
      */}
    </div>
  );
}
