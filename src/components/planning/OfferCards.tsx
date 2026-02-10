import type { FoodCard } from '../../types'
import { FoodCardComponent } from './FoodCardComponent'
import './OfferCards.css'

interface OfferCardsProps {
  cards: FoodCard[]
  currentOfferIndex: number
  totalOffers: number
  onPlaceCard: (card: FoodCard) => void
  onSaveCard: (card: FoodCard) => void
}

export function OfferCards({ cards, currentOfferIndex, totalOffers, onPlaceCard, onSaveCard }: OfferCardsProps) {
  if (cards.length === 0) return null

  return (
    <div className="offer-cards">
      <div className="offer-cards__label">
        Offer {currentOfferIndex + 1}/{totalOffers}
      </div>
      <div className="offer-cards__grid">
        {cards.map(card => (
          <div key={card.id} className="offer-card-wrapper">
            <FoodCardComponent card={card} />
            <div className="offer-card-actions">
              <button
                className="offer-card-btn offer-card-btn--place"
                onClick={() => onPlaceCard(card)}
              >
                Place
              </button>
              <button
                className="offer-card-btn offer-card-btn--save"
                onClick={() => onSaveCard(card)}
              >
                Save
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
