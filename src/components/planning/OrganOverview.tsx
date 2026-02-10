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

  // Liver: base slowFactor means (1 - factor) effectiveness. At 1.0 → 0% health
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

  // Scale bars: use 1500mg as reference max for glucose, 80 DPS as reference max for defense
  const attackPct = clamp01(totalGlucose / 1500)
  const defensePctBar = clamp01(defenseDps / 80)

  return (
    <div className="organ-overview">
      <div className="organ-overview__title">Organs</div>
      <div className="organ-overview__organs">
        <OrganRow icon="⚡" name="Pancreas" pct={pancreasHealth} label={`T${maxPancreasTier}`} />
        <OrganRow icon="💪" name="Muscles" pct={1} label={`${SIM_CONSTANTS.MUSCLE_DPS_PER_TIER}/tier`} />
        <OrganRow icon="🫘" name="Liver" pct={liverHealth} label={`${Math.round(liverHealth * 100)}%`} />
        <OrganRow icon="🫘" name="Kidneys" pct={kidneyHealth} label={`${currentDps} dps`} />
      </div>

      {cards.length > 0 && (
        <div className="organ-overview__comparison">
          <div className="organ-overview__bar-row">
            <span className="organ-overview__bar-label">Attack</span>
            <div className="organ-overview__bar-track">
              <div
                className="organ-overview__bar-fill organ-overview__bar-fill--attack"
                style={{ width: `${attackPct * 100}%` }}
              />
            </div>
            <span className="organ-overview__bar-value organ-overview__bar-value--attack">
              {totalGlucose} mg
            </span>
          </div>
          <div className="organ-overview__bar-row">
            <span className="organ-overview__bar-label">Defense</span>
            <div className="organ-overview__bar-track">
              <div
                className="organ-overview__bar-fill organ-overview__bar-fill--defense"
                style={{ width: `${defensePctBar * 100}%` }}
              />
            </div>
            <span className="organ-overview__bar-value organ-overview__bar-value--defense">
              {Math.round(defenseDps)} dps
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

function OrganRow({ icon, name, pct, label }: { icon: string; name: string; pct: number; label: string }) {
  const color = healthColor(pct)
  const widthPct = Math.round(pct * 100)

  return (
    <div className="organ-overview__organ">
      <span className="organ-overview__icon">{icon}</span>
      <span className="organ-overview__name">{name}</span>
      <div className="organ-overview__health-track">
        <div
          className="organ-overview__health-fill"
          style={{ width: `${widthPct}%`, background: color }}
        />
      </div>
      <span className="organ-overview__val" style={{ color }}>
        {label}
      </span>
    </div>
  )
}
