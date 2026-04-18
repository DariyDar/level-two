import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { Medication } from '../../core/types';
import './InterventionCard.css';

interface MedicationCardProps {
  medication: Medication;
  instanceId?: string;
  isLocked?: boolean;
  isPlaced?: boolean;
  onTap?: () => void;
}

export function MedicationCard({
  medication,
  instanceId,
  isLocked = false,
  isPlaced = false,
  onTap,
}: MedicationCardProps) {
  const draggableId = instanceId ?? `medication-${medication.id}`;
  const disabled = isLocked || isPlaced;

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: draggableId,
    disabled,
    data: {
      medication,
      isMedication: true,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        'intervention-card',
        'intervention-card--medication',
        isDragging && 'intervention-card--dragging',
        isLocked && 'intervention-card--locked',
        isPlaced && 'intervention-card--placed',
        disabled && !isPlaced && 'intervention-card--disabled',
      ]
        .filter(Boolean)
        .join(' ')}
      data-medication={medication.id}
      data-tooltip={medication.description}
      onClick={!disabled && onTap ? onTap : undefined}
      {...(disabled ? {} : listeners)}
      {...attributes}
    >
      {isLocked && <span className="intervention-card__lock">🔒</span>}
      {isPlaced && <span className="intervention-card__placed-mark">✓</span>}

      <span className="intervention-card__emoji">{medication.emoji}</span>

      <div className="intervention-card__details">
        <span className="intervention-card__name">{medication.name}</span>
        <span className="intervention-card__info">
          {isPlaced ? 'Active' : 'Drag to slot'}
        </span>
      </div>
    </div>
  );
}

// Drag overlay version
export function MedicationCardOverlay({ medication }: { medication: Medication }) {
  return (
    <div className="intervention-card intervention-card--medication intervention-card--overlay">
      <span className="intervention-card__emoji">{medication.emoji}</span>
      <div className="intervention-card__details">
        <span className="intervention-card__name">{medication.name}</span>
        <span className="intervention-card__info">Drag to slot</span>
      </div>
    </div>
  );
}
