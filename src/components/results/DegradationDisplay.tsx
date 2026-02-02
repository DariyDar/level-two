import type { SimpleDegradation } from '../../core/types';
import './DegradationDisplay.css';

interface DegradationDisplayProps {
  currentDegradation: SimpleDegradation;
  addedDegradation: SimpleDegradation;
}

export function DegradationDisplay({
  currentDegradation,
  addedDegradation,
}: DegradationDisplayProps) {
  const hasNewDamage = addedDegradation.liver > 0 || addedDegradation.pancreas > 0;

  return (
    <div className="degradation-display">
      <h3 className="degradation-display__title">
        {hasNewDamage ? '⚠️ Organ Stress' : '✅ Organs Healthy'}
      </h3>

      <div className="degradation-display__organs">
        <OrganBar
          label="Liver"
          emoji="🫀"
          current={currentDegradation.liver}
          added={addedDegradation.liver}
        />
        <OrganBar
          label="Pancreas"
          emoji="🫁"
          current={currentDegradation.pancreas}
          added={addedDegradation.pancreas}
        />
      </div>

      {hasNewDamage && (
        <p className="degradation-display__warning">
          High blood glucose caused +{addedDegradation.liver + addedDegradation.pancreas}% organ stress today.
        </p>
      )}
    </div>
  );
}

interface OrganBarProps {
  label: string;
  emoji: string;
  current: number;
  added: number;
}

function OrganBar({ label, emoji, current, added }: OrganBarProps) {
  const total = current + added;
  const previousWidth = Math.min(current, 100);
  const addedWidth = Math.min(added, 100 - previousWidth);

  return (
    <div className="organ-bar">
      <div className="organ-bar__header">
        <span className="organ-bar__emoji">{emoji}</span>
        <span className="organ-bar__label">{label}</span>
        <span className="organ-bar__value">
          {total}%
          {added > 0 && <span className="organ-bar__added">(+{added})</span>}
        </span>
      </div>
      <div className="organ-bar__track">
        <div
          className="organ-bar__fill organ-bar__fill--previous"
          style={{ width: `${previousWidth}%` }}
        />
        <div
          className="organ-bar__fill organ-bar__fill--added"
          style={{ width: `${addedWidth}%`, left: `${previousWidth}%` }}
        />
      </div>
    </div>
  );
}
