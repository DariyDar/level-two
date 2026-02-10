import type { DegradationState, FoodCard } from '../../types'
import { SIM_CONSTANTS } from '../../types'
import './VersusBar.css'

interface VersusBarProps {
  degradation: DegradationState
  slots: (FoodCard | null)[]
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v))
}

export function VersusBar({ degradation, slots }: VersusBarProps) {
  const cards = slots.filter((s): s is FoodCard => s !== null)
  if (cards.length === 0) return null

  const maxPancreasTier = Math.max(
    0,
    SIM_CONSTANTS.PANCREAS_MAX_TIER - degradation.pancreasCircles * SIM_CONSTANTS.PANCREAS_TIER_PENALTY,
  )
  const hasProteinTag = cards.some(c => c.tag === 'protein')
  const muscleBoost = hasProteinTag ? SIM_CONSTANTS.PROTEIN_TAG_MUSCLE_BOOST : 1.0
  const kidneyDps = Math.max(0, SIM_CONSTANTS.KIDNEY_DPS - degradation.kidneysCircles * SIM_CONSTANTS.KIDNEYS_DPS_PENALTY)
  const muscleDps = maxPancreasTier * SIM_CONSTANTS.MUSCLE_DPS_PER_TIER * SIM_CONSTANTS.MUSCLE_MAX_TARGETS * muscleBoost
  const defenseDps = muscleDps + kidneyDps
  const totalGlucose = cards.reduce((sum, c) => sum + c.glucose, 0)

  const attackNorm = clamp01(totalGlucose / 1500)
  const defenseNorm = clamp01(defenseDps / 80)
  const total = attackNorm + defenseNorm || 1
  const defenseFraction = defenseNorm / total
  const attackFraction = attackNorm / total

  return (
    <div className="versus-bar">
      <span className="versus-bar__label versus-bar__label--def">Defense</span>
      <div className="versus-bar__track">
        <div className="versus-bar__fill versus-bar__fill--def" style={{ width: `${defenseFraction * 100}%` }} />
        <div className="versus-bar__fill versus-bar__fill--atk" style={{ width: `${attackFraction * 100}%` }} />
      </div>
      <span className="versus-bar__label versus-bar__label--atk">Attack</span>
    </div>
  )
}
