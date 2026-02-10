import { useRef, useEffect, useCallback } from 'react'
import type { SimulationState } from '../types'
import type { TDSimulation } from '../core/simulation/TDSimulation'

const FIXED_DT = 1 / 60 // 60 ticks per second

interface UseSimulationLoopParams {
  engine: TDSimulation | null
  speed: number
  isPaused: boolean
  onTick: (state: SimulationState) => void
  onComplete: () => void
}

export function useSimulationLoop({
  engine,
  speed,
  isPaused,
  onTick,
  onComplete,
}: UseSimulationLoopParams): void {
  const frameRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const accumulatorRef = useRef<number>(0)

  const onTickRef = useRef(onTick)
  onTickRef.current = onTick
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  const loop = useCallback(
    (timestamp: number) => {
      if (!engine || isPaused) {
        lastTimeRef.current = timestamp
        frameRef.current = requestAnimationFrame(loop)
        return
      }

      if (lastTimeRef.current === 0) {
        lastTimeRef.current = timestamp
      }

      const elapsed = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1) // cap at 100ms
      lastTimeRef.current = timestamp
      accumulatorRef.current += elapsed * speed

      while (accumulatorRef.current >= FIXED_DT) {
        engine.tick(FIXED_DT)
        accumulatorRef.current -= FIXED_DT

        if (engine.isComplete()) {
          onCompleteRef.current()
          return
        }
      }

      onTickRef.current(engine.getState())
      frameRef.current = requestAnimationFrame(loop)
    },
    [engine, speed, isPaused],
  )

  useEffect(() => {
    if (!engine) return
    lastTimeRef.current = 0
    accumulatorRef.current = 0
    frameRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frameRef.current)
  }, [engine, loop])
}
