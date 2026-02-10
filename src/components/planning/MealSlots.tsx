import { useDroppable } from '@dnd-kit/core'
import type { FoodCard } from '../../types'
import { FoodCardComponent } from './FoodCardComponent'
import './MealSlots.css'

interface MealSlotsProps {
  slots: (FoodCard | null)[]
}

function MealSlot({ card, index }: { card: FoodCard | null; index: number }) {
  const { isOver, setNodeRef } = useDroppable({
    id: `slot-${index}`,
    data: { type: 'slot', index },
    disabled: card !== null,
  })

  return (
    <div
      ref={setNodeRef}
      className={`meal-slot ${!card ? 'meal-slot--empty' : ''} ${isOver && !card ? 'meal-slot--over' : ''}`}
    >
      {card ? (
        <FoodCardComponent card={card} size="small" />
      ) : (
        <div className="meal-slot__placeholder">
          Slot {index + 1}
        </div>
      )}
    </div>
  )
}

export function MealSlots({ slots }: MealSlotsProps) {
  return (
    <div className="meal-slots">
      <div className="meal-slots__label">Meal</div>
      <div className="meal-slots__grid">
        {slots.map((card, i) => (
          <MealSlot key={i} card={card} index={i} />
        ))}
      </div>
    </div>
  )
}
