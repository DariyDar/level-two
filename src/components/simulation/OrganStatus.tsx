import type { SimulationState } from '../../types'
import { SIM_CONSTANTS } from '../../types'
import { OrganTierCircles } from '../planning/OrganTierCircles'
import './OrganStatus.css'

interface OrganStatusProps {
  state: SimulationState
}

const MAX_CIRCLES = 4

export function OrganStatus({ state }: OrganStatusProps) {
  const { organs, excessGlucose, projectiles } = state

  // Derive degradation from organ state
  const pancreasDegraded = MAX_CIRCLES - organs.pancreas.maxTier
  const liverDegraded = Math.round((organs.liver.slowFactor - SIM_CONSTANTS.LIVER_SLOW_FACTOR) / SIM_CONSTANTS.LIVER_SLOW_PENALTY)
  const kidneyDegraded = Math.max(0, Math.ceil((SIM_CONSTANTS.KIDNEY_DPS - organs.kidneys.dps) / SIM_CONSTANTS.KIDNEYS_DPS_PENALTY))

  return (
    <div className="organ-status">
      <div className="organ-status__grid">
        <div className="organ-status__item">
          <span className="organ-status__icon">⚡</span>
          <span className="organ-status__name">Pancreas</span>
          <OrganTierCircles
            maxCircles={MAX_CIRCLES}
            degradedCircles={pancreasDegraded}
            activeCircles={organs.pancreas.currentTier}
          />
        </div>
        <div className="organ-status__item">
          <span className="organ-status__icon">💪</span>
          <span className="organ-status__name">Muscles</span>
          <OrganTierCircles
            maxCircles={MAX_CIRCLES}
            degradedCircles={pancreasDegraded}
            activeCircles={organs.pancreas.currentTier}
          />
        </div>
        <div className="organ-status__item">
          <span className="organ-status__icon">🫘</span>
          <span className="organ-status__name">Liver</span>
          <OrganTierCircles
            maxCircles={MAX_CIRCLES}
            degradedCircles={liverDegraded}
          />
        </div>
        <div className="organ-status__item">
          <span className="organ-status__icon">🫘</span>
          <span className="organ-status__name">Kidneys</span>
          <OrganTierCircles
            maxCircles={MAX_CIRCLES}
            degradedCircles={kidneyDegraded}
          />
        </div>
      </div>
      <div className="organ-status__stats">
        <span className="organ-status__stat">
          Active: {projectiles.length}
        </span>
        <span className={`organ-status__stat ${excessGlucose > 0 ? 'organ-status__stat--danger' : ''}`}>
          Excess: {Math.round(excessGlucose)} mg
        </span>
      </div>
    </div>
  )
}
