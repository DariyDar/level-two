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
      {/* Muscles - B1-C2 (columns 1-2, rows 2-3) */}
      <div className="body-diagram__muscles">
        <OrganSprite
          label="Muscles"
          iconPath="/assets/organs/muscle_icon.png"
          value={displayMuscleRate}
          isActive={displayMuscleRate > 0}
          size="normal"
        />
      </div>

      {/* Blood Glucose - B3-C4 (columns 3-4, rows 2-3) */}
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

      {/* Kidneys container - B5-C5 (column 5, rows 2-3) */}
      <div className="body-diagram__kidneys-container">
        <ContainerView
          label="Kidneys"
          emoji="🫘"
          value={kidneyRate}
          capacity={50}
          showRate={kidneyRate > 0 ? Math.round(kidneyRate) : undefined}
          rateDirection="in"
        />
      </div>

      {/* Kidneys icon - B6-C6 (column 6, rows 2-3) */}
      <div className="body-diagram__kidneys-icon">
        <OrganSprite
          label=""
          iconPath="/assets/organs/kidney_icon.png"
          value={kidneyRate}
          isActive={kidneyRate > 0}
          size="normal"
          showValue={false}
        />
      </div>

      {/* Pancreas - E1-E2 (columns 1-2, row 5) */}
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

      {/* Liver container - E3-F4 (columns 3-4, rows 5-6) */}
      <div className="body-diagram__liver-container">
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
      </div>

      {/* Liver icon - E4-F5 (columns 4-5, rows 5-6) */}
      <div className="body-diagram__liver-icon">
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
