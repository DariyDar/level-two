import type { LevelConfig, AvailableFood, PreOccupiedSlot, BlockedSlotConfig } from '../types';

export interface DayConfigResult {
  availableInterventions: AvailableFood[];
  preOccupiedSlots: PreOccupiedSlot[];
  blockedSlots: BlockedSlotConfig[];
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
        availableInterventions: dayConfig.availableInterventions,
        preOccupiedSlots: dayConfig.preOccupiedSlots || level.preOccupiedSlots || [],
        blockedSlots: dayConfig.blockedSlots || [],
        pancreasBoostCharges: dayConfig.pancreasBoostCharges ?? level.interventionCharges.pancreasBoost,
      };
    }
  }

  // Fall back to legacy fields
  return {
    availableInterventions: level.availableInterventions || [],
    preOccupiedSlots: level.preOccupiedSlots || [],
    blockedSlots: [],
    pancreasBoostCharges: level.interventionCharges.pancreasBoost,
  };
}
