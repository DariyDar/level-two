import { DegradationCircles } from './DegradationCircles';
import './OrganSprite.css';

interface OrganSpriteProps {
  label: string;
  iconPath: string;
  value: number;
  isActive: boolean;
  degradation?: {
    tier: number;
    maxTier: number;
  };
  size?: 'small' | 'normal' | 'large';
}

export function OrganSprite({
  label,
  iconPath,
  value,
  isActive,
  degradation,
  size = 'normal',
}: OrganSpriteProps) {
  return (
    <div className={`organ-sprite organ-sprite--${size}`}>
      <div className={`organ-sprite__substrate ${isActive ? 'organ-sprite__substrate--active' : 'organ-sprite__substrate--inactive'}`}>
        <img
          src={iconPath}
          alt={label}
          className="organ-sprite__icon"
        />
      </div>

      <div className="organ-sprite__label">{label}</div>
      <div className="organ-sprite__value">{Math.round(value)}</div>

      {/* Degradation circles */}
      {degradation && degradation.maxTier > 0 && (
        <DegradationCircles
          tier={degradation.tier}
          maxTier={degradation.maxTier}
          size={size === 'large' ? 'normal' : 'small'}
        />
      )}
    </div>
  );
}
