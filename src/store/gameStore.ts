import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  FoodCard,
  GamePhase,
  LevelConfig,
  DegradationState,
  SegmentResult,
  OfferTemplate,
  DayAssessment,
  OfferConstraints,
} from '../types'
import { DEGRADATION_CYCLE } from '../types'
import { generateOffers } from '../core/offerAlgorithm'

// === Offer tracking state ===
interface OfferFlowState {
  allOffers: FoodCard[][]        // all 3 offers (3 cards each)
  currentOfferIndex: number      // 0, 1, 2
  currentOfferCards: FoodCard[]  // cards in the current offer not yet resolved
  offeredCardIds: string[]       // all card IDs offered this segment (for no-repeat)
}

interface GameState {
  // Navigation
  phase: GamePhase
  currentLevel: LevelConfig | null
  currentDay: number       // 0-indexed
  currentSegment: number   // 0, 1, 2

  // Planning
  mealSlots: (FoodCard | null)[]  // [slot0, slot1, slot2]
  inventory: FoodCard[]
  offerFlow: OfferFlowState | null
  allFoods: FoodCard[]     // all available food cards (loaded from JSON)

  // Results
  lastSegmentResult: SegmentResult | null

  // Persistent across segments/days
  degradation: DegradationState

  // Actions
  initLevel: (level: LevelConfig, foods: FoodCard[]) => void
  startSegmentPlanning: () => void
  placeCardInSlot: (card: FoodCard, slotIndex: number) => void
  sendCardToInventory: (card: FoodCard) => void
  useCardFromInventory: (cardId: string, slotIndex: number) => void
  startSimulation: () => void
  completeSimulation: (excessGlucose: number) => void
  nextSegment: () => void
  retrySegment: () => void
  resetLevel: () => void
}

function computeAssessment(newCircles: number): DayAssessment {
  if (newCircles === 0) return 'Excellent'
  if (newCircles === 1) return 'Decent'
  if (newCircles <= 3) return 'Poor'
  return 'Defeat'
}

function computeDegradationCircles(
  excessGlucose: number,
  thresholds: number[],
): number {
  let circles = 0
  for (const threshold of thresholds) {
    if (excessGlucose >= threshold) circles++
  }
  return circles
}

function applyDegradation(
  current: DegradationState,
  newCircles: number,
): DegradationState {
  const result = { ...current }
  for (let i = 0; i < newCircles; i++) {
    const targetIndex = result.totalCircles % DEGRADATION_CYCLE.length
    const target = DEGRADATION_CYCLE[targetIndex]
    result.totalCircles++
    if (target === 'liver') result.liverCircles++
    else if (target === 'pancreas') result.pancreasCircles++
    else result.kidneysCircles++
  }
  return result
}

function advanceOffer(offerFlow: OfferFlowState): OfferFlowState {
  const nextIndex = offerFlow.currentOfferIndex + 1
  if (nextIndex < offerFlow.allOffers.length) {
    const nextOffer = offerFlow.allOffers[nextIndex]
    return {
      ...offerFlow,
      currentOfferIndex: nextIndex,
      currentOfferCards: [...nextOffer],
      offeredCardIds: [...offerFlow.offeredCardIds, ...nextOffer.map(c => c.id)],
    }
  }
  // All offers exhausted
  return {
    ...offerFlow,
    currentOfferIndex: nextIndex,
    currentOfferCards: [],
  }
}

const INITIAL_DEGRADATION: DegradationState = {
  totalCircles: 0,
  liverCircles: 0,
  pancreasCircles: 0,
  kidneysCircles: 0,
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      phase: 'Planning',
      currentLevel: null,
      currentDay: 0,
      currentSegment: 0,
      mealSlots: [null, null, null],
      inventory: [],
      offerFlow: null,
      allFoods: [],
      lastSegmentResult: null,
      degradation: { ...INITIAL_DEGRADATION },

      initLevel: (level, foods) => {
        const initialInventory = level.initialInventory
          .map(id => foods.find(f => f.id === id))
          .filter((f): f is FoodCard => f !== undefined)

        // Add 1 random food card to starting inventory
        if (foods.length > 0) {
          const randomCard = foods[Math.floor(Math.random() * foods.length)]
          initialInventory.push(randomCard)
        }

        set({
          currentLevel: level,
          currentDay: 0,
          currentSegment: 0,
          allFoods: foods,
          inventory: initialInventory,
          degradation: { ...INITIAL_DEGRADATION },
          phase: 'Planning',
          lastSegmentResult: null,
        })
        // Start planning for first segment
        get().startSegmentPlanning()
      },

      startSegmentPlanning: () => {
        const { currentLevel, currentDay, currentSegment, allFoods } = get()
        if (!currentLevel) return

        const dayConfig = currentLevel.days[currentDay]
        if (!dayConfig) return
        const segmentConfig = dayConfig.segments[currentSegment]
        if (!segmentConfig) return

        const templates: OfferTemplate[] = segmentConfig.offerTemplates
        const constraints: OfferConstraints = {
          noRepeatCardIds: [],
          maxSameTag: 3,
        }

        const allOffers = generateOffers(templates, allFoods, constraints)
        const firstOffer = allOffers[0] || []

        // Pre-place a random Fast/VeryFast food in slot 0
        const fastFoods = allFoods.filter(f => f.glucoseSpeed >= 3)
        const preplacedCard = fastFoods.length > 0
          ? fastFoods[Math.floor(Math.random() * fastFoods.length)]
          : null

        set({
          mealSlots: [preplacedCard, null, null],
          offerFlow: {
            allOffers,
            currentOfferIndex: 0,
            currentOfferCards: [...firstOffer],
            offeredCardIds: firstOffer.map(c => c.id),
          },
          phase: 'Planning',
        })
      },

      placeCardInSlot: (card, slotIndex) => {
        const { mealSlots, offerFlow } = get()
        if (!offerFlow) return
        if (mealSlots[slotIndex] !== null) return

        const newSlots = [...mealSlots]
        newSlots[slotIndex] = card

        // Remaining offer cards are discarded
        set({ mealSlots: newSlots, offerFlow: advanceOffer(offerFlow) })
      },

      sendCardToInventory: (card) => {
        const { inventory, offerFlow } = get()
        if (!offerFlow) return

        // Only the chosen card goes to inventory; rest are discarded
        const newInventory = [...inventory, card]

        set({ inventory: newInventory, offerFlow: advanceOffer(offerFlow) })
      },

      useCardFromInventory: (cardId, slotIndex) => {
        const { mealSlots, inventory } = get()
        if (mealSlots[slotIndex] !== null) return

        const cardIndex = inventory.findIndex(c => c.id === cardId)
        if (cardIndex === -1) return

        const card = inventory[cardIndex]
        const newInventory = [...inventory]
        newInventory.splice(cardIndex, 1)

        const newSlots = [...mealSlots]
        newSlots[slotIndex] = card

        set({ mealSlots: newSlots, inventory: newInventory })
      },

      startSimulation: () => {
        const { mealSlots } = get()
        if (mealSlots.some(s => s === null)) return
        set({ phase: 'Simulation' })
      },

      completeSimulation: (excessGlucose) => {
        const { currentLevel, degradation } = get()
        if (!currentLevel) return

        const newCircles = computeDegradationCircles(
          excessGlucose,
          currentLevel.degradationThresholds,
        )
        const newDegradation = applyDegradation(degradation, newCircles)
        const isDefeat = excessGlucose >= currentLevel.defeatThreshold

        const assessment = isDefeat ? 'Defeat' as const : computeAssessment(newCircles)

        set({
          phase: 'Results',
          degradation: newDegradation,
          lastSegmentResult: {
            excessGlucose,
            newDegradationCircles: newCircles,
            assessment,
          },
        })
      },

      nextSegment: () => {
        const { currentLevel, currentDay, currentSegment } = get()
        if (!currentLevel) return

        const dayConfig = currentLevel.days[currentDay]
        if (!dayConfig) return

        if (currentSegment + 1 < dayConfig.segments.length) {
          // Next segment in same day
          set({ currentSegment: currentSegment + 1, lastSegmentResult: null })
          get().startSegmentPlanning()
        } else if (currentDay + 1 < currentLevel.days.length) {
          // Next day
          set({ currentDay: currentDay + 1, currentSegment: 0, lastSegmentResult: null })
          get().startSegmentPlanning()
        }
        // else: level complete (handled in UI)
      },

      retrySegment: () => {
        get().startSegmentPlanning()
      },

      resetLevel: () => {
        const { currentLevel, allFoods } = get()
        if (!currentLevel || allFoods.length === 0) return
        get().initLevel(currentLevel, allFoods)
      },
    }),
    {
      name: 'glucose-td-save',
      version: 1,
      partialize: (state) => ({
        inventory: state.inventory,
        degradation: state.degradation,
      }),
    },
  ),
)
