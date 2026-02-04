import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { Ship } from '../../core/types';
import { SHIP_SIZE_TO_SLOTS } from '../../core/types';
import './ShipCard.css';

interface ShipCardProps {
  ship: Ship;
  instanceId?: string;
  isPlaced?: boolean;
  isPreOccupied?: boolean;
  remainingCount?: number;
  showDetails?: boolean;
}

export function ShipCard({
  ship,
  instanceId,
  isPlaced = false,
  isPreOccupied = false,
  remainingCount,
  showDetails = false,
}: ShipCardProps) {
  const draggableId = instanceId ?? `inventory-${ship.id}`;

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: draggableId,
    disabled: isPreOccupied,
    data: {
      ship,
      isPlaced,
      instanceId,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
  };

  const slotsRequired = SHIP_SIZE_TO_SLOTS[ship.size];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        'ship-card',
        `ship-card--size-${ship.size.toLowerCase()}`,
        `ship-card--type-${ship.loadType.toLowerCase()}`,
        isPlaced && 'ship-card--placed',
        isPreOccupied && 'ship-card--locked',
        isDragging && 'ship-card--dragging',
      ]
        .filter(Boolean)
        .join(' ')}
      {...listeners}
      {...attributes}
    >
      <span className="ship-card__emoji">{ship.emoji}</span>

      {showDetails && (
        <div className="ship-card__details">
          <span className="ship-card__name">{ship.name}</span>
          <span className="ship-card__info">
            {ship.carbs ?? ship.load}g • {slotsRequired}h
          </span>
        </div>
      )}

      {remainingCount !== undefined && remainingCount < 99 && (
        <span className="ship-card__count">×{remainingCount}</span>
      )}
    </div>
  );
}

// Drag overlay version (no drag handlers)
export function ShipCardOverlay({ ship }: { ship: Ship }) {
  const slotsRequired = SHIP_SIZE_TO_SLOTS[ship.size];

  return (
    <div
      className={[
        'ship-card',
        'ship-card--overlay',
        `ship-card--size-${ship.size.toLowerCase()}`,
        `ship-card--type-${ship.loadType.toLowerCase()}`,
      ].join(' ')}
    >
      <span className="ship-card__emoji">{ship.emoji}</span>
      <div className="ship-card__details">
        <span className="ship-card__name">{ship.name}</span>
        <span className="ship-card__info">
          {ship.carbs ?? ship.load}g • {slotsRequired}h
        </span>
      </div>
    </div>
  );
}
