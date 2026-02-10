import { useDroppable } from '@dnd-kit/core'
import type { FoodCard } from '../../types'
import { FoodCardComponent } from './FoodCardComponent'
import './Inventory.css'

interface InventoryProps {
  cards: FoodCard[]
  hasEmptySlot: boolean
}

export function Inventory({ cards, hasEmptySlot }: InventoryProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: 'inventory',
    data: { type: 'inventory' },
  })

  return (
    <div
      ref={setNodeRef}
      className={`inventory ${isOver ? 'inventory--over' : ''}`}
    >
      <div className="inventory__label">
        Inventory ({cards.length})
      </div>
      {cards.length === 0 && !isOver ? (
        <div className="inventory__empty">Drag cards here to save for later</div>
      ) : (
        <div className="inventory__grid">
          {cards.map((card, i) => (
            <FoodCardComponent
              key={`inv-${card.id}-${i}`}
              card={card}
              size="small"
              dragId={hasEmptySlot ? `inv-${card.id}-${i}` : undefined}
            />
          ))}
        </div>
      )}
    </div>
  )
}
