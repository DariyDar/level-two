import type { GameSettings, MedicationModifiers } from '../../core/types';
import { getKcalAssessment, DEFAULT_MEDICATION_MODIFIERS } from '../../core/types';
import './PlanningHeader.css';

interface PlanningHeaderProps {
  dayLabel: string;
  kcalUsed: number;
  kcalBudget: number;
  wpUsed: number;
  wpBudget: number;
  settings: GameSettings;
  medicationModifiers?: MedicationModifiers;
  submitEnabled: boolean;
  onSubmit: () => void;
  onToggleTimeFormat: () => void;
  onToggleBgUnit: () => void;
  onToggleDecay: () => void;
}

export function PlanningHeader({
  dayLabel,
  kcalUsed,
  kcalBudget,
  wpUsed,
  wpBudget,
  settings,
  medicationModifiers = DEFAULT_MEDICATION_MODIFIERS,
  submitEnabled,
  onSubmit,
  onToggleTimeFormat,
  onToggleBgUnit,
  onToggleDecay,
}: PlanningHeaderProps) {
  const effectiveKcalBudget = Math.round(kcalBudget * medicationModifiers.kcalMultiplier);
  const effectiveWpBudget = wpBudget + medicationModifiers.wpBonus;
  const assessment = getKcalAssessment(kcalUsed, effectiveKcalBudget);
  const wpOver = wpUsed > effectiveWpBudget;
  const hasKcalMod = medicationModifiers.kcalMultiplier !== 1;
  const hasWpMod = medicationModifiers.wpBonus !== 0;

  return (
    <div className="planning-header">
      <div className="planning-header__day">{dayLabel}</div>

      <div className="planning-header__wp">
        <span className="planning-header__wp-label">WP</span>
        <span className={`planning-header__wp-value ${wpOver ? 'planning-header__wp-value--over' : ''}`}>
          {wpUsed}/{effectiveWpBudget}
          {hasWpMod && <span className="planning-header__wp-bonus"> (+{medicationModifiers.wpBonus})</span>}
        </span>
        <span className="planning-header__wp-icon">{'\u2600\uFE0F'}</span>
      </div>

      <div className="planning-header__kcal">
        <span className="planning-header__kcal-value">{kcalUsed}</span>
        <span className="planning-header__kcal-unit">
          /{effectiveKcalBudget} kcal
          {hasKcalMod && <span className="planning-header__kcal-mod"> ({Math.round(medicationModifiers.kcalMultiplier * 100)}%)</span>}
        </span>
        <span className="planning-header__kcal-dash">{'\u2014'}</span>
        <span
          className="planning-header__kcal-assessment"
          style={{ color: assessment.color }}
        >
          {assessment.label}
        </span>
      </div>

      <button
        className={`planning-header__submit ${submitEnabled ? '' : 'planning-header__submit--disabled'}`}
        onClick={onSubmit}
        disabled={!submitEnabled}
        title={submitEnabled ? 'Submit your meal plan' : 'Eat at least Light to submit'}
      >
        Submit
      </button>

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
        <button
          className={`planning-header__toggle ${settings.decayEnabled ? 'planning-header__toggle--active' : ''}`}
          onClick={onToggleDecay}
          title="Toggle glucose decay (restarts game)"
        >
          {settings.decayEnabled ? 'Decay ON' : 'Decay OFF'}
        </button>
      </div>
    </div>
  );
}
