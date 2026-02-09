import { useState, useEffect, useCallback } from 'react';
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
  const [justActivated, setJustActivated] = useState(false);

  const canActivate = charges > 0 && cooldownTicks === 0 && !isActive;
  const cooldownPercent = cooldownMax > 0
    ? ((cooldownMax - cooldownTicks) / cooldownMax) * 100
    : 100;

  // Reset justActivated after 1.5s
  useEffect(() => {
    if (!justActivated) return;
    const timer = setTimeout(() => setJustActivated(false), 1500);
    return () => clearTimeout(timer);
  }, [justActivated]);

  const handleClick = useCallback(() => {
    onActivate();
    setJustActivated(true);
  }, [onActivate]);

  return (
    <button
      className={[
        'boost-button',
        isActive && 'boost-button--active',
        !canActivate && 'boost-button--disabled',
        isFastInsulin && 'boost-button--fast-insulin',
        justActivated && 'boost-button--injecting',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={handleClick}
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

      {/* Floating injection confirmation text */}
      {justActivated && (
        <span className="boost-button__inject-text">Инсулин введён!</span>
      )}
    </button>
  );
}
