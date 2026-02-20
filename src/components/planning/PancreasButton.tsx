import type { PancreasTier } from '../../core/types';
import { PANCREAS_TIERS, PANCREAS_TOTAL_BARS } from '../../core/types';
import './PancreasButton.css';

interface PancreasButtonProps {
  currentTier: PancreasTier;
  barsAvailable: number;
  onCycle: () => void;
  disabled?: boolean;
}

export function PancreasButton({
  currentTier,
  barsAvailable,
  onCycle,
  disabled = false,
}: PancreasButtonProps) {
  const tierInfo = PANCREAS_TIERS[currentTier];
  const barsUsed = tierInfo.cost;

  return (
    <div
      className={`pancreas-button ${disabled ? 'pancreas-button--disabled' : ''}`}
      onClick={disabled ? undefined : onCycle}
      title={`Pancreas naturally digests glucose over time. Tier ${tierInfo.label}${tierInfo.cost > 0 ? ` (${tierInfo.cost} bar${tierInfo.cost > 1 ? 's' : ''})` : ''} — tap to change`}
    >
      <div className="pancreas-button__header">
        <span className="pancreas-button__emoji">{'\uD83E\uDEC1'}</span>
        <span className="pancreas-button__label">Pancreas</span>
        <span className="pancreas-button__tier">
          {tierInfo.label}
        </span>
      </div>

      <div className="pancreas-button__battery">
        {([1, 2, 3] as const).map(seg => {
          const isActive = seg <= currentTier;
          const segTier = seg as PancreasTier;
          const segCost = PANCREAS_TIERS[segTier].cost;
          const canAfford = segCost <= barsAvailable + barsUsed;
          return (
            <div
              key={seg}
              className={`pancreas-button__segment ${
                isActive ? 'pancreas-button__segment--active' : ''
              } ${!canAfford ? 'pancreas-button__segment--locked' : ''}`}
            />
          );
        })}
        <div className="pancreas-button__battery-nub" />
      </div>

      <div className="pancreas-button__bars">
        {Array.from({ length: PANCREAS_TOTAL_BARS }, (_, i) => (
          <span
            key={i}
            className={`pancreas-button__bar-dot ${i < barsUsed ? 'pancreas-button__bar-dot--used' : ''}`}
          >
            {i < barsUsed ? '\u25CF' : '\u25CB'}
          </span>
        ))}
      </div>
    </div>
  );
}
