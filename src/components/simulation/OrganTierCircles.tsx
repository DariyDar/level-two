import './OrganTierCircles.css';

interface OrganTierCirclesProps {
  // Tier display
  maxTier: number;           // Maximum visible tiers (e.g., 5 for muscles)
  activeTier: number;        // Currently active tier (0 = none active)

  // Degradation
  degradedTiers: number;     // Number of degraded tiers (from right, 0-4)

  // Boost state
  isBoosted?: boolean;       // Fast Insulin active - shows boost color
  showBoostedTier?: boolean; // Show 6th tier circle (only when boosted to tier 6)

  // Color scheme
  colorScheme?: 'orange' | 'green'; // Orange for muscles/pancreas, green for liver/kidneys

  // Layout
  size?: 'small' | 'normal';
  position?: 'top' | 'bottom';
}

/**
 * Unified tier indicator for organs
 *
 * Visual states (left to right):
 * - Active tier circles: ALL tiers up to and including activeTier flash
 * - Healthy circles: yellow (#E2BC28) or green (#22c55e)
 * - Degraded circles (from right): bright pink (#ec4899)
 * - When boosted: active tiers use boost color + flashing
 *
 * Example for maxTier=5, degradedTiers=2, activeTier=3:
 *   [FLASH][FLASH][FLASH][pink][pink]
 *   ^tiers 1-3 flashing^  ^degraded^
 */
export function OrganTierCircles({
  maxTier,
  activeTier,
  degradedTiers,
  isBoosted = false,
  showBoostedTier = false,
  colorScheme = 'orange',
  size = 'normal',
  position = 'top',
}: OrganTierCirclesProps) {
  const circles = [];

  // Total circles to show (normally maxTier, +1 if boosted tier is visible)
  const totalCircles = showBoostedTier ? maxTier + 1 : maxTier;

  for (let i = 0; i < totalCircles; i++) {
    const tierNumber = i + 1; // Tiers are 1-indexed
    const isDegraded = i >= maxTier - degradedTiers && i < maxTier;
    // Flash all tiers up to and including activeTier (but not degraded ones)
    const isActiveOrBelow = tierNumber <= activeTier && !isDegraded;
    const isBoostedTier = i === maxTier; // The 6th circle (index 5 when maxTier=5)

    // Determine circle state
    let stateClass = '';
    if (isDegraded) {
      stateClass = 'organ-tier-circle--degraded';
    } else if (isActiveOrBelow) {
      stateClass = isBoosted
        ? 'organ-tier-circle--active-boosted'
        : 'organ-tier-circle--active';
    } else if (isBoostedTier && showBoostedTier) {
      stateClass = 'organ-tier-circle--boosted-tier';
    } else {
      // Healthy state - use color scheme
      stateClass = colorScheme === 'green'
        ? 'organ-tier-circle--healthy-green'
        : 'organ-tier-circle--healthy';
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
