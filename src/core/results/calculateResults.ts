import type { DayMetrics, DayResults, SimpleDegradation } from '../types';

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

export function calculateDayResults(
  day: number,
  bgHistory: number[],
  config: Partial<ResultsConfig> = {}
): DayResults {
  const metrics = calculateMetrics(bgHistory, config);
  const degradation = calculateDegradation(bgHistory, config);
  const rank = calculateRank(metrics);
  const message = getRankMessage(rank);

  return {
    day,
    bgHistory,
    metrics,
    degradation,
    rank,
    message,
  };
}
