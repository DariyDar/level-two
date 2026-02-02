import { useDroppable } from '@dnd-kit/core';
import type { Ship, PlacedShip } from '../../core/types';
import { ShipCard } from './ShipCard';
import './Slot.css';

interface SlotProps {
  slotNumber: number; // 1-18
  placedShip?: PlacedShip;
  ship?: Ship;
  isOccupied: boolean;
  isPreOccupied: boolean;
  canDrop: boolean;
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
  isHighlighted,
  isPartOfShip,
}: SlotProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `slot-${slotNumber}`,
    disabled: isOccupied || isPartOfShip,
    data: { slotNumber },
  });

  const showShip = placedShip && ship && !isPartOfShip;

  return (
    <div
      ref={setNodeRef}
      className={[
        'slot',
        isOccupied && 'slot--occupied',
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
    </div>
  );
}
