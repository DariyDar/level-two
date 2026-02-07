import type { PlanValidation } from '../../core/types';
import './PlanningHeader.css';

interface PlanningHeaderProps {
  currentBG: number;
  wpRemaining: number;
  wpBudget: number;
  validation: PlanValidation;
  onSimulate: () => void;
}

export function PlanningHeader({
  currentBG,
  wpRemaining,
  wpBudget,
  validation,
  onSimulate,
}: PlanningHeaderProps) {
  const { totalCarbs, isValid, warnings } = validation;

  return (
    <div className="planning-header">
      <div className="planning-header__bg">
        <span className="planning-header__label">BG</span>
        <span className="planning-header__value">{currentBG}</span>
      </div>

      <div className="planning-header__wp">
        <span className="planning-header__label">WP</span>
        <span className={`planning-header__value ${wpRemaining <= 0 ? 'planning-header__value--depleted' : ''}`}>
          {wpRemaining}/{wpBudget}
        </span>
      </div>

      <div className="planning-header__carbs">
        <div className="planning-header__carbs-label">
          <span>Carbs</span>
          <span className="planning-header__carbs-value">
            {totalCarbs}g
          </span>
        </div>
        {warnings.length > 0 && (
          <span className="planning-header__warning">{warnings[0]}</span>
        )}
      </div>

      <button
        className="planning-header__simulate"
        onClick={onSimulate}
        disabled={!isValid}
      >
        Simulate
      </button>
    </div>
  );
}
