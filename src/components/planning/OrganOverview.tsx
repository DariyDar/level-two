import type { DegradationState } from '../../types'
import { SIM_CONSTANTS } from '../../types'
import './OrganOverview.css'

interface OrganOverviewProps {
  degradation: DegradationState
}

export function OrganOverview({ degradation }: OrganOverviewProps) {
  const maxPancreasTier = Math.max(
    0,
    SIM_CONSTANTS.PANCREAS_MAX_TIER - degradation.pancreasCircles * SIM_CONSTANTS.PANCREAS_TIER_PENALTY,
  )
  const liverSlowFactor = SIM_CONSTANTS.LIVER_SLOW_FACTOR + degradation.liverCircles * SIM_CONSTANTS.LIVER_SLOW_PENALTY
  const kidneyDps = Math.max(
    0,
    SIM_CONSTANTS.KIDNEY_DPS - degradation.kidneysCircles * SIM_CONSTANTS.KIDNEYS_DPS_PENALTY,
  )
  const muscleDpsPerTier = SIM_CONSTANTS.MUSCLE_DPS_PER_TIER

  const hasDegradation = degradation.totalCircles > 0

  return (
    <div className="organ-overview">
      <div className="organ-overview__title">Organs</div>
      <div className="organ-overview__grid">
        <div className="organ-overview__organ">
          <span className="organ-overview__icon">⚡</span>
          <span className="organ-overview__name">Pancreas</span>
          <span className={`organ-overview__val ${degradation.pancreasCircles > 0 ? 'organ-overview__val--degraded' : ''}`}>
            Max T{maxPancreasTier}
          </span>
        </div>
        <div className="organ-overview__organ">
          <span className="organ-overview__icon">💪</span>
          <span className="organ-overview__name">Muscles</span>
          <span className="organ-overview__val">{muscleDpsPerTier}/tier</span>
        </div>
        <div className="organ-overview__organ">
          <span className="organ-overview__icon">🫘</span>
          <span className="organ-overview__name">Liver</span>
          <span className={`organ-overview__val ${degradation.liverCircles > 0 ? 'organ-overview__val--degraded' : ''}`}>
            ×{liverSlowFactor.toFixed(1)} slow
          </span>
        </div>
        <div className="organ-overview__organ">
          <span className="organ-overview__icon">🫘</span>
          <span className="organ-overview__name">Kidneys</span>
          <span className={`organ-overview__val ${degradation.kidneysCircles > 0 ? 'organ-overview__val--degraded' : ''}`}>
            {kidneyDps} dps
          </span>
        </div>
      </div>
      {hasDegradation && (
        <div className="organ-overview__degradation">
          {degradation.liverCircles > 0 && (
            <span className="organ-overview__dmg">🫘 Liver -{degradation.liverCircles}</span>
          )}
          {degradation.pancreasCircles > 0 && (
            <span className="organ-overview__dmg">⚡ Pancreas -{degradation.pancreasCircles}</span>
          )}
          {degradation.kidneysCircles > 0 && (
            <span className="organ-overview__dmg">🫘 Kidneys -{degradation.kidneysCircles}</span>
          )}
        </div>
      )}
    </div>
  )
}
