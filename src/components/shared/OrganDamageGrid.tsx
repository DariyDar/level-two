import type { DegradationState } from '../../types'
import { OrganTierCircles } from '../planning/OrganTierCircles'
import './OrganDamageGrid.css'

interface OrganDamageGridProps {
  degradation: DegradationState
  title?: string
}

const MAX_CIRCLES = 4

export function OrganDamageGrid({ degradation, title }: OrganDamageGridProps) {
  return (
    <div className="organ-damage">
      {title && <div className="organ-damage__title">{title}</div>}
      <div className="organ-damage__grid">
        <div className="organ-damage__item">
          <span className="organ-damage__icon">⚡</span>
          <span className="organ-damage__name">Pancreas</span>
          <OrganTierCircles maxCircles={MAX_CIRCLES} degradedCircles={degradation.pancreasCircles} />
        </div>
        <div className="organ-damage__item">
          <span className="organ-damage__icon">💪</span>
          <span className="organ-damage__name">Muscles</span>
          <OrganTierCircles maxCircles={MAX_CIRCLES} degradedCircles={0} />
        </div>
        <div className="organ-damage__item">
          <span className="organ-damage__icon">🫘</span>
          <span className="organ-damage__name">Liver</span>
          <OrganTierCircles maxCircles={MAX_CIRCLES} degradedCircles={degradation.liverCircles} />
        </div>
        <div className="organ-damage__item">
          <span className="organ-damage__icon">🫘</span>
          <span className="organ-damage__name">Kidneys</span>
          <OrganTierCircles maxCircles={MAX_CIRCLES} degradedCircles={degradation.kidneysCircles} />
        </div>
      </div>
    </div>
  )
}
