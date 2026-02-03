import type { Ship, PlacedShip, DaySegment } from '../../core/types';
import {
  DAY_SEGMENTS,
  SLOTS_PER_ROW,
  ROWS_PER_SEGMENT,
  SHIP_SIZE_TO_SLOTS,
  slotNumberToPosition,
  positionToSlotNumber,
} from '../../core/types';
import { Slot } from './Slot';
import './SlotGrid.css';

interface SlotGridProps {
  placedShips: PlacedShip[];
  ships: Ship[];
  validDropSlots: Set<number>;
  highlightedSlots: Set<number>;
  activeShip?: Ship | null;
}

export function SlotGrid({
  placedShips,
  ships,
  validDropSlots,
  highlightedSlots,
  activeShip,
}: SlotGridProps) {
  const activeShipSize = activeShip ? SHIP_SIZE_TO_SLOTS[activeShip.size] : 1;

  // Build a map of slot number -> placed ship info
  const slotToShip = new Map<number, { placedShip: PlacedShip; isStart: boolean }>();

  for (const placed of placedShips) {
    const ship = ships.find((s) => s.id === placed.shipId);
    if (!ship) continue;

    const slotsRequired = SHIP_SIZE_TO_SLOTS[ship.size];
    const startSlot = positionToSlotNumber({
      segment: placed.segment,
      row: placed.row,
      index: placed.startSlot as 0 | 1 | 2,
    });

    for (let i = 0; i < slotsRequired; i++) {
      slotToShip.set(startSlot + i, {
        placedShip: placed,
        isStart: i === 0,
      });
    }
  }

  // Build expanded valid slots - for multi-slot ships, all slots in valid groups should highlight
  // Map each slot to its group's start slot for drop handling
  const expandedValidSlots = new Set<number>();
  const slotToGroupStart = new Map<number, number>();

  for (const startSlot of validDropSlots) {
    for (let i = 0; i < activeShipSize; i++) {
      expandedValidSlots.add(startSlot + i);
      slotToGroupStart.set(startSlot + i, startSlot);
    }
  }

  const renderSegment = (segment: DaySegment, segmentIndex: number) => {
    const rows = [];

    for (let row = 0; row < ROWS_PER_SEGMENT; row++) {
      const slots = [];

      for (let col = 0; col < SLOTS_PER_ROW; col++) {
        const slotNumber = segmentIndex * 6 + row * 3 + col + 1;
        const shipInfo = slotToShip.get(slotNumber);
        const ship = shipInfo
          ? ships.find((s) => s.id === shipInfo.placedShip.shipId)
          : undefined;

        // For multi-slot ships, check if this slot is part of a valid drop group
        const isInValidGroup = expandedValidSlots.has(slotNumber);
        const groupStartSlot = slotToGroupStart.get(slotNumber);

        slots.push(
          <Slot
            key={slotNumber}
            slotNumber={slotNumber}
            placedShip={shipInfo?.isStart ? shipInfo.placedShip : undefined}
            ship={shipInfo?.isStart ? ship : undefined}
            isOccupied={!!shipInfo?.isStart}
            isPreOccupied={!!shipInfo?.placedShip.isPreOccupied}
            canDrop={isInValidGroup}
            groupStartSlot={groupStartSlot}
            activeShipSize={activeShipSize}
            isHighlighted={highlightedSlots.has(slotNumber)}
            isPartOfShip={!!shipInfo && !shipInfo.isStart}
          />
        );
      }

      rows.push(
        <div key={`${segment}-${row}`} className="slot-grid__row">
          {slots}
        </div>
      );
    }

    return (
      <div key={segment} className="slot-grid__segment">
        <h3 className="slot-grid__segment-title">{segment}</h3>
        {rows}
      </div>
    );
  };

  return (
    <div className="slot-grid">
      {DAY_SEGMENTS.map((segment, index) => renderSegment(segment, index))}
    </div>
  );
}

// Utility: Calculate valid drop slots for a ship
export function calculateValidDropSlots(
  ship: Ship,
  placedShips: PlacedShip[],
  allShips: Ship[]
): Set<number> {
  const valid = new Set<number>();
  const slotsRequired = SHIP_SIZE_TO_SLOTS[ship.size];

  // Build occupied slots set
  const occupiedSlots = new Set<number>();
  for (const placed of placedShips) {
    const placedShipConfig = allShips.find((s) => s.id === placed.shipId);
    if (!placedShipConfig) continue;

    const size = SHIP_SIZE_TO_SLOTS[placedShipConfig.size];
    const startSlot = positionToSlotNumber({
      segment: placed.segment,
      row: placed.row,
      index: placed.startSlot as 0 | 1 | 2,
    });

    for (let i = 0; i < size; i++) {
      occupiedSlots.add(startSlot + i);
    }
  }

  // Check each possible starting position
  for (let slotNum = 1; slotNum <= 18; slotNum++) {
    const pos = slotNumberToPosition(slotNum);

    // Check if ship fits within the row (3 slots per row)
    const endIndex = pos.index + slotsRequired - 1;
    if (endIndex > 2) continue; // Doesn't fit in row

    // Check if all required slots are free
    let canPlace = true;
    for (let i = 0; i < slotsRequired; i++) {
      if (occupiedSlots.has(slotNum + i)) {
        canPlace = false;
        break;
      }
    }

    if (canPlace) {
      valid.add(slotNum);
    }
  }

  return valid;
}
