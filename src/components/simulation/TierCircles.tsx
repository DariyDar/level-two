import './TierCircles.css';

interface TierCirclesProps {
  tier: number;
  maxTier: number;
  position?: 'top' | 'bottom';
}

export function TierCircles({ tier, maxTier, position = 'top' }: TierCirclesProps) {
  const circles = [];

  for (let i = 0; i < maxTier; i++) {
    const isFilled = i < tier;
    circles.push(
      <div
        key={i}
        className={`tier-circle ${isFilled ? 'tier-circle--filled' : 'tier-circle--empty'}`}
      />
    );
  }

  return (
    <div className={`tier-circles tier-circles--${position}`}>
      {circles}
    </div>
  );
}
