import type { DegradationState, FoodCard } from '../../types'
import { SIM_CONSTANTS } from '../../types'
import './OrganOverview.css'

interface OrganOverviewProps {
  degradation: DegradationState
  slots: (FoodCard | null)[]
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v))
}

function computeOrganHealth(degradation: DegradationState) {
  const maxPancreasTier = Math.max(
    0,
    SIM_CONSTANTS.PANCREAS_MAX_TIER - degradation.pancreasCircles * SIM_CONSTANTS.PANCREAS_TIER_PENALTY,
  )
  const pancreasHealth = clamp01(maxPancreasTier / SIM_CONSTANTS.PANCREAS_MAX_TIER)

  const baseSlow = SIM_CONSTANTS.LIVER_SLOW_FACTOR
  const currentSlow = baseSlow + degradation.liverCircles * SIM_CONSTANTS.LIVER_SLOW_PENALTY
  const liverHealth = clamp01((1 - currentSlow) / (1 - baseSlow))

  const baseDps = SIM_CONSTANTS.KIDNEY_DPS
  const currentDps = Math.max(0, baseDps - degradation.kidneysCircles * SIM_CONSTANTS.KIDNEYS_DPS_PENALTY)
  const kidneyHealth = clamp01(currentDps / baseDps)

  return { pancreasHealth, liverHealth, kidneyHealth, maxPancreasTier, currentDps }
}

function computeDefenseDps(maxPancreasTier: number, kidneyDps: number, hasProteinTag: boolean) {
  const muscleBoost = hasProteinTag ? SIM_CONSTANTS.PROTEIN_TAG_MUSCLE_BOOST : 1.0
  const muscleDps = maxPancreasTier * SIM_CONSTANTS.MUSCLE_DPS_PER_TIER * SIM_CONSTANTS.MUSCLE_MAX_TARGETS * muscleBoost
  return muscleDps + kidneyDps
}

function healthColor(pct: number): string {
  if (pct >= 0.75) return '#22c55e'
  if (pct >= 0.5) return '#eab308'
  if (pct >= 0.25) return '#f97316'
  return '#ef4444'
}

export function OrganOverview({ degradation, slots }: OrganOverviewProps) {
  const { pancreasHealth, liverHealth, kidneyHealth, maxPancreasTier, currentDps } = computeOrganHealth(degradation)

  const cards = slots.filter((s): s is FoodCard => s !== null)
  const totalGlucose = cards.reduce((sum, c) => sum + c.glucose, 0)
  const hasProteinTag = cards.some(c => c.tag === 'protein')
  const defenseDps = computeDefenseDps(maxPancreasTier, currentDps, hasProteinTag)

  // Single combined bar: defense (green) left, attack (red) right
  // Normalize both to the same scale so they're comparable
  const maxRef = 80 // reference DPS for full defense bar
  const attackNorm = clamp01(totalGlucose / 1500) // 1500mg = full attack
  const defenseNorm = clamp01(defenseDps / maxRef)
  const total = attackNorm + defenseNorm || 1
  const defenseFraction = defenseNorm / total
  const attackFraction = attackNorm / total

  return (
    <div className="organ-overview">
      <div className="organ-overview__title">Defense</div>
      <div className="organ-overview__grid">
        <OrganBar icon="⚡" pct={pancreasHealth} />
        <OrganBar icon="💪" pct={1} />
        <OrganBar icon="🫘" pct={liverHealth} />
        <OrganBar icon="🫘" pct={kidneyHealth} />
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

function OrganBar({ icon, pct }: { icon: string; pct: number }) {
  const color = healthColor(pct)
  const widthPct = Math.round(pct * 100)

  return (
    <div className="organ-overview__organ">
      <span className="organ-overview__icon">{icon}</span>
      <div className="organ-overview__health-track">
        <div
          className="organ-overview__health-fill"
          style={{ width: `${widthPct}%`, background: color }}
        />
      </div>
    </div>
  )
}
