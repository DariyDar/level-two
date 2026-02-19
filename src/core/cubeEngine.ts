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

// Background metabolic decay: 1 cube per 30 min = 0.5 cubes per 15-min column
const DECAY_RATE = 0.5;

/**
 * Calculate glucose curve for a food item.
 *
 * Shape: linear ramp-up during `duration`, then gradual decay to zero.
 *
 *   peakCubes = glucose / 20
 *   riseCols  = duration / 15
 *
 *   During rise (col 0..riseCols-1): height = peakCubes * (col+1) / riseCols
 *   Decay (col riseCols..end):       height = peakCubes - DECAY_RATE * (col - riseCols + 1), min 0
 *
 * The returned columns extend from dropColumn until height reaches 0 or end of graph.
 */
export function calculateCurve(
  glucose: number,
  durationMinutes: number,
  dropColumn: number
): CubeColumn[] {
  const peakCubes = Math.round(glucose / GRAPH_CONFIG.cellHeightMgDl);
  const riseCols = Math.max(1, Math.round(durationMinutes / GRAPH_CONFIG.cellWidthMin));

  if (peakCubes <= 0) return [];

  const result: CubeColumn[] = [];
  const totalCols = TOTAL_COLUMNS - dropColumn;

  for (let i = 0; i < totalCols; i++) {
    let height: number;
    if (i < riseCols) {
      // Ramp-up phase: linear rise from 1 to peakCubes
      height = Math.round(peakCubes * (i + 1) / riseCols);
    } else {
      // Decay phase: gradual decline (background energy expenditure)
      const decaySteps = i - riseCols + 1;
      height = Math.round(peakCubes - DECAY_RATE * decaySteps);
    }

    if (height <= 0) break;
    result.push({ columnOffset: i, cubeCount: height });
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

    const curve = calculateCurve(ship.load, ship.duration, placed.dropColumn);
    for (const col of curve) {
      const graphColumn = placed.dropColumn + col.columnOffset;
      if (graphColumn >= 0 && graphColumn < TOTAL_COLUMNS) {
        bgValues[graphColumn] += col.cubeCount * GRAPH_CONFIG.cellHeightMgDl;
      }
    }
  }

  return bgValues;
}

/**
 * Build detailed curve data for each placed food (for rendering).
 */
export function buildFoodPyramids(
  placedFoods: PlacedFood[],
  allShips: Ship[]
): FoodPyramid[] {
  return placedFoods.map(placed => {
    const ship = allShips.find(s => s.id === placed.shipId);
    const columns = ship ? calculateCurve(ship.load, ship.duration, placed.dropColumn) : [];
    return {
      placementId: placed.id,
      shipId: placed.shipId,
      dropColumn: placed.dropColumn,
      columns,
    };
  });
}
