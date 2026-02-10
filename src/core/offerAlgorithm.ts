import type { FoodCard, OfferTemplate, OfferConstraints } from '../types'

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function pickCardForTier(
  tier: number,
  allFoods: FoodCard[],
  usedIds: Set<string>,
  tagCounts: Map<string, number>,
  maxSameTag: number,
): FoodCard | null {
  const candidates = allFoods.filter(f => {
    if (f.tier !== tier) return false
    if (usedIds.has(f.id)) return false
    const currentTagCount = tagCounts.get(f.tag) ?? 0
    if (currentTagCount >= maxSameTag) return false
    return true
  })

  if (candidates.length === 0) {
    // Fallback: ignore tag constraint
    const fallback = allFoods.filter(f => f.tier === tier && !usedIds.has(f.id))
    if (fallback.length === 0) {
      // Fallback: any unused card
      const anyCard = allFoods.filter(f => !usedIds.has(f.id))
      if (anyCard.length === 0) return null
      return anyCard[Math.floor(Math.random() * anyCard.length)]
    }
    return fallback[Math.floor(Math.random() * fallback.length)]
  }

  // Weighted random (equal weights for MVP)
  const shuffled = shuffleArray(candidates)
  return shuffled[0]
}

export function generateOffer(
  template: OfferTemplate,
  allFoods: FoodCard[],
  usedIds: Set<string>,
  tagCounts: Map<string, number>,
  maxSameTag: number,
): FoodCard[] {
  const result: FoodCard[] = []

  for (const tier of template) {
    const card = pickCardForTier(tier, allFoods, usedIds, tagCounts, maxSameTag)
    if (card) {
      result.push(card)
      usedIds.add(card.id)
      tagCounts.set(card.tag, (tagCounts.get(card.tag) ?? 0) + 1)
    }
  }

  return result
}

export function generateOffers(
  templates: OfferTemplate[],
  allFoods: FoodCard[],
  constraints: OfferConstraints,
): FoodCard[][] {
  const usedIds = new Set<string>(constraints.noRepeatCardIds ?? [])
  const tagCounts = new Map<string, number>()
  const maxSameTag = constraints.maxSameTag ?? 3

  const offers: FoodCard[][] = []

  for (const template of templates) {
    const offer = generateOffer(template, allFoods, usedIds, tagCounts, maxSameTag)
    offers.push(offer)
  }

  return offers
}
