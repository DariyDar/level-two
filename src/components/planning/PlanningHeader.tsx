import type { GameSettings } from '../../core/types';
import { getKcalAssessment } from '../../core/types';
import './PlanningHeader.css';

interface PlanningHeaderProps {
  dayLabel: string;
  kcalUsed: number;
  kcalBudget: number;
  wpUsed: number;
  wpBudget: number;
  settings: GameSettings;
  onToggleTimeFormat: () => void;
  onToggleBgUnit: () => void;
}

export function PlanningHeader({
  dayLabel,
  kcalUsed,
  kcalBudget,
  wpUsed,
  wpBudget,
  settings,
  onToggleTimeFormat,
  onToggleBgUnit,
}: PlanningHeaderProps) {
  const assessment = getKcalAssessment(kcalUsed, kcalBudget);
  const wpOver = wpUsed > wpBudget;

  return (
    <div className="planning-header">
      <div className="planning-header__day">{dayLabel}</div>

      <div className="planning-header__wp">
        <span className="planning-header__wp-label">WP</span>
        <span className={`planning-header__wp-value ${wpOver ? 'planning-header__wp-value--over' : ''}`}>
          {wpUsed}/{wpBudget}
        </span>
        <span className="planning-header__wp-icon">☀️</span>
      </div>

      <div className="planning-header__kcal">
        <span className="planning-header__kcal-value">{kcalUsed}</span>
        <span className="planning-header__kcal-unit">kcal</span>
        <span className="planning-header__kcal-dash">—</span>
        <span
          className="planning-header__kcal-assessment"
          style={{ color: assessment.color }}
        >
          {assessment.label}
        </span>
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
