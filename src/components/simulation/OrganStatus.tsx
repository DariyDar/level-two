import type { SimulationState } from '../../types'
import './OrganStatus.css'

interface OrganStatusProps {
  state: SimulationState
}

export function OrganStatus({ state }: OrganStatusProps) {
  const { organs, excessGlucose, projectiles } = state

  return (
    <div className="organ-status">
      <div className="organ-status__row">
        <div className="organ-status__item">
          <span className="organ-status__icon">⚡</span>
          <span className="organ-status__label">Pancreas</span>
          <span className="organ-status__value">T{organs.pancreas.currentTier}</span>
        </div>
        <div className="organ-status__item">
          <span className="organ-status__icon">💪</span>
          <span className="organ-status__label">Muscles</span>
          <span className="organ-status__value">{organs.muscles.dps} dps</span>
        </div>
      </div>
      <div className="organ-status__row">
        <div className="organ-status__item">
          <span className="organ-status__icon">🫘</span>
          <span className="organ-status__label">Liver</span>
          <span className="organ-status__value">{organs.liver.activeCount}/{organs.liver.capacity}</span>
        </div>
        <div className="organ-status__item">
          <span className="organ-status__icon">🫘</span>
          <span className="organ-status__label">Kidneys</span>
          <span className="organ-status__value">{organs.kidneys.dps} dps</span>
        </div>
      </div>
      <div className="organ-status__row organ-status__row--stats">
        <div className="organ-status__stat">
          <span className="organ-status__stat-label">Active</span>
          <span className="organ-status__stat-value">{projectiles.length}</span>
        </div>
        <div className="organ-status__stat">
          <span className="organ-status__stat-label">Excess</span>
          <span className={`organ-status__stat-value ${excessGlucose > 0 ? 'organ-status__stat-value--danger' : ''}`}>
            {Math.round(excessGlucose)} mg
          </span>
        </div>
      </div>
    </div>
  )
}
