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
      {/* Top row: Muscles - BG - Kidneys */}
      <div className="body-diagram__top-row">
        {/* Muscles - sprite only */}
        <OrganSprite
          label="Muscles"
          iconPath="/assets/organs/muscle_icon.png"
          value={displayMuscleRate}
          isActive={displayMuscleRate > 0}
          size="normal"
        />

        {/* Blood Glucose - container */}
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

        {/* Kidneys - container + sprite */}
        <div className="body-diagram__organ-group">
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
      </div>

      {/* Bottom row: Pancreas - Liver */}
      <div className="body-diagram__bottom-row">
        {/* Pancreas - sprite only */}
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

        {/* Liver - container + sprite */}
        <div className="body-diagram__organ-group">
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
    </div>
  );
}
