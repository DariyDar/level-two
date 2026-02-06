import './OrganTierCircles.css';

interface OrganTierCirclesProps {
  // Tier display
  maxTier: number;           // Maximum visible tiers (e.g., 5 for muscles)
  activeTier: number;        // Currently active tier (0 = none active)

  // Degradation
  degradedTiers: number;     // Number of degraded tiers (from left, 0-4)

  // Boost state
  isBoosted?: boolean;       // Fast Insulin active - shows boost color
  showBoostedTier?: boolean; // Show 6th tier circle (only when boosted to tier 6)

  // Layout
  size?: 'small' | 'normal';
  position?: 'top' | 'bottom';
}

/**
 * Unified tier indicator for organs
 *
 * Visual states (left to right):
 * - Degraded circles: bright pink (#ec4899)
 * - Healthy circles: orange (#f97316)
 * - Active tier circle: red-orange (#FF5900) + flashing animation
 * - When boosted: active tier uses boost color + flashing
 *
 * Example for maxTier=5, degradedTiers=2, activeTier=3:
 *   [pink][pink][orange][ACTIVE-orange][orange]
 *         ^degraded^     ^tier 3 flashing^
 */
export function OrganTierCircles({
  maxTier,
  activeTier,
  degradedTiers,
  isBoosted = false,
  showBoostedTier = false,
  size = 'normal',
  position = 'top',
}: OrganTierCirclesProps) {
  const circles = [];

  // Total circles to show (normally maxTier, +1 if boosted tier is visible)
  const totalCircles = showBoostedTier ? maxTier + 1 : maxTier;

  for (let i = 0; i < totalCircles; i++) {
    const tierNumber = i + 1; // Tiers are 1-indexed
    const isDegraded = i < degradedTiers;
    const isActive = tierNumber === activeTier;
    const isBoostedTier = i === maxTier; // The 6th circle (index 5 when maxTier=5)

    // Determine circle state
    let stateClass = '';
    if (isDegraded) {
      stateClass = 'organ-tier-circle--degraded';
    } else if (isActive) {
      stateClass = isBoosted
        ? 'organ-tier-circle--active-boosted'
        : 'organ-tier-circle--active';
    } else if (isBoostedTier) {
      stateClass = 'organ-tier-circle--boosted-tier';
    } else {
      stateClass = 'organ-tier-circle--healthy';
    }

    circles.push(
      <div
        key={i}
        className={`organ-tier-circle organ-tier-circle--${size} ${stateClass}`}
      />
    );
  }

  return (
    <div className={`organ-tier-circles organ-tier-circles--${position}`}>
      {circles}
    </div>
  );
}
