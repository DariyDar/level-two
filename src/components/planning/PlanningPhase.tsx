import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { MEAL_SEGMENTS } from '../../types'
import type { FoodCard } from '../../types'
import { MealSlots } from './MealSlots'
import { OfferCards } from './OfferCards'
import { Inventory } from './Inventory'
import './PlanningPhase.css'

export function PlanningPhase() {
  const {
    currentLevel,
    currentDay,
    currentSegment,
    mealSlots,
    inventory,
    offerFlow,
    placeCardInSlot,
    sendCardToInventory,
    useCardFromInventory,
    startSimulation,
  } = useGameStore()

  const [pendingPlaceCard, setPendingPlaceCard] = useState<FoodCard | null>(null)

  if (!currentLevel || !offerFlow) return null

  const segmentName = MEAL_SEGMENTS[currentSegment] ?? 'Meal'
  const totalDays = currentLevel.days.length
  const allSlotsFilled = mealSlots.every(s => s !== null)
  const hasEmptySlot = mealSlots.some(s => s === null)

  const handlePlaceCard = (card: FoodCard) => {
    // If only one empty slot, place directly
    const emptySlots = mealSlots
      .map((s, i) => (s === null ? i : -1))
      .filter(i => i !== -1)

    if (emptySlots.length === 1) {
      placeCardInSlot(card, emptySlots[0])
      setPendingPlaceCard(null)
    } else if (emptySlots.length > 1) {
      // Let player pick a slot
      setPendingPlaceCard(card)
    }
  }

  const handleSlotClick = (index: number) => {
    if (pendingPlaceCard) {
      placeCardInSlot(pendingPlaceCard, index)
      setPendingPlaceCard(null)
    }
  }

  const handleSaveCard = (card: FoodCard) => {
    sendCardToInventory(card)
    setPendingPlaceCard(null)
  }

  const handleUseFromInventory = (card: FoodCard) => {
    const emptySlots = mealSlots
      .map((s, i) => (s === null ? i : -1))
      .filter(i => i !== -1)

    if (emptySlots.length === 1) {
      useCardFromInventory(card.id, emptySlots[0])
    } else if (emptySlots.length > 1) {
      // Store card reference, let player pick slot
      // For MVP: place in first empty slot
      useCardFromInventory(card.id, emptySlots[0])
    }
  }

  return (
    <div className="planning-phase">
      <div className="planning-header">
        <span className="planning-header__segment">{segmentName}</span>
        <span className="planning-header__day">Day {currentDay + 1}/{totalDays}</span>
      </div>

      <MealSlots
        slots={mealSlots}
        onSlotClick={handleSlotClick}
        activeSlotIndex={pendingPlaceCard ? mealSlots.findIndex(s => s === null) : null}
      />

      {pendingPlaceCard && (
        <div className="planning-hint">
          Click an empty slot to place <strong>{pendingPlaceCard.name}</strong>
        </div>
      )}

      {!allSlotsFilled && (
        <OfferCards
          cards={offerFlow.currentOfferCards}
          currentOfferIndex={offerFlow.currentOfferIndex}
          totalOffers={offerFlow.allOffers.length}
          onPlaceCard={handlePlaceCard}
          onSaveCard={handleSaveCard}
        />
      )}

      {allSlotsFilled && (
        <button className="simulate-btn" onClick={startSimulation}>
          Simulate
        </button>
      )}

      <Inventory
        cards={inventory}
        onUseCard={handleUseFromInventory}
        hasEmptySlot={hasEmptySlot}
      />
    </div>
  )
}
