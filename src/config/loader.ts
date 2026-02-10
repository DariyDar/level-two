import type { FoodCard, LevelConfig } from '../types'

let cachedFoods: FoodCard[] | null = null

export async function loadFoods(): Promise<FoodCard[]> {
  if (cachedFoods) return cachedFoods
  const response = await fetch('/data/foods.json')
  const data: FoodCard[] = await response.json()
  cachedFoods = data
  return data
}

export async function loadLevel(levelId: string): Promise<LevelConfig> {
  const response = await fetch(`/data/levels/${levelId}.json`)
  const data: LevelConfig = await response.json()
  return data
}

export function clearCache(): void {
  cachedFoods = null
}
