import { DegradationCircles } from './DegradationCircles';
import { TierCircles } from './TierCircles';
import './OrganSprite.css';

interface OrganSpriteProps {
  label: string;
  iconPath: string;
  isActive: boolean;
  degradation?: {
    tier: number;
    maxTier: number;
  };
  tierIndicator?: {
    tier: number;
    maxTier: number;
  };
  size?: 'small' | 'normal' | 'large';
}

export function OrganSprite({
  label,
  iconPath,
  isActive,
  degradation,
  tierIndicator,
  size = 'normal',
}: OrganSpriteProps) {
  return (
    <div className={`organ-sprite organ-sprite--${size}`}>
      {/* Tier circles above (for muscles) */}
      {tierIndicator && tierIndicator.maxTier > 0 && (
        <TierCircles
          tier={tierIndicator.tier}
          maxTier={tierIndicator.maxTier}
          position="top"
        />
      )}

      {/* Icon substrate with label */}
      <div className={`organ-sprite__substrate ${isActive ? 'organ-sprite__substrate--active' : 'organ-sprite__substrate--inactive'}`}>
        <img
          src={iconPath}
          alt={label}
          className="organ-sprite__icon"
        />
        {label && <div className="organ-sprite__label">{label}</div>}
      </div>

      {/* Degradation circles below (for liver/pancreas) */}
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
