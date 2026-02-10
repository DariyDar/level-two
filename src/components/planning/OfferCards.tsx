import { AnimatePresence, motion } from 'framer-motion'
import type { FoodCard } from '../../types'
import { FoodCardComponent } from './FoodCardComponent'
import './OfferCards.css'

interface OfferCardsProps {
  cards: FoodCard[]
  currentOfferIndex: number
  totalOffers: number
}

export function OfferCards({ cards, currentOfferIndex, totalOffers }: OfferCardsProps) {
  return (
    <div className="offer-cards">
      <div className="offer-cards__label">
        Offer {currentOfferIndex + 1}/{totalOffers}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={`offer-${currentOfferIndex}-${cards.length}`}
          className="offer-cards__grid"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2 }}
        >
          {cards.map((card, i) => (
            <FoodCardComponent
              key={card.id}
              card={card}
              dragId={`offer-${card.id}-${i}`}
            />
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
