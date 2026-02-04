// Helper to determine muscle tier from rate
// Tiers: [0, 20, 30, 50, 70, 90]
export function getMuscleTierFromRate(rate: number): number {
  if (rate === 0) return 0;
  if (rate <= 20) return 1;
  if (rate <= 30) return 2;
  if (rate <= 50) return 3;
  if (rate <= 70) return 4;
  return 5;
}
