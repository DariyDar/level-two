import { useDroppable } from '@dnd-kit/core';
import type { Ship, PlacedShip } from '../../core/types';
import { SHIP_SIZE_TO_SLOTS } from '../../core/types';
import { ShipCard } from './ShipCard';
import './Slot.css';

interface SlotProps {
  slotNumber: number; // 1-18
  placedShip?: PlacedShip;
  ship?: Ship;
  isOccupied: boolean;
  isPreOccupied: boolean;
  groupStartSlot?: number; // The start slot of the valid drop group this slot belongs to
  isHighlighted: boolean;
  isPartOfShip: boolean; // This slot is occupied by a multi-slot ship but not the start
  isHoveredValid?: boolean; // This slot is part of a valid hovered drop group (green)
  isHoveredInvalid?: boolean; // This slot is part of an invalid hovered drop group (red)
}

export function Slot({
  slotNumber,
  placedShip,
  ship,
  isOccupied,
  isPreOccupied,
  groupStartSlot,
  isHighlighted,
  isPartOfShip,
  isHoveredValid = false,
  isHoveredInvalid = false,
}: SlotProps) {
  const { setNodeRef } = useDroppable({
    id: `slot-${slotNumber}`,
    disabled: isOccupied || isPartOfShip,
    // Pass the group start slot so drop handler knows where to actually place the ship
    data: { slotNumber, groupStartSlot: groupStartSlot ?? slotNumber },
  });

  const showShip = placedShip && ship && !isPartOfShip;
  const shipSlots = ship ? SHIP_SIZE_TO_SLOTS[ship.size] : 1;

  return (
    <div
      ref={setNodeRef}
      className={[
        'slot',
        isOccupied && 'slot--occupied',
        isOccupied && shipSlots > 1 && `slot--spans-${shipSlots}`,
        isPreOccupied && 'slot--pre-occupied',
        isHoveredValid && 'slot--drop-valid',
        isHoveredInvalid && 'slot--drop-invalid',
        isHighlighted && 'slot--highlighted',
        isPartOfShip && 'slot--part-of-ship',
      ]
        .filter(Boolean)
        .join(' ')}
      data-slot={slotNumber}
    >
      {showShip ? (
        <ShipCard
          ship={ship}
          instanceId={placedShip.instanceId}
          isPlaced={true}
          isPreOccupied={isPreOccupied}
        />
      ) : (
        <span className="slot__number">{slotNumber}</span>
      )}
    </div>
  );
}
