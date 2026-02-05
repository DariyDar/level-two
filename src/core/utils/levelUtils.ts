import type { LevelConfig, AvailableFood, PreOccupiedSlot } from '../types';

/**
 * Get configuration for a specific day
 * If dayConfigs exists, use it; otherwise fall back to legacy fields
 */
export function getDayConfig(level: LevelConfig, day: number): {
  availableFoods: AvailableFood[];
  carbRequirements: { min: number; max: number };
  preOccupiedSlots: PreOccupiedSlot[];
} {
  // Try to find day-specific config
  if (level.dayConfigs && level.dayConfigs.length > 0) {
    const dayConfig = level.dayConfigs.find((dc) => dc.day === day);
    if (dayConfig) {
      return {
        availableFoods: dayConfig.availableFoods,
        carbRequirements: dayConfig.carbRequirements,
        preOccupiedSlots: dayConfig.preOccupiedSlots || level.preOccupiedSlots || [],
      };
    }
  }

  // Fall back to legacy fields
  return {
    availableFoods: level.availableFoods || [],
    carbRequirements: level.carbRequirements || { min: 0, max: 999 },
    preOccupiedSlots: level.preOccupiedSlots || [],
  };
}
