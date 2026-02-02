import { useMemo } from 'react';
import { useGameStore } from '../../store/gameStore';
import { calculateDayResults } from '../../core/results';
import { BGGraph } from './BGGraph';
import { RankDisplay } from './RankDisplay';
import { MetricsDisplay } from './MetricsDisplay';
import { DegradationDisplay } from './DegradationDisplay';
import './ResultsPhase.css';

// Mock BG history for testing - in real app this comes from simulation
const MOCK_BG_HISTORY = [
  100, 95, 120, 150, 180, 160, 140, 130, 145, 170, 190, 175, 160, 145, 130, 115, 105, 100
];

interface ResultsPhaseProps {
  bgHistory?: number[];
}

export function ResultsPhase({ bgHistory = MOCK_BG_HISTORY }: ResultsPhaseProps) {
  const {
    currentDay,
    currentLevel,
    degradation,
    setResults,
    startNextDay,
    retryDay,
  } = useGameStore();

  // Calculate results
  const results = useMemo(() => {
    return calculateDayResults(currentDay, bgHistory);
  }, [currentDay, bgHistory]);

  // Check if passed
  const minRank = currentLevel?.winCondition.minRank ?? 2;
  const passed = results.rank >= minRank;

  const handleContinue = () => {
    // Save results to store (updates degradation)
    setResults(results);

    // Move to next day
    startNextDay();
  };

  const handleRetry = () => {
    retryDay();
  };

  return (
    <div className="results-phase">
      <h2 className="results-phase__title">Day {currentDay} Results</h2>

      <RankDisplay rank={results.rank} message={results.message} />

      <BGGraph
        bgHistory={bgHistory}
        thresholds={{
          low: 70,
          target: 100,
          high: 200,
          critical: 300,
        }}
      />

      <MetricsDisplay metrics={results.metrics} />

      <DegradationDisplay
        currentDegradation={degradation}
        addedDegradation={results.degradation}
      />

      <div className="results-phase__actions">
        {passed ? (
          <button className="results-phase__button results-phase__button--primary" onClick={handleContinue}>
            Continue →
          </button>
        ) : (
          <p className="results-phase__fail-message">
            Need at least {minRank} stars to continue. Try again!
          </p>
        )}
        <button className="results-phase__button results-phase__button--secondary" onClick={handleRetry}>
          Retry Day
        </button>
      </div>
    </div>
  );
}
