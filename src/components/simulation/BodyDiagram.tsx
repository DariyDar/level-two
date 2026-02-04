import type { SimulationState } from '../../core/simulation';
import type { DegradationState } from '../../core/types';
import { ContainerView } from './ContainerView';
import { OrganSprite } from './OrganSprite';
import { getMuscleTierFromRate } from './utils';
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

  // Calculate muscle tier from rate
  const muscleTier = getMuscleTierFromRate(displayMuscleRate);

  return (
    <div className="body-diagram">
      {/* Muscles - B1-C2 (columns 1-2, rows 2-3) */}
      <div className="body-diagram__muscles">
        {/* Numeric value left of icon */}
        <div className="body-diagram__value-left">
          {Math.round(displayMuscleRate)}/h
        </div>

        {/* Muscle icon with tier circles */}
        <OrganSprite
          label="Muscle"
          iconPath="/assets/organs/muscle_icon.png"
          isActive={displayMuscleRate > 0}
          tierIndicator={{
            tier: muscleTier,
            maxTier: 5
          }}
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
          floatingValue={true}
        />
      </div>

      {/* Kidneys container - B5-C5 (column 5, rows 2-3) */}
      <div className="body-diagram__kidneys-container">
        <ContainerView
          label="Kidneys"
          emoji="🫘"
          value={kidneyRate}
          capacity={50}
          hideHeader={true}
          compactSize={true}
        />
      </div>

      {/* Kidneys icon - B6-C6 (column 6, rows 2-3) */}
      <div className="body-diagram__kidneys-icon">
        {/* Numeric value right of container */}
        <div className="body-diagram__value-right">
          {Math.round(kidneyRate)}
        </div>

        <OrganSprite
          label="Kidney"
          iconPath="/assets/organs/kidney_icon.png"
          isActive={kidneyRate > 0}
          size="normal"
        />
      </div>

      {/* Pancreas - E1-E2 (columns 1-2, row 5) */}
      <div className="body-diagram__pancreas">
        {/* Numeric value left of icon */}
        <div className="body-diagram__value-left">
          {degradation.pancreas.tier}
        </div>

        <OrganSprite
          label="Pancreas"
          iconPath="/assets/organs/pancreas_icon.png"
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
          hideHeader={true}
          compactSize={true}
          degradation={{
            tier: degradation.liver.tier,
            maxTier: 5
          }}
        />
      </div>

      {/* Liver icon - E4-F5 (columns 4-5, rows 5-6) */}
      <div className="body-diagram__liver-icon">
        <OrganSprite
          label="Liver"
          iconPath="/assets/organs/liver_icon.png"
          isActive={displayLiverRate > 0}
          degradation={{
            tier: degradation.liver.tier,
            maxTier: 5
          }}
          size="normal"
        />

        {/* Numeric value right of icon */}
        <div className="body-diagram__value-right">
          {Math.round(displayLiverRate)}/h
        </div>
      </div>
    </div>
  );
}
