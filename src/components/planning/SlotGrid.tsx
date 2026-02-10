import type { Ship, PlacedShip, DaySegment, SegmentValidation } from '../../core/types';
import {
  DAY_SEGMENTS,
  SLOTS_PER_ROW,
  ROWS_PER_SEGMENT,
  SHIP_SIZE_TO_SLOTS,
  slotNumberToPosition,
  positionToSlotNumber,
} from '../../core/types';
import { Slot } from './Slot';
import { Tooltip } from '../ui/Tooltip';
import './SlotGrid.css';

interface SlotGridProps {
  placedShips: PlacedShip[];
  ships: Ship[];
  validDropSlots: Set<number>;
  highlightedSlots: Set<number>;
  activeShip?: Ship | null;
  hoveredSlot?: number | null;
  segmentValidation?: SegmentValidation[];
  blockedSlots?: number[];
}

function getSegmentCarbColor(validation: SegmentValidation): string {
  const { currentCarbs, min, optimal, max } = validation;
  if (currentCarbs === 0) return '#4a5568'; // Gray - empty
  if (currentCarbs < min || currentCarbs > max) return '#fc8181'; // Red - out of range
  // Distance from optimal (0 = at optimal, 1 = at boundary)
  const distFromOptimal = Math.abs(currentCarbs - optimal);
  const maxDist = Math.max(optimal - min, max - optimal);
  const ratio = distFromOptimal / maxDist;
  if (ratio <= 0.4) return '#48bb78'; // Green - close to optimal
  return '#ecc94b'; // Yellow - near boundary
}

export function SlotGrid({
  placedShips,
  ships,
  validDropSlots,
  highlightedSlots,
  activeShip,
  hoveredSlot,
  segmentValidation,
  blockedSlots = [],
}: SlotGridProps) {
  const activeShipSize = activeShip ? SHIP_SIZE_TO_SLOTS[activeShip.size] : 1;
  const blockedSlotsSet = new Set(blockedSlots);

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

  // Calculate which slots would be occupied if we drop at the hovered slot
  // This works for ANY hovered slot, not just valid ones
  const hoveredGroupSlots = new Set<number>();
  let isHoveredGroupValid = false;

  if (hoveredSlot !== null && hoveredSlot !== undefined && activeShipSize > 0) {
    // Calculate the leftmost slot where the ship would start
    // For multi-slot ships, we want to show where it would actually land
    // If hovering slot 9 with L ship (3 slots), it would occupy 7,8,9 if started at 7
    // But we need to find a valid start position or show invalid

    // First, check if there's a valid group that includes this slot
    const validGroupStart = slotToGroupStart.get(hoveredSlot);

    if (validGroupStart !== undefined) {
      // This slot is part of a valid drop zone - highlight the valid group
      for (let i = 0; i < activeShipSize; i++) {
        hoveredGroupSlots.add(validGroupStart + i);
      }
      isHoveredGroupValid = true;
    } else {
      // Not a valid drop - show where ship WOULD go (red highlight)
      // Ship would start at hoveredSlot and extend right
      const rowStart = Math.floor((hoveredSlot - 1) / 3) * 3 + 1; // First slot in this row
      const rowEnd = rowStart + 2; // Last slot in this row

      // Calculate which slots the ship would occupy starting from hoveredSlot
      for (let i = 0; i < activeShipSize; i++) {
        const targetSlot = hoveredSlot + i;
        // Only include slots that are in the same row
        if (targetSlot <= rowEnd) {
          hoveredGroupSlots.add(targetSlot);
        }
      }

      // For requiresEmptySlotBefore: also highlight the conflicting food slot before
      if (activeShip?.requiresEmptySlotBefore && hoveredSlot > 1) {
        const prevSlot = hoveredSlot - 1;
        const prevShipInfo = slotToShip.get(prevSlot);
        if (prevShipInfo) {
          const prevShip = ships.find((s) => s.id === prevShipInfo.placedShip.shipId);
          if (prevShip?.loadType === 'Glucose') {
            hoveredGroupSlots.add(prevSlot);
          }
        }
      }

      isHoveredGroupValid = false;
    }
  }

  const renderSegment = (segment: DaySegment, segmentIndex: number) => {
    const segVal = segmentValidation?.find((s) => s.segment === segment);
    const rows = [];

    for (let row = 0; row < ROWS_PER_SEGMENT; row++) {
      const slots = [];

      for (let col = 0; col < SLOTS_PER_ROW; col++) {
        const slotNumber = segmentIndex * 6 + row * 3 + col + 1;
        const shipInfo = slotToShip.get(slotNumber);
        const ship = shipInfo
          ? ships.find((s) => s.id === shipInfo.placedShip.shipId)
          : undefined;

        const groupStartSlot = slotToGroupStart.get(slotNumber);

        // Check if this slot is part of the currently hovered group
        const isInHoveredGroup = hoveredGroupSlots.has(slotNumber);

        slots.push(
          <Slot
            key={slotNumber}
            slotNumber={slotNumber}
            placedShip={shipInfo?.isStart ? shipInfo.placedShip : undefined}
            ship={shipInfo?.isStart ? ship : undefined}
            isOccupied={!!shipInfo?.isStart}
            isPreOccupied={!!shipInfo?.placedShip.isPreOccupied}
            isBlocked={blockedSlotsSet.has(slotNumber)}
            groupStartSlot={groupStartSlot}
            isHighlighted={highlightedSlots.has(slotNumber)}
            isPartOfShip={!!shipInfo && !shipInfo.isStart}
            isHoveredValid={isInHoveredGroup && isHoveredGroupValid}
            isHoveredInvalid={isInHoveredGroup && !isHoveredGroupValid}
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
        <div className="slot-grid__segment-header">
          <h3 className="slot-grid__segment-title">{segment.toUpperCase()}</h3>
          {segVal && (
            <Tooltip text="Carb target for this meal. Place food cards to reach the minimum. Green = on target, Yellow = close, Red = out of range." position="bottom">
              <div className="slot-grid__segment-carbs">
                <span className="slot-grid__segment-range">
                  {segVal.min} - {segVal.max}g
                </span>
                <span
                  className="slot-grid__segment-current"
                  style={{ backgroundColor: getSegmentCarbColor(segVal) }}
                >
                  {segVal.currentCarbs}g
                </span>
              </div>
            </Tooltip>
          )}
        </div>
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
  allShips: Ship[],
  blockedSlots: number[] = []
): Set<number> {
  const valid = new Set<number>();
  const slotsRequired = SHIP_SIZE_TO_SLOTS[ship.size];
  const blockedSet = new Set(blockedSlots);

  // Build occupied slots set and food-occupied slots set
  const occupiedSlots = new Set<number>();
  const foodOccupiedSlots = new Set<number>();
  const segmentGroupCount: Record<string, number> = { Morning: 0, Day: 0, Evening: 0 };

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
      if (placedShipConfig.loadType === 'Glucose') {
        foodOccupiedSlots.add(startSlot + i);
      }
    }

    // Count placed cards with same group per segment
    if (ship.group && placedShipConfig.group === ship.group) {
      segmentGroupCount[placed.segment]++;
    }
  }

  // Check each possible starting position
  for (let slotNum = 1; slotNum <= 18; slotNum++) {
    const pos = slotNumberToPosition(slotNum);

    // Check if ship fits within the row (3 slots per row)
    const endIndex = pos.index + slotsRequired - 1;
    if (endIndex > 2) continue; // Doesn't fit in row

    // Check if all required slots are free (including blocked slots)
    let canPlace = true;
    for (let i = 0; i < slotsRequired; i++) {
      if (occupiedSlots.has(slotNum + i) || blockedSet.has(slotNum + i)) {
        canPlace = false;
        break;
      }
    }
    if (!canPlace) continue;

    // Check requiresEmptySlotBefore: previous slot must not contain food or be blocked
    if (ship.requiresEmptySlotBefore) {
      if (slotNum === 1) continue; // Can't place in first slot
      if (foodOccupiedSlots.has(slotNum - 1)) continue; // Previous slot has food
      if (blockedSet.has(slotNum - 1)) continue; // Previous slot is blocked
    }

    // Check group segment limit: max 1 card with same group per segment
    if (ship.group && segmentGroupCount[pos.segment] >= 1) {
      continue;
    }

    valid.add(slotNum);
  }

  return valid;
}
