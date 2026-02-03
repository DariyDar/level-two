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
  canDrop: boolean;
  groupStartSlot?: number; // The start slot of the valid drop group this slot belongs to
  isHighlighted: boolean;
  isPartOfShip: boolean; // This slot is occupied by a multi-slot ship but not the start
  isHoveredGroup?: boolean; // This slot is part of the currently hovered drop group
}

export function Slot({
  slotNumber,
  placedShip,
  ship,
  isOccupied,
  isPreOccupied,
  canDrop,
  groupStartSlot,
  isHighlighted,
  isPartOfShip,
  isHoveredGroup = false,
}: SlotProps) {
  const { setNodeRef } = useDroppable({
    id: `slot-${slotNumber}`,
    disabled: isOccupied || isPartOfShip,
    // Pass the group start slot so drop handler knows where to actually place the ship
    data: { slotNumber, groupStartSlot: groupStartSlot ?? slotNumber },
  });

  const showShip = placedShip && ship && !isPartOfShip;
  const shipSlots = ship ? SHIP_SIZE_TO_SLOTS[ship.size] : 1;

  // Show drop-valid highlight when this slot is part of the hovered group
  const showDropHighlight = isHoveredGroup && canDrop;

  return (
    <div
      ref={setNodeRef}
      className={[
        'slot',
        isOccupied && 'slot--occupied',
        isOccupied && shipSlots > 1 && `slot--spans-${shipSlots}`,
        isPreOccupied && 'slot--pre-occupied',
        showDropHighlight && 'slot--drop-valid',
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
