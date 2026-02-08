import type { SimulationState } from '../../core/simulation';
import type { DegradationState } from '../../core/types';
import { useGameStore } from '../../store/gameStore';
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
  const showDetailedIndicators = useGameStore((s) => s.showDetailedIndicators);
  const {
    currentLiverRate,
    currentMuscleRate,
    currentPancreasTier,
    currentMuscleTier,
    isFastInsulinActive,
    containers
  } = state;

  // Use interpolated values if provided, otherwise use state values
  const liverValue = interpolated?.liver ?? containers.liver;
  const bgValue = interpolated?.bg ?? containers.bg;
  const displayLiverRate = interpolated?.liverRate ?? currentLiverRate;
  const displayMuscleRate = interpolated?.muscleRate ?? currentMuscleRate;

  // Kidney excretion rate (when BG > 180, kidneys start working)
  const kidneyRate = bgValue > 180 ? Math.min((bgValue - 180) * 0.1, 20) : 0;

  // Calculate degraded tiers for pancreas (tier 1 = 0 degraded, tier 5 = 4 degraded)
  const pancreasDegradedTiers = degradation.pancreas.tier - 1;

  // Muscle tier comes from simulation state (already calculated with modifiers)
  const muscleTier = currentMuscleTier;

  // Show 6th tier circle only when muscle tier is 6 (boosted)
  const showBoostedMuscleTier = muscleTier === 6;

  // Kidney activity tier (0-4 based on kidneyRate)
  const kidneyTier = kidneyRate > 15 ? 4 : kidneyRate > 10 ? 3 : kidneyRate > 5 ? 2 : kidneyRate > 0 ? 1 : 0;

  // Flow directions for container chevron patterns
  const bgNetRate = displayLiverRate - displayMuscleRate - kidneyRate;
  const bgFlowDir: 'up' | 'down' | undefined = bgNetRate > 1 ? 'up' : bgNetRate < -1 ? 'down' : undefined;
  const liverFlowDir: 'up' | 'down' | undefined = displayLiverRate > 0 ? 'down' : undefined;
  const kidneyFlowDir: 'up' | 'down' | undefined = kidneyRate > 0 ? 'up' : undefined;

  return (
    <div className="body-diagram">
      {/* Kidneys icon - top left */}
      <div className="body-diagram__kidneys-icon">
        <OrganSprite
          label="Kidney"
          iconPath="/assets/organs/kidney_icon.png"
          isActive={kidneyRate > 0}
          tierConfig={{
            maxTier: 4,
            activeTier: kidneyTier,
            degradedTiers: 0,
            colorScheme: 'green',
            position: 'top'
          }}
          size="normal"
        />
        {showDetailedIndicators && (
          <div className="body-diagram__value-label">
            {Math.round(kidneyRate)}/h
          </div>
        )}
      </div>

      {/* Kidneys container - half behind kidneys icon, peeks right */}
      <div className="body-diagram__kidneys-container">
        <ContainerView
          label="Kidneys"
          emoji="🫘"
          value={kidneyRate}
          capacity={50}
          hideHeader={true}
          compactSize={true}
          flowDirection={kidneyFlowDir}
        />
      </div>

      {/* Muscles - top right */}
      <div className="body-diagram__muscles">
        <OrganSprite
          label="Muscle"
          iconPath="/assets/organs/muscle_icon.png"
          isActive={displayMuscleRate > 0}
          tierConfig={{
            maxTier: 5,
            activeTier: muscleTier,
            degradedTiers: pancreasDegradedTiers,
            isBoosted: isFastInsulinActive,
            showBoostedTier: showBoostedMuscleTier,
            position: 'top'
          }}
          size="normal"
        />
        {showDetailedIndicators && (
          <div className="body-diagram__value-label">
            {Math.round(displayMuscleRate)}/h
          </div>
        )}
      </div>

      {/* Blood Glucose - center, full height */}
      <div className="body-diagram__bg">
        <div className="body-diagram__bg-label">Blood Glucose</div>
        <ContainerView
          label="Blood Glucose"
          emoji=""
          value={bgValue}
          capacity={400}
          thresholds={{
            low: 70,
            high: 200,
            critical: 300,
          }}
          floatingValue={true}
          hideHeader={true}
          flowDirection={bgFlowDir}
        />
      </div>

      {/* Liver icon - bottom left */}
      <div className="body-diagram__liver-icon">
        <OrganSprite
          label="Liver"
          iconPath="/assets/organs/liver_icon.png"
          isActive={displayLiverRate > 0}
          tierConfig={{
            maxTier: 4,
            activeTier: 0,
            degradedTiers: degradation.liver.tier - 1,
            colorScheme: 'green',
            position: 'top'
          }}
          size="normal"
        />
        {showDetailedIndicators && (
          <div className="body-diagram__value-label">
            {Math.round(displayLiverRate)}/h
          </div>
        )}
      </div>

      {/* Liver container - half behind liver icon, peeks right */}
      <div className="body-diagram__liver-container">
        <ContainerView
          label="Liver"
          emoji="🫀"
          value={liverValue}
          capacity={100}
          hideHeader={true}
          compactSize={true}
          flowDirection={liverFlowDir}
        />
      </div>

      {/* Pancreas - bottom right */}
      <div className="body-diagram__pancreas">
        <OrganSprite
          label="Pancreas"
          iconPath="/assets/organs/pancreas_icon.png"
          isActive={currentPancreasTier > 0}
          tierConfig={{
            maxTier: 5,
            activeTier: currentPancreasTier,
            degradedTiers: pancreasDegradedTiers,
            isBoosted: isFastInsulinActive,
            position: 'top'
          }}
          size="normal"
        />
        {showDetailedIndicators && (
          <div className="body-diagram__value-label">
            T{currentPancreasTier}
          </div>
        )}
      </div>
    </div>
  );
}
