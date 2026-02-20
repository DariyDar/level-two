import type { PenaltyResult } from '../../core/types';
import { WP_PENALTY_WEIGHT } from '../../core/types';
import './ResultPanel.css';

interface ResultPanelProps {
  result: PenaltyResult;
  currentDay: number;
  totalDays: number;
  unspentWp?: number;
  onRetry: () => void;
  onNextDay: () => void;
}

function StarDisplay({ count }: { count: number }) {
  return (
    <div className="result-panel__stars">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className={`result-panel__star ${i < count ? 'result-panel__star--filled' : 'result-panel__star--empty'}`}
        >
          {i < count ? '\u2B50' : '\u2606'}
        </span>
      ))}
    </div>
  );
}

export function ResultPanel({ result, currentDay, totalDays, unspentWp = 0, onRetry, onNextDay }: ResultPanelProps) {
  const isDefeat = result.stars === 0;
  const isPerfect = result.stars === 3;
  const isLastDay = currentDay >= totalDays;
  const hasUnspentWp = unspentWp > 0;

  return (
    <div className={`result-panel result-panel--${result.label.toLowerCase()}`}>
      <StarDisplay count={result.stars} />

      <div className="result-panel__label">{result.label}!</div>

      <div className="result-panel__penalty">
        <span className="result-panel__penalty-value">{result.totalPenalty}</span>
        <span className="result-panel__penalty-text"> excess sugar points</span>
      </div>

      <div className="result-panel__breakdown">
        {result.orangeCount > 0 && (
          <span className="result-panel__zone result-panel__zone--orange">
            {result.orangeCount} cubes 200-300
          </span>
        )}
        {result.redCount > 0 && (
          <span className="result-panel__zone result-panel__zone--red">
            {result.redCount} cubes 300+
          </span>
        )}
        {result.orangeCount === 0 && result.redCount === 0 && (
          <span className="result-panel__zone result-panel__zone--clean">
            All cubes below 200 mg/dL!
          </span>
        )}
      </div>

      {hasUnspentWp && (
        <div className="result-panel__wp-warning">
          {isLastDay ? (
            <span className="result-panel__wp-warning-text">
              {unspentWp} unspent WP {'\u2192'} +{unspentWp * WP_PENALTY_WEIGHT} penalty
            </span>
          ) : (
            <span className="result-panel__wp-warning-text">
              {unspentWp} unspent WP {'\u2192'} Day {currentDay + 1}: {'\u2212'}{unspentWp} WP
            </span>
          )}
        </div>
      )}

      {!hasUnspentWp && (
        <div className="result-panel__wp-perfect">
          All WP spent {'\u2014'} Discipline!
        </div>
      )}

      <div className="result-panel__actions">
        {!isPerfect && (
          <button className="result-panel__btn result-panel__btn--retry" onClick={onRetry}>
            Retry Day
          </button>
        )}
        {!isDefeat && !isLastDay && (
          <button className="result-panel__btn result-panel__btn--next" onClick={onNextDay}>
            Next Day
          </button>
        )}
        {!isDefeat && isLastDay && (
          <button className="result-panel__btn result-panel__btn--next" onClick={onRetry}>
            Play Again
          </button>
        )}
      </div>
    </div>
  );
}
