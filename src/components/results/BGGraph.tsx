import './BGGraph.css';

interface BGGraphProps {
  bgHistory: number[];
  thresholds: {
    low: number;
    target: number;
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

  return (
    <div className="bg-graph">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Threshold lines */}
        <line
          className="bg-graph__threshold bg-graph__threshold--low"
          x1="0"
          y1={getY(thresholds.low)}
          x2="100"
          y2={getY(thresholds.low)}
        />
        <line
          className="bg-graph__threshold bg-graph__threshold--target"
          x1="0"
          y1={getY(thresholds.target)}
          x2="100"
          y2={getY(thresholds.target)}
        />
        <line
          className="bg-graph__threshold bg-graph__threshold--high"
          x1="0"
          y1={getY(thresholds.high)}
          x2="100"
          y2={getY(thresholds.high)}
        />
        <line
          className="bg-graph__threshold bg-graph__threshold--critical"
          x1="0"
          y1={getY(thresholds.critical)}
          x2="100"
          y2={getY(thresholds.critical)}
        />

        {/* BG line */}
        <path className="bg-graph__line" d={pathD} fill="none" />

        {/* Points */}
        {bgHistory.map((bg, i) => (
          <circle
            key={i}
            className="bg-graph__point"
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
        <span style={{ top: `${getY(thresholds.target)}%` }}>{thresholds.target}</span>
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
