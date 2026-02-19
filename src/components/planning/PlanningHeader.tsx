import type { GameSettings } from '../../core/types';
import './PlanningHeader.css';

interface PlanningHeaderProps {
  dayLabel: string;
  kcalUsed: number;
  kcalBudget: number;
  settings: GameSettings;
  onToggleTimeFormat: () => void;
  onToggleBgUnit: () => void;
}

export function PlanningHeader({
  dayLabel,
  kcalUsed,
  kcalBudget,
  settings,
  onToggleTimeFormat,
  onToggleBgUnit,
}: PlanningHeaderProps) {
  const kcalOver = kcalUsed > kcalBudget;
  const kcalPercent = Math.min(100, (kcalUsed / kcalBudget) * 100);

  return (
    <div className="planning-header">
      <div className="planning-header__day">{dayLabel}</div>

      <div className="planning-header__kcal">
        <div className="planning-header__kcal-label">
          <span className={`planning-header__kcal-value ${kcalOver ? 'planning-header__kcal-value--over' : ''}`}>
            {kcalUsed}
          </span>
          <span className="planning-header__kcal-divider">/</span>
          <span className="planning-header__kcal-budget">{kcalBudget}</span>
          <span className="planning-header__kcal-unit">kcal</span>
        </div>
        <div className="planning-header__kcal-bar">
          <div
            className={`planning-header__kcal-fill ${kcalOver ? 'planning-header__kcal-fill--over' : ''}`}
            style={{ width: `${kcalPercent}%` }}
          />
        </div>
      </div>

      <div className="planning-header__settings">
        <button
          className="planning-header__toggle"
          onClick={onToggleTimeFormat}
          title="Toggle time format"
        >
          {settings.timeFormat}
        </button>
        <button
          className="planning-header__toggle"
          onClick={onToggleBgUnit}
          title="Toggle BG unit"
        >
          {settings.bgUnit}
        </button>
      </div>
    </div>
  );
}
