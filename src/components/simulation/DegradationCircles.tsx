import './DegradationCircles.css';

interface DegradationCirclesProps {
  tier: number;        // Current degradation tier (1-5, where 1 is healthy/non-burnable)
  maxTier: number;     // Number of burnable circles to display (4 for both organs)
  size?: 'small' | 'normal';
}

export function DegradationCircles({ tier, maxTier, size = 'normal' }: DegradationCirclesProps) {
  const circles = [];

  // Generate circles: tier 1 = all healthy, tier 5 = all degraded
  // degradedCount = tier - 1 (tier 1 = 0 degraded, tier 5 = 4 degraded)
  const degradedCount = tier - 1;
  for (let i = 0; i < maxTier; i++) {
    const isDegraded = i < degradedCount;
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
