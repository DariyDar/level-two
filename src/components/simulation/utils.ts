// Helper to determine muscle tier from rate
// Tiers match organRules.json rates: [0, 35, 40, 45, 50, 55]
export function getMuscleTierFromRate(rate: number): number {
  if (rate === 0) return 0;
  if (rate <= 35) return 1;
  if (rate <= 40) return 2;
  if (rate <= 45) return 3;
  if (rate <= 50) return 4;
  return 5;
}
