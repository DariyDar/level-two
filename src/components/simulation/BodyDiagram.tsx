import type { SimulationState } from '../../core/simulation';
import type { DegradationState } from '../../core/types';
import { ContainerView } from './ContainerView';
import { OrganSprite } from './OrganSprite';
import './BodyDiagram.css';

interface InterpolatedValues {
  liver: number;
  bg: number;
  muscleRate: number;
  liverRate: number;
}

interface BodyDiagramProps {
  state: SimulationState;
  degradation: DegradationState;
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
      {/* Muscles - A1-A4 (left column, rows 1-2) */}
      <div className="body-diagram__muscles">
        <OrganSprite
          label="Muscles"
          iconPath="/assets/organs/muscle_icon.png"
          value={displayMuscleRate}
          isActive={displayMuscleRate > 0}
          size="normal"
        />
      </div>

      {/* Blood Glucose - A2-A5-A8 (center column, all rows) */}
      <div className="body-diagram__bg">
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
      </div>

      {/* Kidneys - A3-A6 (right column, rows 1-2) */}
      <div className="body-diagram__kidneys">
        <ContainerView
          label="Kidneys"
          emoji="🫘"
          value={kidneyRate}
          capacity={50}
          showRate={kidneyRate > 0 ? Math.round(kidneyRate) : undefined}
          rateDirection="in"
        />
        <OrganSprite
          label=""
          iconPath="/assets/organs/kidney_icon.png"
          value={kidneyRate}
          isActive={kidneyRate > 0}
          size="normal"
          showValue={false}
        />
      </div>

      {/* Pancreas - A4-A7 (left column, rows 2-3) */}
      <div className="body-diagram__pancreas">
        <OrganSprite
          label="Pancreas"
          iconPath="/assets/organs/pancreas_icon.png"
          value={degradation.pancreas.tier}
          isActive={displayMuscleRate > 0}
          degradation={{
            tier: degradation.pancreas.tier,
            maxTier: 4
          }}
          size="normal"
        />
      </div>

      {/* Liver - A8 (center column, row 3) */}
      <div className="body-diagram__liver">
        <ContainerView
          label="Liver"
          emoji="🫀"
          value={liverValue}
          capacity={100}
          showRate={Math.round(displayLiverRate)}
          rateDirection="out"
          degradation={{
            tier: degradation.liver.tier,
            maxTier: 5
          }}
        />
        <OrganSprite
          label=""
          iconPath="/assets/organs/liver_icon.png"
          value={displayLiverRate}
          isActive={displayLiverRate > 0}
          size="normal"
          showValue={false}
        />
      </div>
    </div>
  );
}
