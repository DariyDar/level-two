import type { DayMetrics, DayResults, SimpleDegradation, DegradationBuffer } from '../types';

interface ResultsConfig {
  bgLow: number;
  bgTarget: number;
  bgHigh: number;
  bgCritical: number;
  baseMultiplier: number;
  criticalMultiplier: number;
  maxDailyPoints: number;
  distribution: {
    liver: number;
    pancreas: number;
  };
}

const DEFAULT_CONFIG: ResultsConfig = {
  bgLow: 70,
  bgTarget: 100,
  bgHigh: 200,
  bgCritical: 300,
  baseMultiplier: 0.1,
  criticalMultiplier: 0.3,
  maxDailyPoints: 30,
  distribution: {
    liver: 0.5,
    pancreas: 0.5,
  },
};

export function calculateMetrics(
  bgHistory: number[],
  config: Partial<ResultsConfig> = {}
): DayMetrics {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const { bgLow, bgHigh, bgCritical } = cfg;

  if (bgHistory.length === 0) {
    return {
      averageBG: 0,
      minBG: 0,
      maxBG: 0,
      timeInRange: 0,
      timeAboveHigh: 0,
      timeAboveCritical: 0,
      timeBelowLow: 0,
      excessBG: 0,
    };
  }

  // Basic stats
  const sum = bgHistory.reduce((a, b) => a + b, 0);
  const averageBG = sum / bgHistory.length;
  const minBG = Math.min(...bgHistory);
  const maxBG = Math.max(...bgHistory);

  // Time in zones (as percentage of total time)
  let inRange = 0;
  let aboveHigh = 0;
  let aboveCritical = 0;
  let belowLow = 0;
  let excessBG = 0;

  for (const bg of bgHistory) {
    if (bg < bgLow) {
      belowLow++;
    } else if (bg >= bgLow && bg <= bgHigh) {
      inRange++;
    }

    if (bg > bgHigh) {
      aboveHigh++;
      excessBG += bg - bgHigh;
    }

    if (bg > bgCritical) {
      aboveCritical++;
    }
  }

  const total = bgHistory.length;

  return {
    averageBG: Math.round(averageBG),
    minBG: Math.round(minBG),
    maxBG: Math.round(maxBG),
    timeInRange: Math.round((inRange / total) * 100),
    timeAboveHigh: Math.round((aboveHigh / total) * 100),
    timeAboveCritical: Math.round((aboveCritical / total) * 100),
    timeBelowLow: Math.round((belowLow / total) * 100),
    excessBG: Math.round(excessBG),
  };
}

export function calculateDegradation(
  bgHistory: number[],
  config: Partial<ResultsConfig> = {}
): SimpleDegradation {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const {
    bgHigh,
    bgCritical,
    baseMultiplier,
    criticalMultiplier,
    maxDailyPoints,
    distribution,
  } = cfg;

  let totalPoints = 0;

  for (const bg of bgHistory) {
    if (bg > bgCritical) {
      // Critical: high damage
      totalPoints += (bg - bgCritical) * criticalMultiplier;
    } else if (bg > bgHigh) {
      // High: base damage
      totalPoints += (bg - bgHigh) * baseMultiplier;
    }
  }

  // Cap daily damage
  totalPoints = Math.min(totalPoints, maxDailyPoints);

  // Distribute between organs
  return {
    liver: Math.round(totalPoints * distribution.liver),
    pancreas: Math.round(totalPoints * distribution.pancreas),
  };
}

export function calculateRank(metrics: DayMetrics): 1 | 2 | 3 | 4 | 5 {
  const { timeInRange, timeBelowLow, timeAboveCritical } = metrics;

  // Penalties
  if (timeBelowLow > 20 || timeAboveCritical > 30) {
    return 1; // Poor - dangerous levels
  }

  if (timeBelowLow > 10 || timeAboveCritical > 20) {
    return 2; // Below average
  }

  // Based on time in range
  if (timeInRange >= 80) {
    return 5; // Excellent
  }

  if (timeInRange >= 60) {
    return 4; // Good
  }

  if (timeInRange >= 40) {
    return 3; // Average
  }

  return 2; // Below average
}

export function getRankMessage(rank: 1 | 2 | 3 | 4 | 5): string {
  const messages: Record<number, string> = {
    1: 'Dangerous glucose levels! Review your meal plan.',
    2: 'Room for improvement. Try balancing your meals.',
    3: 'Decent day. Keep working on consistency.',
    4: 'Good job! Your planning is paying off.',
    5: 'Excellent! Perfect glucose management!',
  };
  return messages[rank];
}

/**
 * Calculate Degradation Buffer from excess BG
 * @param excessBG - Total excess BG over threshold (200)
 * @param thresholdPerCircle - How much excessBG needed for one circle (default: 100)
 * @param maxCircles - Maximum number of circles (default: 5)
 * @returns Number of activated circles (0-5)
 */
export function calculateDegradationBuffer(
  excessBG: number,
  thresholdPerCircle: number = 100,
  maxCircles: number = 5
): number {
  const circles = Math.floor(excessBG / thresholdPerCircle);
  return Math.min(circles, maxCircles);
}

/**
 * Distribute degradation circles to organs based on order
 * @param circles - Total number of circles to distribute
 * @param order - Distribution order (e.g., ['liver', 'pancreas'])
 * @returns Distribution object with circles per organ
 */
export function distributeDegradationCircles(
  circles: number,
  order: ('liver' | 'pancreas')[] = ['liver', 'pancreas']
): { liver: number; pancreas: number } {
  const distribution = { liver: 0, pancreas: 0 };

  for (let i = 0; i < circles; i++) {
    const organ = order[i % order.length];
    distribution[organ]++;
  }

  return distribution;
}

/**
 * Convert degradation circles to points
 * Each circle represents +1 tier increment for the organ
 * @param distribution - Number of circles assigned to each organ
 * @returns Points to add to each organ's degradation
 */
export function convertCirclesToPoints(distribution: {
  liver: number;
  pancreas: number;
}): SimpleDegradation {
  // Points per tier increment (based on tier threshold ranges in degradationConfig.json)
  const LIVER_POINTS_PER_TIER = 20; // Tier thresholds: 0-19, 20-39, 40-59, etc.
  const PANCREAS_POINTS_PER_TIER = 25; // Tier thresholds: 0-24, 25-49, 50-74, etc.

  return {
    liver: distribution.liver * LIVER_POINTS_PER_TIER,
    pancreas: distribution.pancreas * PANCREAS_POINTS_PER_TIER,
  };
}

export function calculateDayResults(
  day: number,
  bgHistory: number[],
  config: Partial<ResultsConfig> = {}
): DayResults {
  const metrics = calculateMetrics(bgHistory, config);
  const rank = calculateRank(metrics);
  const message = getRankMessage(rank);

  // New Degradation Buffer system - replaces old calculateDegradation()
  const totalCircles = calculateDegradationBuffer(metrics.excessBG);
  const distribution = distributeDegradationCircles(totalCircles);
  const degradation = convertCirclesToPoints(distribution);

  const degradationBuffer: DegradationBuffer = {
    totalCircles,
    distribution,
  };

  return {
    day,
    bgHistory,
    metrics,
    degradation,
    degradationBuffer,
    rank,
    message,
  };
}
