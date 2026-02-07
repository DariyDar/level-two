import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { Ship } from '../../core/types';
import { useGameStore } from '../../store/gameStore';
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
  const showDetailedIndicators = useGameStore((s) => s.showDetailedIndicators);
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

  const wpCost = ship.wpCost ?? 0;

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

      {/* WP cost badge - top right */}
      {wpCost > 0 && (
        <span className="ship-card__badge ship-card__badge--wp">{wpCost}</span>
      )}

      {/* Fiber icon - bottom right */}
      {ship.fiber && (
        <span className="ship-card__badge ship-card__badge--fiber">🌿</span>
      )}

      {showDetails && (
        <div className="ship-card__details">
          <span className="ship-card__name">{ship.name}</span>
          <span className="ship-card__info">
            {ship.loadType === 'Glucose' ? `${ship.carbs ?? ship.load}g` : ''}
            {showDetailedIndicators && `${ship.loadType === 'Glucose' ? ' · ' : ''}${ship.size === 'S' ? 1 : ship.size === 'M' ? 2 : 3}h`}
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
  const showDetailedIndicators = useGameStore((s) => s.showDetailedIndicators);
  const wpCost = ship.wpCost ?? 0;

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

      {/* WP cost badge - top right */}
      {wpCost > 0 && (
        <span className="ship-card__badge ship-card__badge--wp">{wpCost}</span>
      )}

      {/* Fiber icon - bottom right */}
      {ship.fiber && (
        <span className="ship-card__badge ship-card__badge--fiber">🌿</span>
      )}

      <div className="ship-card__details">
        <span className="ship-card__name">{ship.name}</span>
        <span className="ship-card__info">
          {ship.loadType === 'Glucose' ? `${ship.carbs ?? ship.load}g` : ''}
          {showDetailedIndicators && `${ship.loadType === 'Glucose' ? ' · ' : ''}${ship.size === 'S' ? 1 : ship.size === 'M' ? 2 : 3}h`}
        </span>
      </div>
    </div>
  );
}
