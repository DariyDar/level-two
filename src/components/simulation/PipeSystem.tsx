import './PipeSystem.css';

interface PipeSystemProps {
  // Ship → Liver: which slot (0, 1, 2) is active, null if none
  activeShipSlot: number | null;
  shipUnloadingRate: number;

  // Liver → BG
  liverToBgRate: number;
  isLiverPassthrough: boolean;

  // BG → Muscles
  bgToMusclesRate: number;

  // BG → Kidneys
  bgToKidneysRate: number;

  // Pancreas → Muscles (insulin)
  pancreasTier: number; // 0 = inactive

  speed: number;
  isPaused: boolean;
}

// Pipe route definitions (SVG path data in viewBox 0 0 100 100)
// All paths drawn in flow direction for correct arrow animation

// Ship slot pipes: from ship slot positions up to liver container
// Slot X positions match ship queue grid (3 columns: ~18%, ~50%, ~82%)
// Each pipe routes vertically up then horizontally into the liver container bottom (~y47)
// Staggered horizontal routing levels (y52, y55, y58) to avoid overlap
const SHIP_PIPES = [
  // Slot 0 (left): fully vertical into LC
  'M 18,73 L 18,47',
  // Slot 1 (center): up from x≈50, turn left into LC
  'M 50,73 L 50,55 L 23,55 L 23,47',
  // Slot 2 (right): up from x≈82, turn left into LC
  'M 82,73 L 82,58 L 28,58 L 28,47',
];

// Liver → BG: normal pipe (lower horizontal)
const LIVER_TO_BG_NORMAL = 'M 35,40 L 47,40';

// Liver → BG: passthrough pipe (upper horizontal, wider)
const LIVER_TO_BG_PASSTHROUGH = 'M 35,37 L 47,37';

// BG → Kidneys: horizontal left from BG to KC
const BG_TO_KIDNEYS = 'M 47,15 L 33,15';

// BG → Muscles: horizontal right from BG to muscles
const BG_TO_MUSCLES = 'M 63,15 L 78,15';

// Pancreas → Muscles: vertical orange pipe (insulin signal, centered on pancreas backdrop)
const PANCREAS_TO_MUSCLES = 'M 82.5,39 L 82.5,18';

// Stroke widths (pixels, thanks to non-scaling-stroke)
// Wall visible edge = (WALL - FILL) / 2 = 2px — matches container border: 2px
const WALL_WIDTH = 12;
const FILL_WIDTH = 8;

// Passthrough is wider (same 2px wall edge)
const PT_WALL_WIDTH = 20;
const PT_FILL_WIDTH = 16;

// Number of chevron indicators per pipe
const CHEVRON_COUNT = 3;

// Convert rate to animation duration (higher rate = faster arrows)
function rateToDuration(rate: number): string {
  if (rate <= 0) return '2s';
  // Map: 25/h → 2s, 100/h → 0.8s, 175/h → 0.4s
  const duration = Math.max(0.3, 2.5 - rate / 70);
  return `${duration.toFixed(2)}s`;
}

function tierToDuration(tier: number): string {
  if (tier <= 0) return '2s';
  // Tier 1 → 2s, Tier 4 → 0.5s
  const duration = Math.max(0.4, 2.5 - tier * 0.5);
  return `${duration.toFixed(2)}s`;
}

// Animated chevron flow along a pipe path
function ChevronFlow({
  path,
  flowDuration,
  isPaused,
}: {
  path: string;
  flowDuration: string;
  isPaused: boolean;
}) {
  const dur = parseFloat(flowDuration);

  return (
    <g>
      {Array.from({ length: CHEVRON_COUNT }, (_, i) => (
        <polyline
          key={i}
          points="-0.8,-0.5 0.8,0 -0.8,0.5"
          className={`pipe-chevron ${isPaused ? 'pipe-chevron--paused' : ''}`}
          style={{
            offsetPath: `path('${path}')`,
            animationDuration: flowDuration,
            animationDelay: `${-(i / CHEVRON_COUNT) * dur}s`,
          } as React.CSSProperties}
        />
      ))}
    </g>
  );
}

interface PipeProps {
  path: string;
  active: boolean;
  type: 'glucose' | 'insulin';
  flowDuration: string;
  isPaused: boolean;
  wallWidth?: number;
  fillWidth?: number;
}

function Pipe({
  path,
  active,
  type,
  flowDuration,
  isPaused,
  wallWidth = WALL_WIDTH,
  fillWidth = FILL_WIDTH,
}: PipeProps) {
  const fillClass = active
    ? `pipe-fill pipe-fill--${type}`
    : 'pipe-fill';

  return (
    <g>
      {/* Pipe wall — always visible */}
      <path d={path} className="pipe-wall" strokeWidth={wallWidth} />
      {/* Inner fill */}
      <path d={path} className={fillClass} strokeWidth={fillWidth} />
      {/* Chevron flow indicators */}
      {active && (
        <ChevronFlow
          path={path}
          flowDuration={flowDuration}
          isPaused={isPaused}
        />
      )}
    </g>
  );
}

export function PipeSystem({
  activeShipSlot,
  shipUnloadingRate,
  liverToBgRate,
  isLiverPassthrough,
  bgToMusclesRate,
  bgToKidneysRate,
  pancreasTier,
  speed,
  isPaused,
}: PipeSystemProps) {
  const shipDuration = rateToDuration(shipUnloadingRate * speed);
  const liverDuration = rateToDuration(liverToBgRate * speed);
  const musclesDuration = rateToDuration(bgToMusclesRate * speed);
  const kidneysDuration = rateToDuration(bgToKidneysRate * speed);
  const insulinDuration = tierToDuration(pancreasTier);

  return (
    <div className="pipe-system">
      <svg
        className="pipe-system__svg"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {/* === Ship → Liver pipes (3) === */}
        {/* Render order [0, 2, 1]: center pipe (slot 1) on top of right pipe (slot 2) */}
        {[0, 2, 1].map((i) => (
          <Pipe
            key={`ship-${i}`}
            path={SHIP_PIPES[i]}
            active={activeShipSlot === i}
            type="glucose"
            flowDuration={shipDuration}
            isPaused={isPaused}
          />
        ))}

        {/* === Liver → BG: passthrough pipe (upper, wider) === */}
        <Pipe
          path={LIVER_TO_BG_PASSTHROUGH}
          active={isLiverPassthrough && liverToBgRate > 0}
          type="glucose"
          flowDuration={liverDuration}
          isPaused={isPaused}
          wallWidth={PT_WALL_WIDTH}
          fillWidth={PT_FILL_WIDTH}
        />

        {/* === Liver → BG: normal pipe (lower) === */}
        <Pipe
          path={LIVER_TO_BG_NORMAL}
          active={!isLiverPassthrough && liverToBgRate > 0}
          type="glucose"
          flowDuration={liverDuration}
          isPaused={isPaused}
        />

        {/* === BG → Kidneys === */}
        <Pipe
          path={BG_TO_KIDNEYS}
          active={bgToKidneysRate > 0}
          type="glucose"
          flowDuration={kidneysDuration}
          isPaused={isPaused}
        />

        {/* === BG → Muscles (glucose drain) === */}
        <Pipe
          path={BG_TO_MUSCLES}
          active={bgToMusclesRate > 0}
          type="glucose"
          flowDuration={musclesDuration}
          isPaused={isPaused}
        />

        {/* === Pancreas → Muscles (insulin, orange) === */}
        <Pipe
          path={PANCREAS_TO_MUSCLES}
          active={pancreasTier > 0}
          type="insulin"
          flowDuration={insulinDuration}
          isPaused={isPaused}
        />
      </svg>
    </div>
  );
}
