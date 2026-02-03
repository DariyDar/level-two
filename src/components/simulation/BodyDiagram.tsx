import type { SimulationState } from '../../core/simulation';
import type { SimpleDegradation } from '../../core/types';
import { ContainerView } from './ContainerView';
import './BodyDiagram.css';

interface InterpolatedValues {
  liver: number;
  bg: number;
  muscleRate: number;
  liverRate: number;
}

interface BodyDiagramProps {
  state: SimulationState;
  degradation: SimpleDegradation;
  interpolated?: InterpolatedValues;
}

export function BodyDiagram({ state, degradation, interpolated }: BodyDiagramProps) {
  const { currentLiverRate, currentMuscleRate, containers } = state;

  // Use interpolated values if provided, otherwise use state values
  const liverValue = interpolated?.liver ?? containers.liver;
  const bgValue = interpolated?.bg ?? containers.bg;
  const displayLiverRate = interpolated?.liverRate ?? currentLiverRate;
  const displayMuscleRate = interpolated?.muscleRate ?? currentMuscleRate;

  // Kidney excretion rate (when BG > 180, kidneys start working)
  const kidneyRate = bgValue > 180 ? Math.min((bgValue - 180) * 0.1, 20) : 0;

  return (
    <div className="body-diagram">
      {/* Middle row: Muscles - BG - Kidneys */}
      <div className="body-diagram__middle-row">
        <ContainerView
          label="Muscles"
          emoji="💪"
          value={displayMuscleRate}
          capacity={100}
          showRate={Math.round(displayMuscleRate)}
          rateDirection="in"
        />

        <ContainerView
          label="Blood Glucose"
          emoji="🩸"
          value={bgValue}
          capacity={400}
          thresholds={{
            low: 70,
            target: 100,
            high: 180,
            critical: 300,
          }}
        />

        <ContainerView
          label="Kidneys"
          emoji="🫘"
          value={kidneyRate}
          capacity={50}
          showRate={kidneyRate > 0 ? Math.round(kidneyRate) : undefined}
          rateDirection="in"
        />
      </div>

      {/* Bottom row: Liver */}
      <div className="body-diagram__bottom-row">
        <ContainerView
          label="Liver"
          emoji="🫀"
          value={liverValue}
          capacity={100}
          showRate={Math.round(displayLiverRate)}
          rateDirection="out"
          degradation={degradation.liver}
        />
      </div>

      {/* Pancreas - small indicator */}
      <div className="body-diagram__pancreas">
        <ContainerView
          label="Pancreas"
          emoji="🫁"
          value={displayMuscleRate > 0 ? 100 : 0}
          capacity={100}
          degradation={degradation.pancreas}
          compact
        />
      </div>
    </div>
  );
}
