import type { FoodCard } from '../../types'
import { SIM_CONSTANTS } from '../../types'
import './MealSummary.css'

interface MealSummaryProps {
  slots: (FoodCard | null)[]
}

const TAG_LABELS: Record<string, string> = {
  fiber: '🌾 Fiber',
  protein: '🥩 Protein',
  sweet: '🍬 Sweet',
}

interface ModifierInfo {
  emoji: string
  label: string
  effect: string
}

const MODIFIER_INFO: Record<string, ModifierInfo> = {
  fiber: {
    emoji: '🌾',
    label: 'Fiber',
    effect: `All speeds ×${SIM_CONSTANTS.FIBER_SPEED_MULTIPLIER}`,
  },
  sugar: {
    emoji: '🍬',
    label: 'Sugar',
    effect: `All speeds ×${SIM_CONSTANTS.SUGAR_SPEED_MULTIPLIER}`,
  },
  protein: {
    emoji: '🥩',
    label: 'Protein',
    effect: `Duration ×${SIM_CONSTANTS.PROTEIN_DURATION_MULTIPLIER}`,
  },
  fat: {
    emoji: '🧈',
    label: 'Fat',
    effect: `Speed ×${SIM_CONSTANTS.FAT_SPEED_MULTIPLIER}, duration ×${SIM_CONSTANTS.FAT_DURATION_MULTIPLIER}`,
  },
}

export function MealSummary({ slots }: MealSummaryProps) {
  const cards = slots.filter((s): s is FoodCard => s !== null)
  if (cards.length === 0) return null

  // Collect tags
  const tagCounts = new Map<string, number>()
  for (const card of cards) {
    tagCounts.set(card.tag, (tagCounts.get(card.tag) ?? 0) + 1)
  }

  // Collect active modifiers (meal-wide: fiber, sugar; per-card: protein, fat)
  const hasFiber = cards.some(c => c.modifiers.fiber)
  const hasSugar = cards.some(c => c.modifiers.sugar)
  const proteinCount = cards.filter(c => c.modifiers.protein).length
  const fatCount = cards.filter(c => c.modifiers.fat).length

  // Tag-based effects
  const hasProteinTag = cards.some(c => c.tag === 'protein')

  const activeModifiers: { info: ModifierInfo; count?: number }[] = []
  if (hasFiber) activeModifiers.push({ info: MODIFIER_INFO.fiber })
  if (hasSugar) activeModifiers.push({ info: MODIFIER_INFO.sugar })
  if (proteinCount > 0) activeModifiers.push({ info: MODIFIER_INFO.protein, count: proteinCount })
  if (fatCount > 0) activeModifiers.push({ info: MODIFIER_INFO.fat, count: fatCount })
  if (hasProteinTag) activeModifiers.push({ info: { emoji: '💪', label: 'MuscleBoost', effect: `Muscles ×${SIM_CONSTANTS.PROTEIN_TAG_MUSCLE_BOOST}` } })

  const totalCarbs = cards.reduce((sum, c) => sum + c.carbs, 0)

  return (
    <div className="meal-summary">
      <div className="meal-summary__tags">
        {Array.from(tagCounts.entries()).map(([tag, count]) => (
          <span key={tag} className="meal-summary__tag">
            {TAG_LABELS[tag] ?? tag}{count > 1 ? ` ×${count}` : ''}
          </span>
        ))}
        <span className="meal-summary__total">{totalCarbs}g total</span>
      </div>
      {activeModifiers.length > 0 && (
        <div className="meal-summary__modifiers">
          {activeModifiers.map(({ info, count }) => (
            <span key={info.label} className="meal-summary__modifier">
              {info.emoji} {info.effect}{count && count > 1 ? ` (×${count})` : ''}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
