import { useMemo, useCallback, useRef } from 'react';
import { useDroppable } from '@dnd-kit/core';
import type { Ship, PlacedFood, PlacedIntervention, Intervention, GameSettings } from '../../core/types';
import {
  GRAPH_CONFIG,
  TOTAL_COLUMNS,
  TOTAL_ROWS,
  DEFAULT_X_TICKS,
  DEFAULT_Y_TICKS,
  columnToTimeString,
  formatBgValue,
} from '../../core/types';
import { calculateCurve, calculateInterventionReduction } from '../../core/cubeEngine';
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

// Food colors for cubes (cycle through for different foods)
const FOOD_COLORS = [
  '#63b3ed', // blue
  '#fc8181', // red
  '#68d391', // green
  '#f6ad55', // orange
  '#b794f4', // purple
  '#f687b3', // pink
  '#4fd1c5', // teal
  '#ecc94b', // yellow
];

const PREVIEW_COLOR = 'rgba(99, 179, 237, 0.4)';

interface BgGraphProps {
  placedFoods: PlacedFood[];
  allShips: Ship[];
  placedInterventions: PlacedIntervention[];
  allInterventions: Intervention[];
  settings: GameSettings;
  previewShip?: Ship | null;
  previewColumn?: number | null;
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
  previewShip,
  previewColumn,
  onFoodClick,
  onInterventionClick,
}: BgGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const { setNodeRef, isOver } = useDroppable({
    id: 'bg-graph',
  });

  const { decayEnabled } = settings;

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
      color: string;
      emoji: string;
      columns: Array<{ col: number; baseRow: number; count: number }>;
    }> = [];

    // Track cumulative height at each column for stacking
    const columnHeights = new Array(TOTAL_COLUMNS).fill(0);
    const colorMap = new Map<string, number>();

    for (const placed of placedFoods) {
      const ship = allShips.find(s => s.id === placed.shipId);
      if (!ship) continue;

      // Assign color
      if (!colorMap.has(placed.shipId)) {
        colorMap.set(placed.shipId, colorMap.size);
      }
      const colorIdx = colorMap.get(placed.shipId)! % FOOD_COLORS.length;

      const curve = calculateCurve(ship.load, ship.duration, placed.dropColumn, decayEnabled);
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
        color: FOOD_COLORS[colorIdx],
        emoji: ship.emoji,
        columns: cols,
      });
    }

    return data;
  }, [placedFoods, allShips, decayEnabled]);

  // Compute max visible row per column (total food cubes - intervention reduction)
  const columnCaps = useMemo(() => {
    const totalHeights = new Array(TOTAL_COLUMNS).fill(0);
    for (const food of foodCubeData) {
      for (const col of food.columns) {
        const top = col.baseRow + col.count;
        if (top > totalHeights[col.col]) {
          totalHeights[col.col] = top;
        }
      }
    }
    return totalHeights.map((h, i) => Math.max(0, h - interventionReduction[i]));
  }, [foodCubeData, interventionReduction]);

  // Preview curve (shown during drag hover)
  const previewCubes = useMemo(() => {
    if (!previewShip || previewColumn == null) return null;
    const curve = calculateCurve(previewShip.load, previewShip.duration, previewColumn, decayEnabled);
    // Calculate base heights at each column (existing cubes after intervention)
    const baseHeights = new Array(TOTAL_COLUMNS).fill(0);
    for (const food of foodCubeData) {
      for (const col of food.columns) {
        const top = col.baseRow + col.count;
        if (top > baseHeights[col.col]) {
          baseHeights[col.col] = top;
        }
      }
    }
    // Apply intervention reduction to bases
    for (let i = 0; i < TOTAL_COLUMNS; i++) {
      baseHeights[i] = Math.max(0, baseHeights[i] - interventionReduction[i]);
    }
    return curve.map((pc: { columnOffset: number; cubeCount: number }) => {
      const graphCol = previewColumn + pc.columnOffset;
      if (graphCol < 0 || graphCol >= TOTAL_COLUMNS) return null;
      return {
        col: graphCol,
        baseRow: baseHeights[graphCol],
        count: pc.cubeCount,
      };
    }).filter(Boolean) as Array<{ col: number; baseRow: number; count: number }>;
  }, [previewShip, previewColumn, foodCubeData, interventionReduction, decayEnabled]);

  const handleCubeClick = useCallback(
    (placementId: string, isIntervention: boolean) => {
      if (isIntervention) {
        onInterventionClick?.(placementId);
      } else {
        onFoodClick?.(placementId);
      }
    },
    [onFoodClick, onInterventionClick]
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

        {/* Placed food cubes (capped by intervention reduction) */}
        {foodCubeData.map(food => (
          <g key={food.placementId} className="bg-graph__food-group">
            {food.columns.map(col =>
              Array.from({ length: col.count }, (_, cubeIdx) => {
                const row = col.baseRow + cubeIdx;
                if (row >= TOTAL_ROWS) return null;
                // Skip cubes above the intervention cap
                if (row >= columnCaps[col.col]) return null;
                return (
                  <rect
                    key={`${food.placementId}-${col.col}-${cubeIdx}`}
                    x={colToX(col.col) + 0.5}
                    y={rowToY(row) + 0.5}
                    width={CELL_SIZE - 1}
                    height={CELL_SIZE - 1}
                    fill={food.color}
                    opacity={0.85}
                    rx={2}
                    className="bg-graph__cube"
                    onClick={() => handleCubeClick(food.placementId, false)}
                  />
                );
              })
            )}
          </g>
        ))}

        {/* Intervention effect markers (shows removed area with striped pattern) */}
        {placedInterventions.length > 0 && foodCubeData.length > 0 && (
          <>
            <defs>
              <pattern id="intervention-stripes" patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="4" stroke="rgba(34, 120, 70, 0.8)" strokeWidth="2" />
              </pattern>
            </defs>
            {Array.from({ length: TOTAL_COLUMNS }, (_, colIdx) => {
              const reduction = interventionReduction[colIdx];
              if (reduction <= 0) return null;
              // Find total food height at this column
              let totalHeight = 0;
              for (const food of foodCubeData) {
                for (const col of food.columns) {
                  if (col.col === colIdx) {
                    const top = col.baseRow + col.count;
                    if (top > totalHeight) totalHeight = top;
                  }
                }
              }
              if (totalHeight <= 0) return null;
              const cap = columnCaps[colIdx];
              const removedFrom = cap;
              const removedTo = Math.min(totalHeight, TOTAL_ROWS);
              if (removedFrom >= removedTo) return null;
              return Array.from({ length: removedTo - removedFrom }, (_, idx) => {
                const row = removedFrom + idx;
                return (
                  <rect
                    key={`intervention-mark-${colIdx}-${idx}`}
                    x={colToX(colIdx) + 0.5}
                    y={rowToY(row) + 0.5}
                    width={CELL_SIZE - 1}
                    height={CELL_SIZE - 1}
                    fill="url(#intervention-stripes)"
                    rx={2}
                    opacity={0.9}
                    onClick={() => {
                      // Click on intervention marker removes the first intervention
                      if (placedInterventions.length > 0) {
                        handleCubeClick(placedInterventions[0].id, true);
                      }
                    }}
                  />
                );
              });
            })}
          </>
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

        {/* BG line — disabled for now */}
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
