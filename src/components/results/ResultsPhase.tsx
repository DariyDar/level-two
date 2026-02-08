import { useMemo } from 'react';
import { useGameStore } from '../../store/gameStore';
import { calculateDayResults } from '../../core/results';
import { BGGraph } from './BGGraph';
import { ExcessBGIndicator } from './ExcessBGIndicator';
import { OrganDegradationDisplay } from './OrganDegradationDisplay';
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

  const { assessment } = results;
  const defeated = assessment === 'Defeat';
  const excellent = assessment === 'Excellent';

  const handleContinue = () => {
    setResults(results);
    startNextDay();
  };

  const handleRetry = () => {
    retryDay();
  };

  return (
    <div className="results-phase">
      <h2 className="results-phase__title">Day {currentDay}/{currentLevel?.days ?? '?'} Results</h2>

      <BGGraph
        bgHistory={bgHistory}
        thresholds={{
          low: 70,
          high: 200,
          critical: 300,
        }}
      />

      <ExcessBGIndicator
        totalCircles={results.degradationBuffer.totalCircles}
        defeatThreshold={5}
      />

      <OrganDegradationDisplay
        currentDegradation={degradation}
        addedDegradation={results.degradation}
        animationDelay={2500}
      />

      <div className="results-phase__actions">
        {defeated ? (
          <p className="results-phase__fail-message">
            Too much damage! Try a different approach.
          </p>
        ) : (
          <button className="results-phase__button results-phase__button--primary" onClick={handleContinue}>
            Continue →
          </button>
        )}
        {!excellent && (
          <button className="results-phase__button results-phase__button--secondary" onClick={handleRetry}>
            Retry Day
          </button>
        )}
      </div>
    </div>
  );
}
