import { useDraggable } from '@dnd-kit/core'
import type { FoodCard } from '../../types'
import { SPEED_LABELS } from '../../types'
import './FoodCardComponent.css'

interface FoodCardComponentProps {
  card: FoodCard
  dragId?: string
  size?: 'normal' | 'small'
  isDragOverlay?: boolean
}

const TIER_COLORS: Record<number, string> = {
  1: '#22c55e',
  2: '#eab308',
  3: '#ef4444',
}

export function FoodCardComponent({ card, dragId, size = 'normal', isDragOverlay = false }: FoodCardComponentProps) {
  const tierColor = TIER_COLORS[card.tier] ?? '#666'
  const speedLabel = SPEED_LABELS[card.glucoseSpeed] ?? 'Unknown'

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: dragId ?? `static-${card.id}`,
    data: { card },
    disabled: !dragId,
  })

  return (
    <div
      ref={dragId ? setNodeRef : undefined}
      className={`food-card food-card--${size} ${isDragging && !isDragOverlay ? 'food-card--dragging' : ''} ${isDragOverlay ? 'food-card--overlay' : ''}`}
      style={{ borderColor: tierColor }}
      {...(dragId ? { ...listeners, ...attributes } : {})}
    >
      <div className="food-card__carbs-badge">{card.carbs}g</div>
      <div className="food-card__emoji">{card.emoji}</div>
      <div className="food-card__name">{card.name}</div>
      <span className={`food-card__speed food-card__speed--${card.glucoseSpeed}`}>
        {speedLabel}
      </span>
      <div className="food-card__modifiers">
        {card.modifiers.fiber && <span className="food-card__mod" title="Fiber: slows all food">🌾</span>}
        {card.modifiers.protein && <span className="food-card__mod" title="Protein: extends release">🥩</span>}
        {card.modifiers.fat && <span className="food-card__mod" title="Fat: slows & extends">🧈</span>}
        {card.modifiers.sugar && <span className="food-card__mod" title="Sugar: speeds up all food">🍬</span>}
      </div>
    </div>
  )
}
