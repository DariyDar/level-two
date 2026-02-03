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
  currentTick: number;
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
  currentTick,
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

  // Calculate which row is currently active (approaching port)
  // Each row takes some ticks to process
  const getRowOffset = (segmentIndex: number, rowIndex: number): number => {
    const totalRowsBefore = segmentIndex * 2 + rowIndex;
    // Offset based on progression - rows move toward port over time
    return Math.max(0, (totalRowsBefore * 50) - (currentTick * 15));
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
                    transform: `translateX(${offset}px)`,
                    transition: 'transform 0.5s ease-out',
                  }}
                >
                  {/* Render 3 slots per row */}
                  {[0, 1, 2].map(slotIndex => {
                    // Find ship that starts at this slot
                    const shipData = row.ships.find(s => s.placed.startSlot === slotIndex);

                    if (shipData) {
                      const slots = SHIP_SIZE_TO_SLOTS[shipData.ship.size];
                      const unloadProgress = shipData.isUnloading && unloadingShip
                        ? ((unloadingShip.totalTicks - unloadingShip.remainingTicks) / unloadingShip.totalTicks) * 100
                        : 0;
                      return (
                        <div
                          key={slotIndex}
                          className={`ship-queue__ship ship-queue__ship--size-${shipData.ship.size} ${
                            shipData.isUnloading ? 'ship-queue__ship--unloading' : ''
                          } ${shipData.isCompleted ? 'ship-queue__ship--completed' : ''}`}
                          style={{ gridColumn: `span ${slots}` }}
                        >
                          <span className="ship-queue__ship-emoji">{shipData.ship.emoji}</span>
                          {shipData.isUnloading && (
                            <div className="ship-queue__ship-progress">
                              <div
                                className="ship-queue__ship-progress-fill"
                                style={{ width: `${100 - unloadProgress}%` }}
                              />
                            </div>
                          )}
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

      {/* Unloading progress */}
      {unloadingShip && (
        <div className="ship-queue__unloading">
          <div className="ship-queue__unloading-bar">
            <div
              className="ship-queue__unloading-fill"
              style={{
                width: `${((unloadingShip.totalTicks - unloadingShip.remainingTicks) / unloadingShip.totalTicks) * 100}%`
              }}
            />
          </div>
          <span className="ship-queue__unloading-text">
            {unloadingShip.remainingTicks}h remaining
          </span>
        </div>
      )}
    </div>
  );
}
