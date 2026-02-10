import type { FoodCard } from '../../types'
import { SPEED_LABELS } from '../../types'
import './FoodCardComponent.css'

interface FoodCardComponentProps {
  card: FoodCard
  onClick?: () => void
  size?: 'normal' | 'small'
  selected?: boolean
}

const TIER_COLORS: Record<number, string> = {
  1: '#22c55e', // green - healthy
  2: '#eab308', // yellow - neutral
  3: '#ef4444', // red - junk
}

export function FoodCardComponent({ card, onClick, size = 'normal', selected = false }: FoodCardComponentProps) {
  const tierColor = TIER_COLORS[card.tier] ?? '#666'
  const speedLabel = SPEED_LABELS[card.glucoseSpeed] ?? 'Unknown'

  return (
    <div
      className={`food-card food-card--${size} ${selected ? 'food-card--selected' : ''}`}
      style={{ borderColor: tierColor }}
      onClick={onClick}
    >
      <div className="food-card__emoji">{card.emoji}</div>
      <div className="food-card__name">{card.name}</div>
      <div className="food-card__stats">
        <span className="food-card__carbs">{card.carbs}g carbs</span>
        <span className={`food-card__speed food-card__speed--${card.glucoseSpeed}`}>
          {speedLabel}
        </span>
      </div>
      <div className="food-card__modifiers">
        {card.modifiers.fiber && <span className="food-card__mod" title="Fiber: slows all food">🌾</span>}
        {card.modifiers.protein && <span className="food-card__mod" title="Protein: extends release">🥩</span>}
        {card.modifiers.fat && <span className="food-card__mod" title="Fat: slows & extends">🧈</span>}
        {card.modifiers.sugar && <span className="food-card__mod" title="Sugar: speeds up all food">🍬</span>}
      </div>
    </div>
  )
}
