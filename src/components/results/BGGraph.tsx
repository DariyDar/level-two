import './BGGraph.css';

interface BGGraphProps {
  bgHistory: number[];
  thresholds: {
    low: number;
    high: number;
    critical: number;
  };
}

export function BGGraph({ bgHistory, thresholds }: BGGraphProps) {
  if (bgHistory.length === 0) return null;

  const maxBG = Math.max(400, ...bgHistory);
  const minBG = 0;
  const range = maxBG - minBG;

  // Convert BG values to Y percentages (inverted - 0 at bottom)
  const getY = (bg: number) => 100 - ((bg - minBG) / range) * 100;

  // Create SVG path
  const points = bgHistory.map((bg, i) => {
    const x = (i / (bgHistory.length - 1)) * 100;
    const y = getY(bg);
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(' L ')}`;

  // Build colored segments for all zones
  const segments = buildColoredSegments(bgHistory, thresholds, getY);

  return (
    <div className="bg-graph">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Zone backgrounds */}
        <rect
          className="bg-graph__zone bg-graph__zone--normal"
          x="0" width="100"
          y={getY(thresholds.high)}
          height={getY(thresholds.low) - getY(thresholds.high)}
        />
        <rect
          className="bg-graph__zone bg-graph__zone--high"
          x="0" width="100"
          y={getY(thresholds.critical)}
          height={getY(thresholds.high) - getY(thresholds.critical)}
        />
        <rect
          className="bg-graph__zone bg-graph__zone--critical"
          x="0" width="100"
          y={getY(maxBG)}
          height={getY(thresholds.critical) - getY(maxBG)}
        />

        {/* Threshold lines */}
        <line
          className="bg-graph__threshold bg-graph__threshold--low"
          x1="0" y1={getY(thresholds.low)}
          x2="100" y2={getY(thresholds.low)}
        />
        <line
          className="bg-graph__threshold bg-graph__threshold--high"
          x1="0" y1={getY(thresholds.high)}
          x2="100" y2={getY(thresholds.high)}
        />
        <line
          className="bg-graph__threshold bg-graph__threshold--critical"
          x1="0" y1={getY(thresholds.critical)}
          x2="100" y2={getY(thresholds.critical)}
        />

        {/* BG line - base (normal color) */}
        <path className="bg-graph__line" d={pathD} fill="none" />

        {/* BG line - colored overlay segments for high/critical zones */}
        {segments.map((seg, i) => (
          <path
            key={i}
            className={`bg-graph__line bg-graph__line--${seg.zone}`}
            d={seg.d}
            fill="none"
          />
        ))}

        {/* Points */}
        {bgHistory.map((bg, i) => (
          <circle
            key={i}
            className={`bg-graph__point ${
              bg > thresholds.critical ? 'bg-graph__point--critical' :
              bg > thresholds.high ? 'bg-graph__point--high' :
              bg >= thresholds.low ? 'bg-graph__point--normal' : ''
            }`}
            cx={(i / (bgHistory.length - 1)) * 100}
            cy={getY(bg)}
            r="1.5"
          />
        ))}
      </svg>

      {/* Y-axis labels */}
      <div className="bg-graph__labels">
        <span style={{ top: `${getY(thresholds.critical)}%` }}>{thresholds.critical}</span>
        <span style={{ top: `${getY(thresholds.high)}%` }}>{thresholds.high}</span>
        <span style={{ top: `${getY(thresholds.low)}%` }}>{thresholds.low}</span>
      </div>

      {/* X-axis labels */}
      <div className="bg-graph__x-labels">
        <span>06:00</span>
        <span>12:00</span>
        <span>18:00</span>
        <span>00:00</span>
      </div>
    </div>
  );
}

type BgZone = 'normal' | 'high' | 'critical';

// Build SVG path segments colored by BG zone
function buildColoredSegments(
  bgHistory: number[],
  thresholds: { low: number; high: number; critical: number },
  getY: (bg: number) => number
): { d: string; zone: BgZone }[] {
  const segments: { d: string; zone: BgZone }[] = [];
  const len = bgHistory.length;
  if (len < 2) return segments;

  let currentZone: BgZone | null = null;
  let currentPoints: string[] = [];

  const getZone = (bg: number): BgZone | null => {
    if (bg > thresholds.critical) return 'critical';
    if (bg > thresholds.high) return 'high';
    if (bg >= thresholds.low) return 'normal';
    return null; // below low — uses base line color
  };

  for (let i = 0; i < len; i++) {
    const bg = bgHistory[i];
    const x = (i / (len - 1)) * 100;
    const y = getY(bg);
    const zone = getZone(bg);

    if (zone !== null) {
      if (currentZone === null || zone !== currentZone) {
        // Flush previous segment
        if (currentZone !== null && currentPoints.length >= 2) {
          segments.push({ d: `M ${currentPoints.join(' L ')}`, zone: currentZone });
        }
        // Start new segment with overlap from previous point
        currentPoints = [];
        if (i > 0) {
          const prevX = ((i - 1) / (len - 1)) * 100;
          const prevY = getY(bgHistory[i - 1]);
          currentPoints.push(`${prevX},${prevY}`);
        }
        currentZone = zone;
        currentPoints.push(`${x},${y}`);
      } else {
        currentPoints.push(`${x},${y}`);
      }
    } else {
      if (currentZone !== null && currentPoints.length >= 1) {
        currentPoints.push(`${x},${y}`);
        if (currentPoints.length >= 2) {
          segments.push({ d: `M ${currentPoints.join(' L ')}`, zone: currentZone });
        }
        currentZone = null;
        currentPoints = [];
      }
    }
  }

  // Flush remaining
  if (currentZone !== null && currentPoints.length >= 2) {
    segments.push({ d: `M ${currentPoints.join(' L ')}`, zone: currentZone });
  }

  return segments;
}
