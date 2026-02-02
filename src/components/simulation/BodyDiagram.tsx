import type { SimulationState } from '../../core/simulation';
import type { SimpleDegradation } from '../../core/types';
import { ContainerView } from './ContainerView';
import './BodyDiagram.css';

interface BodyDiagramProps {
  state: SimulationState;
  degradation: SimpleDegradation;
}

export function BodyDiagram({ state, degradation }: BodyDiagramProps) {
  const { containers, currentLiverRate, currentMuscleRate } = state;

  return (
    <div className="body-diagram">
      {/* Top row: Muscles and Liver */}
      <div className="body-diagram__row">
        <ContainerView
          label="Muscles"
          emoji="💪"
          value={currentMuscleRate}
          capacity={100}
          showRate={currentMuscleRate}
          rateDirection="out"
        />

        <ContainerView
          label="Liver"
          emoji="🫀"
          value={containers.liver}
          capacity={100}
          showRate={currentLiverRate}
          rateDirection="out"
          degradation={degradation.liver}
        />
      </div>

      {/* Center: BG (Blood Glucose) */}
      <div className="body-diagram__center">
        <ContainerView
          label="Blood Glucose"
          emoji="🩸"
          value={containers.bg}
          capacity={400}
          thresholds={{
            low: 70,
            target: 100,
            high: 200,
            critical: 300,
          }}
        />
      </div>

      {/* Bottom row: Pancreas */}
      <div className="body-diagram__row body-diagram__row--bottom">
        <ContainerView
          label="Pancreas"
          emoji="🫁"
          value={currentMuscleRate > 0 ? 100 : 0}
          capacity={100}
          degradation={degradation.pancreas}
        />
      </div>

      {/* Flow arrows */}
      <div className="body-diagram__flows">
        <div className="body-diagram__flow body-diagram__flow--liver-bg">
          {currentLiverRate > 0 && <span className="body-diagram__arrow">→</span>}
        </div>
        <div className="body-diagram__flow body-diagram__flow--bg-muscles">
          {currentMuscleRate > 0 && <span className="body-diagram__arrow">→</span>}
        </div>
        <div className="body-diagram__flow body-diagram__flow--pancreas">
          {currentMuscleRate > 0 && <span className="body-diagram__arrow">↑</span>}
        </div>
      </div>
    </div>
  );
}
