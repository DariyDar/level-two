import type { PlanValidation } from '../../core/types';
import './PlanningHeader.css';

interface PlanningHeaderProps {
  currentBG: number;
  validation: PlanValidation;
  onSimulate: () => void;
}

export function PlanningHeader({
  currentBG,
  validation,
  onSimulate,
}: PlanningHeaderProps) {
  const { totalCarbs, minCarbs, maxCarbs, isValid, warnings } = validation;

  // Calculate progress percentage
  const progressPercent = Math.min((totalCarbs / maxCarbs) * 100, 100);
  const minThreshold = (minCarbs / maxCarbs) * 100;

  // Determine bar color
  let barColor = '#4a5568'; // Gray - not enough
  if (totalCarbs >= minCarbs && totalCarbs <= maxCarbs) {
    barColor = '#48bb78'; // Green - optimal
  } else if (totalCarbs > maxCarbs) {
    barColor = '#fc8181'; // Red - too much
  }

  return (
    <div className="planning-header">
      <div className="planning-header__bg">
        <span className="planning-header__label">BG</span>
        <span className="planning-header__value">{currentBG}</span>
      </div>

      <div className="planning-header__carbs">
        <div className="planning-header__carbs-label">
          <span>Carbs</span>
          <span className="planning-header__carbs-value">
            {totalCarbs}g / {minCarbs}-{maxCarbs}g
          </span>
        </div>
        <div className="planning-header__progress-container">
          <div
            className="planning-header__progress-min"
            style={{ left: `${minThreshold}%` }}
          />
          <div
            className="planning-header__progress-bar"
            style={{
              width: `${progressPercent}%`,
              backgroundColor: barColor,
            }}
          />
        </div>
        {warnings.length > 0 && (
          <span className="planning-header__warning">⚠️ {warnings[0]}</span>
        )}
      </div>

      <button
        className="planning-header__simulate"
        onClick={onSimulate}
        disabled={!isValid}
      >
        Simulate ▶
      </button>
    </div>
  );
}
