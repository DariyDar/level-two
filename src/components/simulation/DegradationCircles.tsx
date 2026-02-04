import './DegradationCircles.css';

interface DegradationCirclesProps {
  tier: number;        // Current degradation tier (0-5 for liver, 0-4 for pancreas)
  maxTier: number;     // Maximum tier (5 for liver, 4 for pancreas)
  size?: 'small' | 'normal';
}

export function DegradationCircles({ tier, maxTier, size = 'normal' }: DegradationCirclesProps) {
  const circles = [];

  // Generate circles: first 'tier' circles are degraded (pink), rest are healthy (green)
  for (let i = 0; i < maxTier; i++) {
    const isDegraded = i < tier;
    circles.push(
      <div
        key={i}
        className={`degradation-circle ${isDegraded ? 'degradation-circle--degraded' : 'degradation-circle--healthy'} degradation-circle--${size}`}
      />
    );
  }

  return (
    <div className="degradation-circles">
      {circles}
    </div>
  );
}
