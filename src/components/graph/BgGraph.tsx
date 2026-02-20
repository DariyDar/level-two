import { useMemo, useCallback, useRef } from 'react';
import { useDroppable } from '@dnd-kit/core';
import type { Ship, PlacedFood, PlacedIntervention, Intervention, GameSettings, MedicationModifiers } from '../../core/types';
import {
  TOTAL_COLUMNS,
  TOTAL_ROWS,
  DEFAULT_X_TICKS,
  DEFAULT_Y_TICKS,
  DEFAULT_MEDICATION_MODIFIERS,
  PENALTY_ORANGE_ROW,
  PENALTY_RED_ROW,
  GRAPH_CONFIG,
  columnToTimeString,
  formatBgValue,
} from '../../core/types';
import { calculateCurve, calculateInterventionCurve, calculateInterventionReduction, applyMedicationToFood, calculateSglt2Reduction } from '../../core/cubeEngine';
import './BgGraph.css';

// SVG layout constants
const CELL_SIZE = 18;
const PAD_LEFT = 55;
const PAD_TOP = 12;
const PAD_RIGHT = 12;
const PAD_BOTTOM = 28;

const GRAPH_W = TOTAL_COLUMNS * CELL_SIZE;
const GRAPH_H = TOTAL_ROWS * CELL_SIZE;
const SVG_W = PAD_LEFT + GRAPH_W + PAD_RIGHT;
const SVG_H = PAD_TOP + GRAPH_H + PAD_BOTTOM;

// BG zone thresholds (mg/dL)
const ZONE_NORMAL = 140;
const ZONE_ELEVATED = 200;
const ZONE_HIGH = 300;

// GI-based blue gradient: glucose rise rate → light blue (slow) to dark blue (fast)
function getGiColor(riseRate: number, minRate: number, maxRate: number): string {
  const t = maxRate > minRate ? (riseRate - minRate) / (maxRate - minRate) : 0;
  // HSL: hue 215 (blue), saturation 75%, lightness 78% (light) → 32% (dark)
  const lightness = 78 - t * 46;
  return `hsl(215, 75%, ${Math.round(lightness)}%)`;
}

const PREVIEW_COLOR = 'rgba(99, 179, 237, 0.4)';

interface BgGraphProps {
  placedFoods: PlacedFood[];
  allShips: Ship[];
  placedInterventions: PlacedIntervention[];
  allInterventions: Intervention[];
  settings: GameSettings;
  decayRate: number;
  medicationModifiers?: MedicationModifiers;
  previewShip?: Ship | null;
  previewIntervention?: Intervention | null;
  previewColumn?: number | null;
  showPenaltyHighlight?: boolean;
  interactive?: boolean;
  onFoodClick?: (placementId: string) => void;
  onInterventionClick?: (placementId: string) => void;
}

// Convert row (0 = bottom = bgMin) to SVG y
function rowToY(row: number): number {
  return PAD_TOP + GRAPH_H - (row + 1) * CELL_SIZE;
}

// Convert column to SVG x
function colToX(col: number): number {
  return PAD_LEFT + col * CELL_SIZE;
}

// Convert mg/dL to row index
function mgdlToRow(mgdl: number): number {
  return (mgdl - GRAPH_CONFIG.bgMin) / GRAPH_CONFIG.cellHeightMgDl;
}

export function BgGraph({
  placedFoods,
  allShips,
  placedInterventions,
  allInterventions,
  settings,
  decayRate,
  medicationModifiers = DEFAULT_MEDICATION_MODIFIERS,
  previewShip,
  previewIntervention,
  previewColumn,
  showPenaltyHighlight = false,
  interactive = true,
  onFoodClick,
  onInterventionClick,
}: BgGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const { setNodeRef, isOver } = useDroppable({
    id: 'bg-graph',
  });

  // Calculate intervention reduction per column (in cubes)
  const interventionReduction = useMemo(
    () => calculateInterventionReduction(placedInterventions, allInterventions),
    [placedInterventions, allInterventions]
  );

  // Build per-food cube data for coloring
  const foodCubeData = useMemo(() => {
    const data: Array<{
      placementId: string;
      shipId: string;
      dropColumn: number;
      color: string;
      emoji: string;
      columns: Array<{ col: number; baseRow: number; count: number }>;
    }> = [];

    // Track cumulative height at each column for stacking
    const columnHeights = new Array(TOTAL_COLUMNS).fill(0);

    // Precompute GI rate range from placed foods only for color normalization
    const placedShipIds = new Set(placedFoods.map(p => p.shipId));
    const placedRates = allShips
      .filter(s => placedShipIds.has(s.id))
      .map(s => s.load / s.duration);
    const minRate = placedRates.length > 0 ? Math.min(...placedRates) : 0;
    const maxRate = placedRates.length > 0 ? Math.max(...placedRates) : 1;

    for (const placed of placedFoods) {
      const ship = allShips.find(s => s.id === placed.shipId);
      if (!ship) continue;

      const { glucose, duration } = applyMedicationToFood(ship.load, ship.duration, medicationModifiers);
      // Always use plateau (decayRate=0) to render all cubes including pancreas-eaten
      const curve = calculateCurve(glucose, duration, placed.dropColumn, 0);
      const cols: Array<{ col: number; baseRow: number; count: number }> = [];

      for (const pc of curve) {
        const graphCol = placed.dropColumn + pc.columnOffset;
        if (graphCol >= 0 && graphCol < TOTAL_COLUMNS) {
          const baseRow = columnHeights[graphCol];
          cols.push({ col: graphCol, baseRow, count: pc.cubeCount });
          columnHeights[graphCol] += pc.cubeCount;
        }
      }

      data.push({
        placementId: placed.id,
        shipId: placed.shipId,
        dropColumn: placed.dropColumn,
        color: getGiColor(ship.load / ship.duration, minRate, maxRate),
        emoji: ship.emoji,
        columns: cols,
      });
    }

    return data;
  }, [placedFoods, allShips, medicationModifiers]);

  // Pancreas caps: food height after pancreas decay (before interventions/SGLT2)
  const pancreasCaps = useMemo(() => {
    const heights = new Array(TOTAL_COLUMNS).fill(0);
    for (const placed of placedFoods) {
      const ship = allShips.find(s => s.id === placed.shipId);
      if (!ship) continue;
      const { glucose, duration } = applyMedicationToFood(ship.load, ship.duration, medicationModifiers);
      const curve = calculateCurve(glucose, duration, placed.dropColumn, decayRate);
      for (const col of curve) {
        const graphCol = placed.dropColumn + col.columnOffset;
        if (graphCol >= 0 && graphCol < TOTAL_COLUMNS) {
          heights[graphCol] += col.cubeCount;
        }
      }
    }
    return heights;
  }, [placedFoods, allShips, medicationModifiers, decayRate]);

  // Column caps: visible height after pancreas + interventions + SGLT2
  const columnCaps = useMemo(() => {
    const sglt2 = medicationModifiers.sglt2;
    const sglt2Reduction = sglt2
      ? calculateSglt2Reduction(pancreasCaps, sglt2.depth, sglt2.floorRow)
      : new Array(TOTAL_COLUMNS).fill(0);

    return pancreasCaps.map((h, i) =>
      Math.max(0, h - interventionReduction[i] - sglt2Reduction[i])
    );
  }, [pancreasCaps, interventionReduction, medicationModifiers.sglt2]);

  // Plateau heights: total food cube heights (before any reductions)
  const plateauHeights = useMemo(() => {
    const heights = new Array(TOTAL_COLUMNS).fill(0);
    for (const food of foodCubeData) {
      for (const col of food.columns) {
        const top = col.baseRow + col.count;
        if (top > heights[col.col]) {
          heights[col.col] = top;
        }
      }
    }
    return heights;
  }, [foodCubeData]);

  // Preview curve (shown during drag hover)
  const previewCubes = useMemo(() => {
    if (!previewShip || previewColumn == null) return null;
    const { glucose, duration } = applyMedicationToFood(previewShip.load, previewShip.duration, medicationModifiers);
    // Preview uses plateau (all cubes visible including future pancreas-eaten)
    const curve = calculateCurve(glucose, duration, previewColumn, 0);
    return curve.map((pc: { columnOffset: number; cubeCount: number }) => {
      const graphCol = previewColumn + pc.columnOffset;
      if (graphCol < 0 || graphCol >= TOTAL_COLUMNS) return null;
      return {
        col: graphCol,
        baseRow: plateauHeights[graphCol],
        count: pc.cubeCount,
      };
    }).filter(Boolean) as Array<{ col: number; baseRow: number; count: number }>;
  }, [previewShip, previewColumn, plateauHeights, medicationModifiers]);

  // Intervention preview: per-column reduction array
  const interventionPreviewData = useMemo(() => {
    if (!previewIntervention || previewColumn == null) return null;
    const { depth, duration, boostCols = 0, boostExtra = 0 } = previewIntervention;
    const curve = calculateInterventionCurve(depth, duration, previewColumn, boostCols, boostExtra);
    const reduction = new Array(TOTAL_COLUMNS).fill(0);
    for (const cc of curve) {
      const col = previewColumn + cc.columnOffset;
      if (col >= 0 && col < TOTAL_COLUMNS) {
        reduction[col] = cc.cubeCount;
      }
    }
    return reduction;
  }, [previewIntervention, previewColumn]);

  const handleCubeClick = useCallback(
    (placementId: string, isIntervention: boolean) => {
      if (!interactive) return;
      if (isIntervention) {
        onInterventionClick?.(placementId);
      } else {
        onFoodClick?.(placementId);
      }
    },
    [onFoodClick, onInterventionClick, interactive]
  );

  return (
    <div ref={setNodeRef} className={`bg-graph ${isOver ? 'bg-graph--drag-over' : ''}`}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        className="bg-graph__svg"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Zone backgrounds */}
        <rect
          x={PAD_LEFT}
          y={rowToY(mgdlToRow(ZONE_NORMAL) - 1)}
          width={GRAPH_W}
          height={(mgdlToRow(ZONE_NORMAL) - 0) * CELL_SIZE}
          fill="#c6f6d5"
          opacity={0.3}
        />
        <rect
          x={PAD_LEFT}
          y={rowToY(mgdlToRow(ZONE_ELEVATED) - 1)}
          width={GRAPH_W}
          height={(mgdlToRow(ZONE_ELEVATED) - mgdlToRow(ZONE_NORMAL)) * CELL_SIZE}
          fill="#fefcbf"
          opacity={0.3}
        />
        <rect
          x={PAD_LEFT}
          y={rowToY(mgdlToRow(ZONE_HIGH) - 1)}
          width={GRAPH_W}
          height={(mgdlToRow(ZONE_HIGH) - mgdlToRow(ZONE_ELEVATED)) * CELL_SIZE}
          fill="#fed7d7"
          opacity={0.3}
        />
        <rect
          x={PAD_LEFT}
          y={PAD_TOP}
          width={GRAPH_W}
          height={(TOTAL_ROWS - mgdlToRow(ZONE_HIGH)) * CELL_SIZE}
          fill="#fc8181"
          opacity={0.2}
        />

        {/* Grid lines - vertical (time) */}
        {Array.from({ length: TOTAL_COLUMNS + 1 }, (_, i) => (
          <line
            key={`v-${i}`}
            x1={colToX(i)}
            y1={PAD_TOP}
            x2={colToX(i)}
            y2={PAD_TOP + GRAPH_H}
            stroke="#e2e8f0"
            strokeWidth={i % 4 === 0 ? 0.8 : 0.3}
          />
        ))}

        {/* Grid lines - horizontal (BG) */}
        {Array.from({ length: TOTAL_ROWS + 1 }, (_, i) => (
          <line
            key={`h-${i}`}
            x1={PAD_LEFT}
            y1={PAD_TOP + i * CELL_SIZE}
            x2={PAD_LEFT + GRAPH_W}
            y2={PAD_TOP + i * CELL_SIZE}
            stroke="#e2e8f0"
            strokeWidth={0.3}
          />
        ))}

        {/* Graph border */}
        <rect
          x={PAD_LEFT}
          y={PAD_TOP}
          width={GRAPH_W}
          height={GRAPH_H}
          fill="none"
          stroke="#a0aec0"
          strokeWidth={1}
        />

        {/* Y axis labels */}
        {DEFAULT_Y_TICKS.map(tick => {
          const row = mgdlToRow(tick);
          const y = rowToY(row - 1) + CELL_SIZE / 2;
          return (
            <text
              key={`y-${tick}`}
              x={PAD_LEFT - 5}
              y={y}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={9}
              fill="#718096"
            >
              {formatBgValue(tick, settings.bgUnit)}
            </text>
          );
        })}

        {/* X axis labels */}
        {DEFAULT_X_TICKS.map(hour => {
          const col = ((hour - GRAPH_CONFIG.startHour) * 60) / GRAPH_CONFIG.cellWidthMin;
          const x = colToX(col);
          return (
            <text
              key={`x-${hour}`}
              x={x}
              y={PAD_TOP + GRAPH_H + 16}
              textAnchor="middle"
              fontSize={9}
              fill="#718096"
            >
              {columnToTimeString(col, settings.timeFormat)}
            </text>
          );
        })}

        {/* SGLT2 drain threshold line */}
        {medicationModifiers.sglt2 && (
          <line
            x1={PAD_LEFT}
            y1={rowToY(medicationModifiers.sglt2.floorRow - 1)}
            x2={PAD_LEFT + GRAPH_W}
            y2={rowToY(medicationModifiers.sglt2.floorRow - 1)}
            stroke="#b794f4"
            strokeWidth={1.5}
            strokeDasharray="6 3"
            opacity={0.7}
          />
        )}

        {/* Placed food cubes — normal + pancreas-eaten (orange) + burned (semi-transparent) */}
        {foodCubeData.map(food => (
          <g key={food.placementId} className="bg-graph__food-group">
            {food.columns.map(col =>
              Array.from({ length: col.count }, (_, cubeIdx) => {
                const row = col.baseRow + cubeIdx;
                if (row >= TOTAL_ROWS) return null;
                const isPancreasEaten = row >= pancreasCaps[col.col];
                const isBurned = !isPancreasEaten && row >= columnCaps[col.col];
                const colOffset = col.col - food.dropColumn;
                const waveDelay = colOffset * 20;
                const cubeClass = isPancreasEaten
                  ? 'bg-graph__cube--pancreas'
                  : isBurned
                    ? 'bg-graph__cube--burned'
                    : 'bg-graph__cube';
                const cubeFill = isPancreasEaten
                  ? 'rgba(246, 153, 63, 0.5)'
                  : food.color;
                return (
                  <rect
                    key={`${food.placementId}-${col.col}-${cubeIdx}`}
                    x={colToX(col.col) + 0.5}
                    y={rowToY(row) + 0.5}
                    width={CELL_SIZE - 1}
                    height={CELL_SIZE - 1}
                    fill={cubeFill}
                    rx={2}
                    className={cubeClass}
                    style={{ animationDelay: `${waveDelay}ms` }}
                    onClick={() => {
                      if (isPancreasEaten) return;
                      if (isBurned) {
                        if (placedInterventions.length > 0) {
                          handleCubeClick(placedInterventions[0]?.id ?? food.placementId, true);
                        }
                      } else {
                        handleCubeClick(food.placementId, false);
                      }
                    }}
                  />
                );
              })
            )}
          </g>
        ))}

        {/* Penalty highlight overlays (after submit) */}
        {showPenaltyHighlight && foodCubeData.map(food =>
          food.columns.map(col =>
            Array.from({ length: col.count }, (_, cubeIdx) => {
              const row = col.baseRow + cubeIdx;
              if (row >= TOTAL_ROWS) return null;
              // Only highlight non-burned cubes in penalty zones
              if (row >= columnCaps[col.col]) return null;
              const isOrange = row >= PENALTY_ORANGE_ROW && row < PENALTY_RED_ROW;
              const isRed = row >= PENALTY_RED_ROW;
              if (!isOrange && !isRed) return null;
              const waveDelay = col.col * 15;
              return (
                <rect
                  key={`penalty-${food.placementId}-${col.col}-${cubeIdx}`}
                  x={colToX(col.col) + 0.5}
                  y={rowToY(row) + 0.5}
                  width={CELL_SIZE - 1}
                  height={CELL_SIZE - 1}
                  fill={isRed ? 'rgba(245, 101, 101, 0.7)' : 'rgba(237, 137, 54, 0.6)'}
                  rx={2}
                  className="bg-graph__cube--penalty"
                  style={{ animationDelay: `${waveDelay}ms` }}
                  pointerEvents="none"
                />
              );
            })
          )
        )}

        {/* Intervention preview: green overlay on food cubes that would be burned */}
        {interventionPreviewData && foodCubeData.map(food =>
          food.columns.map(col => {
            const red = interventionPreviewData[col.col];
            if (red <= 0) return null;
            const cap = columnCaps[col.col];
            const burnFloor = Math.max(0, cap - red);
            return Array.from({ length: col.count }, (_, cubeIdx) => {
              const row = col.baseRow + cubeIdx;
              if (row >= TOTAL_ROWS || row >= cap || row < burnFloor) return null;
              return (
                <rect
                  key={`burn-pv-${food.placementId}-${col.col}-${cubeIdx}`}
                  x={colToX(col.col) + 0.5}
                  y={rowToY(row) + 0.5}
                  width={CELL_SIZE - 1}
                  height={CELL_SIZE - 1}
                  fill="rgba(34, 197, 94, 0.6)"
                  rx={2}
                  className="bg-graph__cube--preview-burn"
                />
              );
            });
          })
        )}

        {/* Preview cubes (during drag) */}
        {previewCubes && previewCubes.map((col, i) =>
          Array.from({ length: col.count }, (_, cubeIdx) => {
            const row = col.baseRow + cubeIdx;
            if (row >= TOTAL_ROWS) return null;
            return (
              <rect
                key={`preview-${i}-${cubeIdx}`}
                x={colToX(col.col) + 0.5}
                y={rowToY(row) + 0.5}
                width={CELL_SIZE - 1}
                height={CELL_SIZE - 1}
                fill={PREVIEW_COLOR}
                rx={2}
                className="bg-graph__cube--preview"
              />
            );
          })
        )}

        {/* Penalty threshold line at 200 mg/dL (shown during results) */}
        {showPenaltyHighlight && (
          <line
            x1={PAD_LEFT}
            y1={rowToY(PENALTY_ORANGE_ROW - 1)}
            x2={PAD_LEFT + GRAPH_W}
            y2={rowToY(PENALTY_ORANGE_ROW - 1)}
            stroke="#e53e3e"
            strokeWidth={1.5}
            strokeDasharray="6 3"
            opacity={0.8}
          />
        )}
      </svg>
    </div>
  );
}

/**
 * Utility: convert pointer position relative to the graph container to a column index.
 * Call this from the parent during drag events.
 */
export function pointerToColumn(
  graphElement: HTMLElement,
  pointerX: number
): number | null {
  const rect = graphElement.getBoundingClientRect();
  const svgWidth = rect.width;
  const scale = svgWidth / SVG_W;
  const relativeX = pointerX - rect.left;
  const svgX = relativeX / scale;
  const col = Math.floor((svgX - PAD_LEFT) / CELL_SIZE);

  if (col < 0 || col >= TOTAL_COLUMNS) return null;
  return col;
}
