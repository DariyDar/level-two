import type { SimulationState } from '../../core/simulation';
import type { SimpleDegradation } from '../../core/types';
import { ContainerView } from './ContainerView';
import { FlowParticles } from './FlowParticles';
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
  const { currentLiverRate, currentMuscleRate, unloadingShip } = state;

  // Use interpolated values if provided, otherwise use state values
  const liverValue = interpolated?.liver ?? state.containers.liver;
  const bgValue = interpolated?.bg ?? state.containers.bg;
  const displayLiverRate = interpolated?.liverRate ?? currentLiverRate;
  const displayMuscleRate = interpolated?.muscleRate ?? currentMuscleRate;

  // Calculate ship unload rate for particles
  const shipUnloadRate = unloadingShip ? unloadingShip.loadPerTick : 0;

  return (
    <div className="body-diagram">
      {/* Top row: Muscles and Liver */}
      <div className="body-diagram__row">
        <ContainerView
          label="Muscles"
          emoji="💪"
          value={displayMuscleRate}
          capacity={100}
          showRate={Math.round(displayMuscleRate)}
          rateDirection="out"
        />

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

      {/* Center: BG (Blood Glucose) */}
      <div className="body-diagram__center">
        <ContainerView
          label="Blood Glucose"
          emoji="🩸"
          value={bgValue}
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
          value={displayMuscleRate > 0 ? 100 : 0}
          capacity={100}
          degradation={degradation.pancreas}
        />
      </div>

      {/* Flow particles */}
      <FlowParticles
        flowType="ship-liver"
        rate={shipUnloadRate}
        isActive={shipUnloadRate > 0}
      />
      <FlowParticles
        flowType="liver-bg"
        rate={displayLiverRate}
        isActive={displayLiverRate > 0}
      />
      <FlowParticles
        flowType="bg-muscles"
        rate={displayMuscleRate}
        isActive={displayMuscleRate > 0}
      />
    </div>
  );
}
