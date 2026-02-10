import { useState, useMemo, useCallback } from 'react'
import { useGameStore } from '../../store/gameStore'
import { TDSimulation } from '../../core/simulation/TDSimulation'
import { useSimulationLoop } from '../../hooks/useSimulationLoop'
import { Battlefield } from './Battlefield'
import { OrganStatus } from './OrganStatus'
import { MEAL_SEGMENTS } from '../../types'
import type { FoodCard, SimulationState } from '../../types'
import './SimulationPhase.css'

const INITIAL_SPEED = 1

export function SimulationPhase() {
  const {
    mealSlots,
    currentDay,
    currentSegment,
    currentLevel,
    degradation,
    completeSimulation,
  } = useGameStore()

  const [speed, setSpeed] = useState(INITIAL_SPEED)
  const [isPaused, setIsPaused] = useState(false)
  const [simState, setSimState] = useState<SimulationState | null>(null)

  const cards = mealSlots.filter((c): c is FoodCard => c !== null)
  const segmentDelay = currentLevel?.days[currentDay]?.segments[currentSegment]?.segmentDelay ?? 3

  const engine = useMemo(() => {
    if (cards.length !== 3) return null
    return new TDSimulation(cards, degradation, segmentDelay)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleTick = useCallback((state: SimulationState) => {
    setSimState({ ...state, projectiles: [...state.projectiles] })
  }, [])

  const handleComplete = useCallback(() => {
    if (!engine) return
    const finalState = engine.getState()
    completeSimulation(finalState.excessGlucose)
  }, [engine, completeSimulation])

  useSimulationLoop({
    engine,
    speed,
    isPaused,
    onTick: handleTick,
    onComplete: handleComplete,
  })

  const segmentName = MEAL_SEGMENTS[currentSegment] ?? 'Meal'

  if (!simState) {
    return <div className="sim-phase">Initializing simulation...</div>
  }

  return (
    <div className="sim-phase">
      <div className="sim-header">
        <span className="sim-header__segment">{segmentName}</span>
        <span className="sim-header__time">{simState.time.toFixed(1)}s</span>
        <div className="sim-header__controls">
          <button
            className="sim-control-btn"
            onClick={() => setIsPaused(!isPaused)}
          >
            {isPaused ? '▶' : '⏸'}
          </button>
          {[0.5, 1, 2, 4].map(s => (
            <button
              key={s}
              className={`sim-speed-btn ${speed === s ? 'sim-speed-btn--active' : ''}`}
              onClick={() => setSpeed(s)}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      <Battlefield state={simState} mealCards={cards} />
      <OrganStatus state={simState} />
    </div>
  )
}
