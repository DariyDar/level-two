import { useGameStore } from '../../store/gameStore'
import { MEAL_SEGMENTS } from '../../types'
import './ResultsPhase.css'

export function ResultsPhase() {
  const {
    lastSegmentResult,
    currentLevel,
    currentDay,
    currentSegment,
    degradation,
    nextSegment,
    retrySegment,
    resetLevel,
  } = useGameStore()

  if (!lastSegmentResult || !currentLevel) return null

  const { excessGlucose, newDegradationCircles, assessment } = lastSegmentResult
  const segmentName = MEAL_SEGMENTS[currentSegment] ?? 'Meal'
  const dayConfig = currentLevel.days[currentDay]
  const isLastSegment = currentSegment + 1 >= (dayConfig?.segments.length ?? 3)
  const isLastDay = currentDay + 1 >= currentLevel.days.length
  const isLevelComplete = isLastSegment && isLastDay && assessment !== 'Defeat'
  const isDefeat = assessment === 'Defeat'

  return (
    <div className="results-phase">
      <div className="results-header">
        <span className="results-header__title">
          {segmentName} — Day {currentDay + 1}/{currentLevel.days.length}
        </span>
      </div>

      <div className={`results-assessment results-assessment--${assessment.toLowerCase()}`}>
        {assessment}
      </div>

      <div className="results-stats">
        <div className="results-stat">
          <span className="results-stat__label">Excess Glucose</span>
          <span className="results-stat__value">{Math.round(excessGlucose)} mg</span>
        </div>
        <div className="results-stat">
          <span className="results-stat__label">New Degradations</span>
          <span className="results-stat__value">{newDegradationCircles}</span>
        </div>
      </div>

      <div className="results-degradation">
        <div className="results-degradation__title">Organ Damage</div>
        <div className="results-degradation__row">
          <span>Liver: {degradation.liverCircles}</span>
          <span>Pancreas: {degradation.pancreasCircles}</span>
          <span>Kidneys: {degradation.kidneysCircles}</span>
        </div>
      </div>

      <div className="results-actions">
        {isDefeat && (
          <>
            <button className="results-btn results-btn--retry" onClick={retrySegment}>
              Retry
            </button>
            <button className="results-btn results-btn--reset" onClick={resetLevel}>
              Restart Level
            </button>
          </>
        )}
        {isLevelComplete && (
          <div className="results-victory">
            Level Complete!
          </div>
        )}
        {!isDefeat && !isLevelComplete && (
          <button className="results-btn results-btn--next" onClick={nextSegment}>
            {isLastSegment ? 'Next Day' : 'Next Meal'}
          </button>
        )}
      </div>
    </div>
  )
}
