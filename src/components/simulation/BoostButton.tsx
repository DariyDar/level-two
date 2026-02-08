import type { BoostState } from '../../core/simulation';
import './BoostButton.css';

interface BoostButtonProps {
  label: string;
  emoji: string;
  boost: BoostState;
  cooldownMax: number;
  onActivate: () => void;
  isFastInsulin?: boolean; // Special styling for Fast Insulin
}

export function BoostButton({
  label,
  emoji,
  boost,
  cooldownMax,
  onActivate,
  isFastInsulin = false,
}: BoostButtonProps) {
  const { charges, cooldownTicks, isActive } = boost;

  const canActivate = charges > 0 && cooldownTicks === 0 && !isActive;
  const cooldownPercent = cooldownMax > 0
    ? ((cooldownMax - cooldownTicks) / cooldownMax) * 100
    : 100;

  return (
    <button
      className={[
        'boost-button',
        isActive && 'boost-button--active',
        !canActivate && 'boost-button--disabled',
        isFastInsulin && 'boost-button--fast-insulin',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={onActivate}
      disabled={!canActivate}
    >
      {/* Usage count badge - top right */}
      <span className="boost-button__count">{charges}</span>

      <span className="boost-button__emoji">{emoji}</span>
      <span className="boost-button__label">{label}</span>

      <div className="boost-button__cooldown-bar">
        <div
          className="boost-button__cooldown-fill"
          style={{ width: `${cooldownPercent}%` }}
        />
      </div>

      {cooldownTicks > 0 && (
        <span className="boost-button__cooldown-text">{cooldownTicks}h</span>
      )}
    </button>
  );
}
