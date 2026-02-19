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
 * Shape: linear ramp-up during `duration`, then:
 *   - decay mode ON:  gradual decline to zero
 *   - decay mode OFF: flat plateau to the right edge
 */
export function calculateCurve(
  glucose: number,
  durationMinutes: number,
  dropColumn: number,
  decayEnabled: boolean = true
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
    } else if (decayEnabled) {
      // Decay phase: gradual decline (background energy expenditure)
      const decaySteps = i - riseCols + 1;
      height = Math.round(peakCubes - DECAY_RATE * decaySteps);
    } else {
      // Plateau phase: flat at peak (no decay)
      height = peakCubes;
    }

    if (height <= 0) break;
    result.push({ columnOffset: i, cubeCount: height });
  }

  return result;
}

/**
 * Calculate the full graph state: BG value at each column.
 */
export function calculateGraphState(
  placedFoods: PlacedFood[],
  allShips: Ship[],
  decayEnabled: boolean = true
): number[] {
  const bgValues = new Array(TOTAL_COLUMNS).fill(0);

  for (const placed of placedFoods) {
    const ship = allShips.find(s => s.id === placed.shipId);
    if (!ship) continue;

    const curve = calculateCurve(ship.load, ship.duration, placed.dropColumn, decayEnabled);
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
  allShips: Ship[],
  decayEnabled: boolean = true
): FoodPyramid[] {
  return placedFoods.map(placed => {
    const ship = allShips.find(s => s.id === placed.shipId);
    const columns = ship ? calculateCurve(ship.load, ship.duration, placed.dropColumn, decayEnabled) : [];
    return {
      placementId: placed.id,
      shipId: placed.shipId,
      dropColumn: placed.dropColumn,
      columns,
    };
  });
}
