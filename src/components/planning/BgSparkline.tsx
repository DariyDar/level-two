import './BgSparkline.css';

interface BgSparklineProps {
  bgHistory: number[];
}

const BG_LOW = 70;
const BG_NORMAL = 150;
const BG_HIGH = 200;
const BG_CRITICAL = 300;

// Morning->Day at hour 6, Day->Evening at hour 12
const SEGMENT_HOURS = [6, 12];

const WIDTH = 300;
const HEIGHT = 48;
const PAD_TOP = 2;
const PAD_BOTTOM = 2;
const PLOT_H = HEIGHT - PAD_TOP - PAD_BOTTOM;

export function BgSparkline({ bgHistory }: BgSparklineProps) {
  const maxY = Math.max(400, ...bgHistory);
  const range = maxY;

  const getX = (hour: number) => (hour / 18) * WIDTH;
  const getY = (bg: number) => PAD_TOP + (1 - bg / range) * PLOT_H;

  // BG line path
  const points = bgHistory.map((bg, i) => `${getX(i)},${getY(bg)}`);
  const linePath = `M ${points.join(' L ')}`;

  // Zone backgrounds
  const zones = [
    { y1: BG_LOW, y2: BG_NORMAL, color: 'rgba(72, 187, 120, 0.15)' },
    { y1: BG_NORMAL, y2: BG_HIGH, color: 'rgba(236, 201, 75, 0.15)' },
    { y1: BG_HIGH, y2: BG_CRITICAL, color: 'rgba(245, 101, 101, 0.12)' },
  ];

  return (
    <div className="bg-sparkline">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        className="bg-sparkline__svg"
      >
        {/* Zone backgrounds */}
        {zones.map((zone, i) => {
          const top = Math.max(getY(zone.y2), PAD_TOP);
          const bottom = Math.min(getY(zone.y1), HEIGHT - PAD_BOTTOM);
          const h = Math.max(0, bottom - top);
          return (
            <rect
              key={i}
              x={0}
              y={top}
              width={WIDTH}
              height={h}
              fill={zone.color}
            />
          );
        })}

        {/* Segment dividers */}
        {SEGMENT_HOURS.map((hour) => (
          <line
            key={hour}
            x1={getX(hour)}
            y1={PAD_TOP}
            x2={getX(hour)}
            y2={HEIGHT - PAD_BOTTOM}
            className="bg-sparkline__divider"
          />
        ))}

        {/* Threshold lines */}
        <line
          x1={0}
          y1={getY(BG_HIGH)}
          x2={WIDTH}
          y2={getY(BG_HIGH)}
          className="bg-sparkline__threshold"
        />
        <line
          x1={0}
          y1={getY(BG_CRITICAL)}
          x2={WIDTH}
          y2={getY(BG_CRITICAL)}
          className="bg-sparkline__threshold bg-sparkline__threshold--critical"
        />

        {/* BG prediction line */}
        <path d={linePath} fill="none" className="bg-sparkline__line" />
      </svg>
    </div>
  );
}
