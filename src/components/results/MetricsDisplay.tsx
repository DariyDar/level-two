import type { DayMetrics } from '../../core/types';
import './MetricsDisplay.css';

interface MetricsDisplayProps {
  metrics: DayMetrics;
}

export function MetricsDisplay({ metrics }: MetricsDisplayProps) {
  return (
    <div className="metrics-display">
      <div className="metrics-display__row">
        <MetricItem label="Average BG" value={metrics.averageBG} unit="mg/dL" />
        <MetricItem label="Min" value={metrics.minBG} unit="mg/dL" />
        <MetricItem label="Max" value={metrics.maxBG} unit="mg/dL" />
      </div>

      <div className="metrics-display__row">
        <MetricItem
          label="Time in Range"
          value={metrics.timeInRange}
          unit="%"
          highlight={metrics.timeInRange >= 70 ? 'good' : metrics.timeInRange >= 50 ? 'warning' : 'bad'}
        />
        <MetricItem
          label="Time High"
          value={metrics.timeAboveHigh}
          unit="%"
          highlight={metrics.timeAboveHigh <= 10 ? 'good' : metrics.timeAboveHigh <= 30 ? 'warning' : 'bad'}
        />
        <MetricItem
          label="Time Low"
          value={metrics.timeBelowLow}
          unit="%"
          highlight={metrics.timeBelowLow === 0 ? 'good' : metrics.timeBelowLow <= 5 ? 'warning' : 'bad'}
        />
      </div>
    </div>
  );
}

interface MetricItemProps {
  label: string;
  value: number;
  unit: string;
  highlight?: 'good' | 'warning' | 'bad';
}

function MetricItem({ label, value, unit, highlight }: MetricItemProps) {
  return (
    <div className={`metric-item ${highlight ? `metric-item--${highlight}` : ''}`}>
      <span className="metric-item__label">{label}</span>
      <span className="metric-item__value">
        {value}
        <span className="metric-item__unit">{unit}</span>
      </span>
    </div>
  );
}
