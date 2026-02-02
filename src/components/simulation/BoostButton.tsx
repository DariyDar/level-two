import type { BoostState } from '../../core/simulation';
import './BoostButton.css';

interface BoostButtonProps {
  label: string;
  emoji: string;
  boost: BoostState;
  cooldownMax: number;
  onActivate: () => void;
}

export function BoostButton({
  label,
  emoji,
  boost,
  cooldownMax,
  onActivate,
}: BoostButtonProps) {
  const { charges, maxCharges, cooldownTicks, isActive } = boost;

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
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={onActivate}
      disabled={!canActivate}
    >
      <span className="boost-button__emoji">{emoji}</span>
      <span className="boost-button__label">{label}</span>

      <div className="boost-button__charges">
        {Array.from({ length: maxCharges }).map((_, i) => (
          <span
            key={i}
            className={`boost-button__charge ${i < charges ? 'boost-button__charge--filled' : ''}`}
          />
        ))}
      </div>

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
