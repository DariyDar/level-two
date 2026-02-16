import type { LevelConfig, AvailableFood, PreOccupiedSlot, SegmentCarbLimits, DaySegment, Match3DayConfig } from '../types';

export interface DayConfigResult {
  availableFoods: AvailableFood[];
  availableInterventions: AvailableFood[];
  carbRequirements?: { min: number; max: number };
  segmentCarbs?: Record<DaySegment, SegmentCarbLimits>;
  preOccupiedSlots: PreOccupiedSlot[];
  blockedSlots: number[];
  moveBudget?: number;
  match3Config?: Match3DayConfig;
  pancreasBoostCharges: number;
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
        availableInterventions: dayConfig.availableInterventions,
        carbRequirements: dayConfig.carbRequirements,
        segmentCarbs: dayConfig.segmentCarbs as Record<DaySegment, SegmentCarbLimits> | undefined,
        preOccupiedSlots: dayConfig.preOccupiedSlots || level.preOccupiedSlots || [],
        blockedSlots: dayConfig.blockedSlots || [],
        moveBudget: dayConfig.moveBudget,
        match3Config: dayConfig.match3Config,
        pancreasBoostCharges: dayConfig.pancreasBoostCharges ?? level.interventionCharges.pancreasBoost,
      };
    }
  }

  // Fall back to legacy fields
  return {
    availableFoods: level.availableFoods || [],
    availableInterventions: level.availableInterventions || [],
    carbRequirements: level.carbRequirements || { min: 0, max: 999 },
    preOccupiedSlots: level.preOccupiedSlots || [],
    blockedSlots: [],
    pancreasBoostCharges: level.interventionCharges.pancreasBoost,
  };
}
