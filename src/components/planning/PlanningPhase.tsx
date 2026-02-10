import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { useGameStore } from '../../store/gameStore'
import type { FoodCard } from '../../types'
import { MealSlots } from './MealSlots'
import { OfferCards } from './OfferCards'
import { Inventory } from './Inventory'
import { MealSummary } from './MealSummary'
import { VersusBar } from './VersusBar'
import { OrganDamageGrid } from '../shared/OrganDamageGrid'
import { FoodCardComponent } from './FoodCardComponent'
import './PlanningPhase.css'

export function PlanningPhase() {
  const {
    currentLevel,
    segmentCount,
    mealSlots,
    inventory,
    offerFlow,
    degradation,
    placeCardInSlot,
    sendCardToInventory,
    useCardFromInventory,
    startSimulation,
  } = useGameStore()

  const [activeCard, setActiveCard] = useState<FoodCard | null>(null)
  const [dragSource, setDragSource] = useState<'offer' | 'inventory' | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 5 } }),
  )

  if (!currentLevel || !offerFlow) return null

  const allSlotsFilled = mealSlots.every(s => s !== null)
  const hasEmptySlot = mealSlots.some(s => s === null)

  function handleDragStart(event: DragStartEvent) {
    const card = event.active.data.current?.card as FoodCard | undefined
    if (!card) return
    setActiveCard(card)

    const id = String(event.active.id)
    setDragSource(id.startsWith('inv-') ? 'inventory' : 'offer')
  }

  function handleDragEnd(event: DragEndEvent) {
    const { over } = event
    const card = activeCard
    const source = dragSource

    setActiveCard(null)
    setDragSource(null)

    if (!card || !over) return

    const overData = over.data.current as { type: string; index?: number } | undefined
    if (!overData) return

    if (overData.type === 'slot' && typeof overData.index === 'number') {
      if (mealSlots[overData.index] !== null) return

      if (source === 'offer') {
        placeCardInSlot(card, overData.index)
      } else if (source === 'inventory') {
        useCardFromInventory(card.id, overData.index)
      }
    } else if (overData.type === 'inventory' && source === 'offer') {
      sendCardToInventory(card)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="planning-phase">
        <div className="planning-header">
          <span className="planning-header__segment">Meal {segmentCount}</span>
        </div>

        <MealSlots slots={mealSlots} />
        <VersusBar degradation={degradation} slots={mealSlots} />
        <MealSummary slots={mealSlots} />

        {!allSlotsFilled && offerFlow.currentOfferCards.length > 0 && (
          <OfferCards
            cards={offerFlow.currentOfferCards}
            currentOfferIndex={offerFlow.currentOfferIndex}
            totalOffers={offerFlow.allOffers.length}
          />
        )}

        {allSlotsFilled && (
          <button className="simulate-btn" onClick={startSimulation}>
            Simulate
          </button>
        )}

        <Inventory
          cards={inventory}
          hasEmptySlot={hasEmptySlot}
        />

        <OrganDamageGrid degradation={degradation} />
      </div>

      <DragOverlay dropAnimation={null}>
        {activeCard && (
          <FoodCardComponent card={activeCard} isDragOverlay />
        )}
      </DragOverlay>
    </DndContext>
  )
}
