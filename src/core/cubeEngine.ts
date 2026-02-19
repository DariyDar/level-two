import type { PlacedFood, Ship } from './types';
import { GRAPH_CONFIG, TOTAL_COLUMNS } from './types';

export interface CubeColumn {
  columnOffset: number; // offset from drop column (0, 1, 2, ...)
  cubeCount: number;    // number of 20 mg/dL cubes in this column
}

export interface FoodPyramid {
  placementId: string;
  shipId: string;
  dropColumn: number;
  columns: CubeColumn[];
}

/**
 * Calculate pyramid distribution of cubes for a food item.
 * Cubes are distributed in a bell/pyramid shape across the duration columns.
 * Peak is slightly left-of-center (food absorption peaks early).
 */
export function calculatePyramid(glucose: number, durationMinutes: number): CubeColumn[] {
  const totalCubes = Math.round(glucose / GRAPH_CONFIG.cellHeightMgDl);
  const columnCount = Math.max(1, Math.round(durationMinutes / GRAPH_CONFIG.cellWidthMin));

  if (totalCubes <= 0) return [];
  if (columnCount === 1) return [{ columnOffset: 0, cubeCount: totalCubes }];

  // Generate triangular/pyramid weights
  // Peak at ~40% of duration (slightly early, like real glucose absorption)
  const peakPosition = (columnCount - 1) * 0.4;
  const weights: number[] = [];

  for (let i = 0; i < columnCount; i++) {
    const distance = Math.abs(i - peakPosition);
    const maxDistance = Math.max(peakPosition, columnCount - 1 - peakPosition);
    const weight = Math.max(0.1, 1 - distance / (maxDistance + 0.5));
    weights.push(weight);
  }

  // Normalize weights and distribute cubes
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  const rawCubes = weights.map(w => (w / totalWeight) * totalCubes);

  // Round while preserving total
  const result: CubeColumn[] = [];
  let distributed = 0;

  for (let i = 0; i < columnCount; i++) {
    let cubes: number;
    if (i === columnCount - 1) {
      // Last column gets remainder
      cubes = totalCubes - distributed;
    } else {
      cubes = Math.round(rawCubes[i]);
    }
    cubes = Math.max(0, cubes);
    distributed += cubes;

    if (cubes > 0) {
      result.push({ columnOffset: i, cubeCount: cubes });
    }
  }

  // Safety: if rounding errors caused mismatch, adjust the peak column
  if (distributed !== totalCubes && result.length > 0) {
    const peakIdx = result.reduce((maxIdx, col, idx) =>
      col.cubeCount > result[maxIdx].cubeCount ? idx : maxIdx, 0);
    result[peakIdx].cubeCount += (totalCubes - distributed);
  }

  return result;
}

/**
 * Calculate the full graph state: BG value at each column.
 * Returns array of length TOTAL_COLUMNS where each value is the total
 * cube height in mg/dL at that column position.
 */
export function calculateGraphState(
  placedFoods: PlacedFood[],
  allShips: Ship[]
): number[] {
  const bgValues = new Array(TOTAL_COLUMNS).fill(0);

  for (const placed of placedFoods) {
    const ship = allShips.find(s => s.id === placed.shipId);
    if (!ship) continue;

    const pyramid = calculatePyramid(ship.load, ship.duration);
    for (const col of pyramid) {
      const graphColumn = placed.dropColumn + col.columnOffset;
      if (graphColumn >= 0 && graphColumn < TOTAL_COLUMNS) {
        bgValues[graphColumn] += col.cubeCount * GRAPH_CONFIG.cellHeightMgDl;
      }
    }
  }

  return bgValues;
}

/**
 * Build detailed pyramid data for each placed food (for rendering).
 */
export function buildFoodPyramids(
  placedFoods: PlacedFood[],
  allShips: Ship[]
): FoodPyramid[] {
  return placedFoods.map(placed => {
    const ship = allShips.find(s => s.id === placed.shipId);
    const columns = ship ? calculatePyramid(ship.load, ship.duration) : [];
    return {
      placementId: placed.id,
      shipId: placed.shipId,
      dropColumn: placed.dropColumn,
      columns,
    };
  });
}
