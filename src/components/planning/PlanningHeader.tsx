import './PlanningHeader.css';

interface PlanningHeaderProps {
  currentBG: number;
  wpRemaining: number;
  wpBudget: number;
  isValid: boolean;
  onSimulate: () => void;
}

export function PlanningHeader({
  currentBG,
  wpRemaining,
  wpBudget,
  isValid,
  onSimulate,
}: PlanningHeaderProps) {
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
