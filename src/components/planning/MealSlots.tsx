import type { FoodCard } from '../../types'
import { FoodCardComponent } from './FoodCardComponent'
import './MealSlots.css'

interface MealSlotsProps {
  slots: (FoodCard | null)[]
  onSlotClick: (index: number) => void
  activeSlotIndex: number | null
}

export function MealSlots({ slots, onSlotClick, activeSlotIndex }: MealSlotsProps) {
  return (
    <div className="meal-slots">
      <div className="meal-slots__label">Meal</div>
      <div className="meal-slots__grid">
        {slots.map((card, i) => (
          <div
            key={i}
            className={`meal-slot ${!card ? 'meal-slot--empty' : ''} ${activeSlotIndex === i ? 'meal-slot--active' : ''}`}
            onClick={() => !card && onSlotClick(i)}
          >
            {card ? (
              <FoodCardComponent card={card} size="small" />
            ) : (
              <div className="meal-slot__placeholder">
                Slot {i + 1}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
