import type { PlacedFood, Ship, PlacedIntervention, Intervention, Medication, MedicationModifiers } from './types';
import { GRAPH_CONFIG, TOTAL_COLUMNS, DEFAULT_MEDICATION_MODIFIERS } from './types';

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

/**
 * Calculate intervention curve: ramp up during duration, then flat to end.
 * Returns cubes to REMOVE per column.
 *
 * Boost zone: first `boostCols` columns get `boostExtra` additional cubes
 * on top of the normal ramp/plateau value.
 */
export function calculateInterventionCurve(
  depth: number,
  durationMinutes: number,
  dropColumn: number,
  boostCols: number = 0,
  boostExtra: number = 0,
): CubeColumn[] {
  const riseCols = Math.max(1, Math.round(durationMinutes / GRAPH_CONFIG.cellWidthMin));
  if (depth <= 0) return [];

  const result: CubeColumn[] = [];
  const totalCols = TOTAL_COLUMNS - dropColumn;

  for (let i = 0; i < totalCols; i++) {
    let height: number;
    if (i < riseCols) {
      height = Math.round(depth * (i + 1) / riseCols);
    } else {
      height = depth;
    }
    // Apply boost in first N columns
    if (i < boostCols && boostExtra > 0) {
      height += boostExtra;
    }
    if (height <= 0) continue;
    result.push({ columnOffset: i, cubeCount: height });
  }

  return result;
}

/**
 * Calculate total intervention reduction per column (in cubes).
 */
export function calculateInterventionReduction(
  placedInterventions: PlacedIntervention[],
  allInterventions: Intervention[],
): number[] {
  const reduction = new Array(TOTAL_COLUMNS).fill(0);

  for (const placed of placedInterventions) {
    const intervention = allInterventions.find(i => i.id === placed.interventionId);
    if (!intervention) continue;

    const curve = calculateInterventionCurve(
      intervention.depth, intervention.duration, placed.dropColumn,
      intervention.boostCols ?? 0, intervention.boostExtra ?? 0,
    );
    for (const col of curve) {
      const graphCol = placed.dropColumn + col.columnOffset;
      if (graphCol >= 0 && graphCol < TOTAL_COLUMNS) {
        reduction[graphCol] += col.cubeCount;
      }
    }
  }

  return reduction;
}

// ============================================
// Medication System
// ============================================

/**
 * Aggregate modifiers from all active medications.
 */
export function computeMedicationModifiers(
  activeMedicationIds: string[],
  allMedications: Medication[],
): MedicationModifiers {
  const modifiers: MedicationModifiers = { ...DEFAULT_MEDICATION_MODIFIERS };

  for (const medId of activeMedicationIds) {
    const med = allMedications.find(m => m.id === medId);
    if (!med) continue;

    switch (med.type) {
      case 'peakReduction':
        modifiers.glucoseMultiplier *= (med.multiplier ?? 1);
        break;
      case 'thresholdDrain': {
        const floorRow = ((med.floorMgDl ?? 200) - GRAPH_CONFIG.bgMin) / GRAPH_CONFIG.cellHeightMgDl;
        modifiers.sglt2 = {
          depth: med.depth ?? 3,
          floorRow,
        };
        break;
      }
      case 'slowAbsorption':
        modifiers.durationMultiplier *= (med.durationMultiplier ?? 1);
        modifiers.glucoseMultiplier *= (1 / (med.durationMultiplier ?? 1));
        modifiers.kcalMultiplier *= (med.kcalMultiplier ?? 1);
        modifiers.wpBonus += (med.wpBonus ?? 0);
        break;
    }
  }

  return modifiers;
}

/**
 * Apply medication modifiers to food parameters before curve calculation.
 */
export function applyMedicationToFood(
  glucose: number,
  duration: number,
  modifiers: MedicationModifiers,
): { glucose: number; duration: number } {
  return {
    glucose: glucose * modifiers.glucoseMultiplier,
    duration: duration * modifiers.durationMultiplier,
  };
}

/**
 * Calculate SGLT2 threshold drain per column.
 * Removes up to `depth` cubes, but won't drain below `floorRow`.
 */
export function calculateSglt2Reduction(
  totalFoodHeights: number[],
  depth: number,
  floorRow: number,
): number[] {
  return totalFoodHeights.map(h => Math.min(depth, Math.max(0, h - floorRow)));
}
