import { useMemo } from 'react';
import { useGameStore } from '../../store/gameStore';
import { calculateDayResults } from '../../core/results';
import { BGGraph } from './BGGraph';
import { ExcessBGIndicator } from './ExcessBGIndicator';
import { OrganDegradationDisplay } from './OrganDegradationDisplay';
import { MoodScale } from '../ui/MoodScale';
import './ResultsPhase.css';

// Mock BG history for testing - in real app this comes from simulation
const MOCK_BG_HISTORY = [
  100, 95, 120, 150, 180, 160, 140, 130, 145, 170, 190, 175, 160, 145, 130, 115, 105, 100
];

interface ResultsPhaseProps {
  bgHistory?: number[];
}

function getMoodExplanation(mood: number, isLastDay: boolean): string | null {
  if (isLastDay) return null;

  if (mood >= 0) {
    return 'Good mood! All food will be available tomorrow.';
  } else if (mood >= -2) {
    return 'Decent mood. Some healthy food may require effort.';
  } else if (mood >= -5) {
    return 'Low mood. Healthy food choices will be limited.';
  } else {
    return 'Very low mood. Only comfort food available tomorrow.';
  }
}

export function ResultsPhase({ bgHistory = MOCK_BG_HISTORY }: ResultsPhaseProps) {
  const {
    currentDay,
    currentLevel,
    degradation,
    mood,
    setResults,
    startNextDay,
    retryDay,
    setLevel,
  } = useGameStore();

  // Calculate results
  const results = useMemo(() => {
    return calculateDayResults(currentDay, bgHistory);
  }, [currentDay, bgHistory]);

  const { assessment } = results;
  const defeated = assessment === 'Defeat';
  const excellent = assessment === 'Excellent';
  const totalDays = currentLevel?.days ?? 3;
  const isLastDay = currentDay >= totalDays;

  const handleContinue = () => {
    setResults(results);
    startNextDay();
  };

  const handleRetry = () => {
    retryDay();
  };

  const handleRestartLevel = () => {
    if (currentLevel) setLevel(currentLevel);
  };

  const moodExplanation = getMoodExplanation(mood, isLastDay);

  return (
    <div className="results-phase">
      <h2 className="results-phase__title">Day {currentDay}/{totalDays} Results</h2>

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
        defeatThreshold={currentLevel?.winCondition?.maxDegradationCircles ?? 5}
      />

      <OrganDegradationDisplay
        currentDegradation={degradation}
        addedDegradation={results.degradation}
        animationDelay={2500}
      />

      {!defeated && (
        <p className="results-phase__perfect-hint">
          A perfect victory is possible!
        </p>
      )}

      {/* Mood summary */}
      <div className="results-phase__mood-summary">
        <div className="results-phase__mood-row">
          <span className="results-phase__mood-label">
            {isLastDay ? 'Final mood:' : 'End-of-day mood:'}
          </span>
          <MoodScale mood={mood} />
        </div>
        {moodExplanation && (
          <p className="results-phase__mood-explanation">{moodExplanation}</p>
        )}
      </div>

      <div className="results-phase__actions">
        {defeated ? (
          <>
            <p className="results-phase__fail-message">
              Too much damage! Try a different approach.
            </p>
            <button className="results-phase__button results-phase__button--secondary" onClick={handleRetry}>
              Retry Day
            </button>
            <button className="results-phase__button results-phase__button--secondary" onClick={handleRestartLevel}>
              Restart Level
            </button>
          </>
        ) : (
          !isLastDay && (
            <button className="results-phase__button results-phase__button--primary" onClick={handleContinue}>
              Continue →
            </button>
          )
        )}
        {!defeated && !excellent && (
          <button className="results-phase__button results-phase__button--secondary" onClick={handleRetry}>
            Retry Day
          </button>
        )}
      </div>
    </div>
  );
}
