import { DegradationCircles } from './DegradationCircles';
import './ContainerView.css';

interface ContainerViewProps {
  label: string;
  emoji: string;
  value: number;
  capacity: number;
  thresholds?: {
    low?: number;
    target?: number;
    high?: number;
    critical?: number;
  };
  showRate?: number;
  rateDirection?: 'in' | 'out';
  degradation?: {
    tier: number;      // Current degradation tier
    maxTier: number;   // Maximum tier for this organ
  };
  compact?: boolean;
  hideHeader?: boolean;        // Hide emoji/label header
  floatingValue?: boolean;     // Show value as floating indicator (for BG)
  compactSize?: boolean;       // Use compact dimensions (narrower/shorter)
  circular?: boolean;          // Circular container shape (liver/kidneys)
  flowDirection?: 'up' | 'down'; // Chevron pattern scroll direction (filling/emptying)
}

export function ContainerView({
  label,
  emoji,
  value,
  capacity,
  thresholds,
  showRate,
  rateDirection,
  degradation,
  compact = false,
  hideHeader = false,
  floatingValue = false,
  compactSize = false,
  circular = false,
  flowDirection,
}: ContainerViewProps) {
  const fillPercent = Math.min(100, (value / capacity) * 100);

  // Determine fill color based on thresholds
  // For BG (floatingValue mode): fill stays static blue, color goes to floating badge
  let fillColor = '#4299e1'; // Default blue

  if (thresholds && !floatingValue) {
    if (thresholds.critical && value >= thresholds.critical) {
      fillColor = '#e53e3e'; // Red
    } else if (thresholds.high && value >= thresholds.high) {
      fillColor = '#ed8936'; // Orange
    } else if (thresholds.target && value >= thresholds.target) {
      fillColor = '#48bb78'; // Green
    } else if (thresholds.low && value < thresholds.low) {
      fillColor = '#ecc94b'; // Yellow
    }
  }

  // Floating value badge state (BG only)
  let floatingClass = '';
  if (floatingValue && thresholds) {
    if (thresholds.critical && value >= thresholds.critical) {
      floatingClass = 'container-view__floating-value--critical';
    } else if (thresholds.high && value >= thresholds.high) {
      floatingClass = 'container-view__floating-value--high';
    } else if (thresholds.low && value < thresholds.low) {
      floatingClass = 'container-view__floating-value--low';
    }
  }

  return (
    <div className={`container-view ${compact ? 'container-view--compact' : ''} ${compactSize ? 'container-view--compact-size' : ''} ${circular ? 'container-view--circular' : ''}`}>
      {!hideHeader && (
        <div className="container-view__header">
          <span className="container-view__emoji">{emoji}</span>
          <span className="container-view__label">{label}</span>
        </div>
      )}

      <div className="container-view__bar">
        {/* Threshold markers */}
        {thresholds?.low && (
          <div
            className="container-view__marker container-view__marker--low"
            style={{ bottom: `${(thresholds.low / capacity) * 100}%` }}
          />
        )}
        {thresholds?.target && (
          <div
            className="container-view__marker container-view__marker--target"
            style={{ bottom: `${(thresholds.target / capacity) * 100}%` }}
          />
        )}
        {thresholds?.high && (
          <div
            className="container-view__marker container-view__marker--high"
            style={{ bottom: `${(thresholds.high / capacity) * 100}%` }}
          />
        )}
        {thresholds?.critical && (
          <div
            className="container-view__marker container-view__marker--critical"
            style={{ bottom: `${(thresholds.critical / capacity) * 100}%` }}
          />
        )}

        {/* Fill */}
        <div
          className={`container-view__fill ${flowDirection === 'up' ? 'container-view__fill--flow-up' : flowDirection === 'down' ? 'container-view__fill--flow-down' : 'container-view__fill--flow-static'}`}
          style={{
            height: `${fillPercent}%`,
            backgroundColor: fillColor,
          }}
        >
          {/* Floating value indicator for BG */}
          {floatingValue && (
            <div className={`container-view__floating-value ${floatingClass}`}>
              {Math.round(value)}
            </div>
          )}
        </div>
      </div>

      {/* Regular value display (for non-floating) */}
      {!floatingValue && (
        <div className="container-view__value">
          {Math.round(value)}
          {showRate !== undefined && showRate > 0 && (
            <span className="container-view__rate">
              {rateDirection === 'out' ? '↓' : '↑'}{showRate}/h
            </span>
          )}
        </div>
      )}

      {/* Degradation circles */}
      {degradation && degradation.maxTier > 0 && (
        <DegradationCircles
          tier={degradation.tier}
          maxTier={degradation.maxTier}
          size={compact ? 'small' : 'normal'}
        />
      )}
    </div>
  );
}
