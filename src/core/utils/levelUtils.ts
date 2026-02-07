import type { LevelConfig, AvailableFood, PreOccupiedSlot, SegmentCarbLimits, DaySegment } from '../types';

export interface DayConfigResult {
  availableFoods: AvailableFood[];
  carbRequirements?: { min: number; max: number };
  segmentCarbs?: Record<DaySegment, SegmentCarbLimits>;
  preOccupiedSlots: PreOccupiedSlot[];
  blockedSlots: number[];
  wpBudget?: number;
}

/**
 * Get configuration for a specific day
 * If dayConfigs exists, use it; otherwise fall back to legacy fields
 */
export function getDayConfig(level: LevelConfig, day: number): DayConfigResult {
  // Try to find day-specific config
  if (level.dayConfigs && level.dayConfigs.length > 0) {
    const dayConfig = level.dayConfigs.find((dc) => dc.day === day);
    if (dayConfig) {
      return {
        availableFoods: dayConfig.availableFoods,
        carbRequirements: dayConfig.carbRequirements,
        segmentCarbs: dayConfig.segmentCarbs as Record<DaySegment, SegmentCarbLimits> | undefined,
        preOccupiedSlots: dayConfig.preOccupiedSlots || level.preOccupiedSlots || [],
        blockedSlots: dayConfig.blockedSlots || [],
        wpBudget: dayConfig.wpBudget,
      };
    }
  }

  // Fall back to legacy fields
  return {
    availableFoods: level.availableFoods || [],
    carbRequirements: level.carbRequirements || { min: 0, max: 999 },
    preOccupiedSlots: level.preOccupiedSlots || [],
    blockedSlots: [],
  };
}
