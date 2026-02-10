import { useGameStore } from '../../store/gameStore'
import { OrganDamageGrid } from '../shared/OrganDamageGrid'
import './ResultsPhase.css'

export function ResultsPhase() {
  const {
    lastSegmentResult,
    segmentCount,
    degradation,
    continueGame,
    resetLevel,
  } = useGameStore()

  if (!lastSegmentResult) return null

  const { excessGlucose, newDegradationCircles, assessment } = lastSegmentResult
  const isDefeat = assessment === 'Defeat'

  return (
    <div className="results-phase">
      <div className="results-header">
        <span className="results-header__title">
          Meal {segmentCount} Results
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

      <OrganDamageGrid degradation={degradation} title="Organ Damage" />

      <div className="results-actions">
        {isDefeat ? (
          <button className="results-btn results-btn--reset" onClick={resetLevel}>
            Restart
          </button>
        ) : (
          <button className="results-btn results-btn--next" onClick={continueGame}>
            Continue
          </button>
        )}
      </div>
    </div>
  )
}
