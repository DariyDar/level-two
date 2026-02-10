import type { DegradationState, FoodCard } from '../../types'
import { SIM_CONSTANTS } from '../../types'
import { OrganTierCircles } from './OrganTierCircles'
import './OrganOverview.css'

interface OrganOverviewProps {
  degradation: DegradationState
  slots: (FoodCard | null)[]
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v))
}

function computeDefenseInfo(degradation: DegradationState, slots: (FoodCard | null)[]) {
  const maxPancreasTier = Math.max(
    0,
    SIM_CONSTANTS.PANCREAS_MAX_TIER - degradation.pancreasCircles * SIM_CONSTANTS.PANCREAS_TIER_PENALTY,
  )

  const cards = slots.filter((s): s is FoodCard => s !== null)
  const hasProteinTag = cards.some(c => c.tag === 'protein')
  const muscleBoost = hasProteinTag ? SIM_CONSTANTS.PROTEIN_TAG_MUSCLE_BOOST : 1.0

  const kidneyDps = Math.max(0, SIM_CONSTANTS.KIDNEY_DPS - degradation.kidneysCircles * SIM_CONSTANTS.KIDNEYS_DPS_PENALTY)
  const muscleDps = maxPancreasTier * SIM_CONSTANTS.MUSCLE_DPS_PER_TIER * SIM_CONSTANTS.MUSCLE_MAX_TARGETS * muscleBoost
  const defenseDps = muscleDps + kidneyDps

  const totalGlucose = cards.reduce((sum, c) => sum + c.glucose, 0)

  return { defenseDps, totalGlucose }
}

// Max circles per organ for degradation display
const MAX_ORGAN_CIRCLES = 4

export function OrganOverview({ degradation, slots }: OrganOverviewProps) {
  const { defenseDps, totalGlucose } = computeDefenseInfo(degradation, slots)
  const cards = slots.filter((s): s is FoodCard => s !== null)

  // Versus bar fractions
  const attackNorm = clamp01(totalGlucose / 1500)
  const defenseNorm = clamp01(defenseDps / 80)
  const total = attackNorm + defenseNorm || 1
  const defenseFraction = defenseNorm / total
  const attackFraction = attackNorm / total

  return (
    <div className="organ-overview">
      <div className="organ-overview__title">Defense</div>

      <div className="organ-overview__grid">
        <OrganRow icon="⚡" degraded={degradation.pancreasCircles} colorScheme="orange" />
        <OrganRow icon="💪" degraded={0} colorScheme="orange" />
        <OrganRow icon="🫘" degraded={degradation.liverCircles} colorScheme="green" />
        <OrganRow icon="🫘" degraded={degradation.kidneysCircles} colorScheme="green" />
      </div>

      {cards.length > 0 && (
        <div className="organ-overview__versus">
          <span className="organ-overview__vs-label organ-overview__vs-label--def">
            {Math.round(defenseDps)} dps
          </span>
          <div className="organ-overview__vs-track">
            <div
              className="organ-overview__vs-fill organ-overview__vs-fill--def"
              style={{ width: `${defenseFraction * 100}%` }}
            />
            <div
              className="organ-overview__vs-fill organ-overview__vs-fill--atk"
              style={{ width: `${attackFraction * 100}%` }}
            />
          </div>
          <span className="organ-overview__vs-label organ-overview__vs-label--atk">
            {totalGlucose} mg
          </span>
        </div>
      )}
    </div>
  )
}

function OrganRow({ icon, degraded, colorScheme }: {
  icon: string
  degraded: number
  colorScheme: 'orange' | 'green'
}) {
  return (
    <div className="organ-overview__organ">
      <span className="organ-overview__icon">{icon}</span>
      <OrganTierCircles
        maxCircles={MAX_ORGAN_CIRCLES}
        degradedCircles={degraded}
        colorScheme={colorScheme}
      />
    </div>
  )
}
