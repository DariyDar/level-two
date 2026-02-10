import type { FoodCard } from '../../types'
import { FoodCardComponent } from './FoodCardComponent'
import './Inventory.css'

interface InventoryProps {
  cards: FoodCard[]
  onUseCard: (card: FoodCard) => void
  hasEmptySlot: boolean
}

export function Inventory({ cards, onUseCard, hasEmptySlot }: InventoryProps) {
  return (
    <div className="inventory">
      <div className="inventory__label">
        Inventory ({cards.length})
      </div>
      {cards.length === 0 ? (
        <div className="inventory__empty">Empty</div>
      ) : (
        <div className="inventory__grid">
          {cards.map((card, i) => (
            <FoodCardComponent
              key={`${card.id}-${i}`}
              card={card}
              size="small"
              onClick={() => hasEmptySlot && onUseCard(card)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
