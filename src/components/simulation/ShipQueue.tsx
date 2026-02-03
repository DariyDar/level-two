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
}

// Group ships by segment and row for display
interface RowData {
  ships: { placed: PlacedShip; ship: Ship; isUnloading: boolean; isCompleted: boolean }[];
}

interface SegmentData {
  segment: DaySegment;
  rows: [RowData, RowData];
}

export function ShipQueue({
  placedShips,
  unloadingShip,
  remainingShips,
  ships,
}: ShipQueueProps) {
  // Build the queue structure matching planning phase
  const segments = useMemo(() => {
    const result: SegmentData[] = [];

    // Set of remaining ship instance IDs for quick lookup
    const remainingSet = new Set(remainingShips.map(s => s.instanceId));
    const unloadingId = unloadingShip?.instanceId;

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

      result.push({ segment, rows });
    }

    return result;
  }, [placedShips, unloadingShip, remainingShips, ships]);

  // Find which row contains the currently unloading ship
  const unloadingRowIndex = useMemo(() => {
    if (!unloadingShip) return -1;

    for (let segIdx = 0; segIdx < segments.length; segIdx++) {
      for (let rowIdx = 0; rowIdx < 2; rowIdx++) {
        const hasUnloading = segments[segIdx].rows[rowIdx].ships.some(s => s.isUnloading);
        if (hasUnloading) {
          return segIdx * 2 + rowIdx;
        }
      }
    }
    return -1;
  }, [segments, unloadingShip]);

  // Calculate dissolve progress for smooth row movement
  const currentDissolveProgress = unloadingShip
    ? (unloadingShip.totalTicks - unloadingShip.remainingTicks) / unloadingShip.totalTicks
    : 0;

  // Calculate vertical offset for rows - rows move UP toward port
  const ROW_HEIGHT = 44; // Height of row including gap

  const getRowOffset = (segmentIndex: number, rowIndex: number): number => {
    const globalRowIndex = segmentIndex * 2 + rowIndex;

    // Count how many rows have been completed (fully dissolved)
    const completedRows = unloadingRowIndex >= 0 ? unloadingRowIndex : 0;

    // Calculate offset: completed rows + current dissolve progress
    const totalOffset = completedRows + (unloadingRowIndex >= 0 ? currentDissolveProgress : 0);

    // Rows move up (negative Y) as ships complete
    const rowOffset = (globalRowIndex - totalOffset) * ROW_HEIGHT;

    return Math.max(0, rowOffset);
  };

  return (
    <div className="ship-queue">
      <div className="ship-queue__port">
        <span className="ship-queue__port-label">PORT</span>
        <div className="ship-queue__port-indicator" />
      </div>

      <div className="ship-queue__segments">
        {segments.map((segmentData, segmentIndex) => (
          <div
            key={segmentData.segment}
            className="ship-queue__segment"
          >
            <span className="ship-queue__segment-label">{segmentData.segment}</span>

            {segmentData.rows.map((row, rowIndex) => {
              const offset = getRowOffset(segmentIndex, rowIndex);
              const isAtPort = offset === 0;

              return (
                <div
                  key={rowIndex}
                  className={`ship-queue__row ${isAtPort ? 'ship-queue__row--at-port' : ''}`}
                  style={{
                    transform: `translateY(-${offset}px)`,
                    transition: 'transform 0.3s ease-out',
                  }}
                >
                  {/* Render 3 slots per row */}
                  {[0, 1, 2].map(slotIndex => {
                    // Find ship that starts at this slot
                    const shipData = row.ships.find(s => s.placed.startSlot === slotIndex);

                    if (shipData) {
                      const slots = SHIP_SIZE_TO_SLOTS[shipData.ship.size];
                      // Calculate dissolve progress (0 to 1) for CSS mask effect
                      const dissolveProgress = shipData.isUnloading && unloadingShip
                        ? (unloadingShip.totalTicks - unloadingShip.remainingTicks) / unloadingShip.totalTicks
                        : 0;
                      return (
                        <div
                          key={slotIndex}
                          className={`ship-queue__ship ship-queue__ship--size-${shipData.ship.size} ${
                            shipData.isUnloading ? 'ship-queue__ship--unloading' : ''
                          } ${shipData.isCompleted ? 'ship-queue__ship--completed' : ''}`}
                          style={{
                            gridColumn: `span ${slots}`,
                            '--dissolve-progress': dissolveProgress,
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
