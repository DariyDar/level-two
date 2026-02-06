import { OrganTierCircles } from './OrganTierCircles';
import './OrganSprite.css';

interface OrganSpriteProps {
  label: string;
  iconPath: string;
  isActive: boolean;

  // Unified tier indicator (new system)
  tierConfig?: {
    maxTier: number;        // Maximum visible tiers (5 for pancreas/muscles)
    activeTier: number;     // Currently active tier (0 = none)
    degradedTiers: number;  // Number of degraded tiers from left
    isBoosted?: boolean;    // Fast Insulin active
    showBoostedTier?: boolean; // Show 6th tier (for muscles when tier 6)
    position?: 'top' | 'bottom';
    colorScheme?: 'orange' | 'green'; // orange for muscles/pancreas, green for liver/kidneys
  };

  // Legacy props (for backward compatibility during transition)
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
  tierConfig,
  degradation,
  tierIndicator,
  size = 'normal',
}: OrganSpriteProps) {
  // Use new unified tier system if provided
  const useNewSystem = !!tierConfig;

  return (
    <div className={`organ-sprite organ-sprite--${size}`}>
      {/* New unified tier circles (top position) */}
      {useNewSystem && tierConfig.position !== 'bottom' && (
        <OrganTierCircles
          maxTier={tierConfig.maxTier}
          activeTier={tierConfig.activeTier}
          degradedTiers={tierConfig.degradedTiers}
          isBoosted={tierConfig.isBoosted}
          showBoostedTier={tierConfig.showBoostedTier}
          colorScheme={tierConfig.colorScheme}
          size={size === 'large' ? 'normal' : 'small'}
          position="top"
        />
      )}

      {/* Legacy tier circles above (for muscles) - fallback */}
      {!useNewSystem && tierIndicator && tierIndicator.maxTier > 0 && (
        <OrganTierCircles
          maxTier={tierIndicator.maxTier}
          activeTier={tierIndicator.tier}
          degradedTiers={0}
          size={size === 'large' ? 'normal' : 'small'}
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

      {/* New unified tier circles (bottom position) */}
      {useNewSystem && tierConfig.position === 'bottom' && (
        <OrganTierCircles
          maxTier={tierConfig.maxTier}
          activeTier={tierConfig.activeTier}
          degradedTiers={tierConfig.degradedTiers}
          isBoosted={tierConfig.isBoosted}
          showBoostedTier={tierConfig.showBoostedTier}
          colorScheme={tierConfig.colorScheme}
          size={size === 'large' ? 'normal' : 'small'}
          position="bottom"
        />
      )}

      {/* Legacy degradation circles below (for liver/pancreas) - fallback */}
      {!useNewSystem && degradation && degradation.maxTier > 0 && (
        <OrganTierCircles
          maxTier={degradation.maxTier}
          activeTier={0}
          degradedTiers={degradation.tier - 1} // tier 1 = 0 degraded, tier 5 = 4 degraded
          size={size === 'large' ? 'normal' : 'small'}
          position="bottom"
        />
      )}
    </div>
  );
}
