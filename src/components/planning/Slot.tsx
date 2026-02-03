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
  activeShipSize: number;
  isHighlighted: boolean;
  isPartOfShip: boolean; // This slot is occupied by a multi-slot ship but not the start
}

export function Slot({
  slotNumber,
  placedShip,
  ship,
  isOccupied,
  isPreOccupied,
  canDrop,
  groupStartSlot,
  activeShipSize,
  isHighlighted,
  isPartOfShip,
}: SlotProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `slot-${slotNumber}`,
    disabled: isOccupied || isPartOfShip,
    // Pass the group start slot so drop handler knows where to actually place the ship
    data: { slotNumber, groupStartSlot: groupStartSlot ?? slotNumber },
  });

  const showShip = placedShip && ship && !isPartOfShip;
  const shipSlots = ship ? SHIP_SIZE_TO_SLOTS[ship.size] : 1;

  // Show drop preview overlay when hovering over the START slot of a valid group
  // Only show preview if this slot IS the group start (not a middle/end slot of the group)
  const isGroupStartSlot = groupStartSlot === slotNumber;
  const showDropPreview = isOver && canDrop && activeShipSize > 1 && isGroupStartSlot;

  return (
    <div
      ref={setNodeRef}
      className={[
        'slot',
        isOccupied && 'slot--occupied',
        isOccupied && shipSlots > 1 && `slot--spans-${shipSlots}`,
        isPreOccupied && 'slot--pre-occupied',
        isOver && canDrop && 'slot--drop-valid',
        isOver && !canDrop && 'slot--drop-invalid',
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
      {/* Multi-slot drop preview overlay */}
      {showDropPreview && (
        <div className={`slot__drop-preview slot__drop-preview--size-${activeShipSize}`} />
      )}
    </div>
  );
}
