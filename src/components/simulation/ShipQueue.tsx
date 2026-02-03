import { useMemo } from 'react';
import type { UnloadingShip } from '../../core/simulation';
import type { Ship, PlacedShip, DaySegment } from '../../core/types';
import { DAY_SEGMENTS, SHIP_SIZE_TO_SLOTS } from '../../core/types';
import './ShipQueue.css';

interface QueuedShip {
  instanceId: string;
  shipId: string;
  slotNumber: number;
}

interface ShipQueueProps {
  placedShips: PlacedShip[];
  unloadingShip: UnloadingShip | null;
  remainingShips: QueuedShip[];
  ships: Map<string, Ship>;
  dissolveProgress: number; // Interpolated 0-1 for smooth animation
}

// Group ships by segment and row for display
interface RowData {
  ships: { placed: PlacedShip; ship: Ship; isUnloading: boolean; isCompleted: boolean }[];
}

interface SegmentData {
  segment: DaySegment;
  rows: [RowData, RowData];
}

// Row height in pixels (matches CSS min-height: 36px + gap: 4px)
const ROW_HEIGHT = 40;

export function ShipQueue({
  placedShips,
  unloadingShip,
  remainingShips,
  ships,
  dissolveProgress,
}: ShipQueueProps) {
  // Build the queue structure matching planning phase
  const { segments, unloadingRowIndex, completedRowsCount } = useMemo(() => {
    const result: SegmentData[] = [];

    // Set of remaining ship instance IDs for quick lookup
    const remainingSet = new Set(remainingShips.map(s => s.instanceId));
    const unloadingId = unloadingShip?.instanceId;

    let currentRowIndex = 0;
    let unloadingRowIdx = -1;
    let completedRows = 0;

    for (const segment of DAY_SEGMENTS) {
      const segmentShips = placedShips.filter(p => p.segment === segment);

      const rows: [RowData, RowData] = [
        { ships: [] },
        { ships: [] },
      ];

      for (const placed of segmentShips) {
        const ship = ships.get(placed.shipId);
        if (!ship) continue;

        const isUnloading = placed.instanceId === unloadingId;
        const isInQueue = remainingSet.has(placed.instanceId);
        const isCompleted = !isUnloading && !isInQueue;

        rows[placed.row].ships.push({
          placed,
          ship,
          isUnloading,
          isCompleted,
        });
      }

      // Sort ships in each row by startSlot
      rows[0].ships.sort((a, b) => a.placed.startSlot - b.placed.startSlot);
      rows[1].ships.sort((a, b) => a.placed.startSlot - b.placed.startSlot);

      // Track which row contains unloading ship and count completed rows
      for (let i = 0; i < 2; i++) {
        const hasUnloading = rows[i].ships.some(s => s.isUnloading);
        const allCompleted = rows[i].ships.length > 0 && rows[i].ships.every(s => s.isCompleted);

        if (hasUnloading) {
          unloadingRowIdx = currentRowIndex;
        }
        if (allCompleted) {
          completedRows++;
        }
        currentRowIndex++;
      }

      result.push({ segment, rows });
    }

    return {
      segments: result,
      unloadingRowIndex: unloadingRowIdx,
      completedRowsCount: completedRows,
    };
  }, [placedShips, unloadingShip, remainingShips, ships]);

  // Calculate smooth scroll offset:
  // - Completed rows are fully scrolled out
  // - Current unloading row scrolls based on dissolve progress
  const scrollOffset = useMemo(() => {
    const completedOffset = completedRowsCount * ROW_HEIGHT;
    const currentRowOffset = unloadingRowIndex >= 0 ? dissolveProgress * ROW_HEIGHT : 0;
    return completedOffset + currentRowOffset;
  }, [completedRowsCount, unloadingRowIndex, dissolveProgress]);


  return (
    <div className="ship-queue">
      <div
        className="ship-queue__segments"
        style={{
          transform: `translateY(-${scrollOffset}px)`,
        }}
      >
        {segments.map((segmentData) => (
          <div
            key={segmentData.segment}
            className="ship-queue__segment"
          >
            <span className="ship-queue__segment-label">{segmentData.segment}</span>

            {segmentData.rows.map((row, rowIndex) => {
              return (
                <div
                  key={rowIndex}
                  className="ship-queue__row"
                >
                  {/* Render 3 slots per row */}
                  {[0, 1, 2].map(slotIndex => {
                    // Find ship that starts at this slot
                    const shipData = row.ships.find(s => s.placed.startSlot === slotIndex);

                    if (shipData) {
                      const slots = SHIP_SIZE_TO_SLOTS[shipData.ship.size];
                      // Use interpolated dissolve progress for smooth animation
                      const shipDissolve = shipData.isUnloading ? dissolveProgress : 0;
                      return (
                        <div
                          key={slotIndex}
                          className={`ship-queue__ship ship-queue__ship--size-${shipData.ship.size} ${
                            shipData.isUnloading ? 'ship-queue__ship--unloading' : ''
                          } ${shipData.isCompleted ? 'ship-queue__ship--completed' : ''}`}
                          style={{
                            gridColumn: `span ${slots}`,
                            '--dissolve-progress': shipDissolve,
                          } as React.CSSProperties}
                        >
                          <span className="ship-queue__ship-emoji">{shipData.ship.emoji}</span>
                        </div>
                      );
                    }

                    // Check if this slot is part of a multi-slot ship
                    const isPartOfShip = row.ships.some(s => {
                      const slots = SHIP_SIZE_TO_SLOTS[s.ship.size];
                      return slotIndex > s.placed.startSlot &&
                             slotIndex < s.placed.startSlot + slots;
                    });

                    if (isPartOfShip) {
                      return null; // Skip, handled by the ship's gridColumn span
                    }

                    // Empty slot
                    return (
                      <div key={slotIndex} className="ship-queue__slot ship-queue__slot--empty" />
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>

    </div>
  );
}
