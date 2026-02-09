import { BoostButton } from '../simulation/BoostButton';
import { MoodScale } from '../ui/MoodScale';
import './PlanningHeader.css';

interface PlanningHeaderProps {
  currentBG: number;
  mood: number;
  isValid: boolean;
  onSimulate: () => void;
  fastInsulinCharges: number;
}

export function PlanningHeader({
  currentBG,
  mood,
  isValid,
  onSimulate,
  fastInsulinCharges,
}: PlanningHeaderProps) {
  return (
    <div className="planning-header">
      <div className="planning-header__bg">
        <span className="planning-header__label">BG</span>
        <span className="planning-header__value">{currentBG}</span>
      </div>

      <div className="planning-header__mood">
        <span className="planning-header__label">MOOD</span>
        <MoodScale mood={mood} />
      </div>

      <div className="planning-header__fast-insulin">
        <BoostButton
          label="Fast Insulin"
          emoji="💧"
          boost={{
            charges: fastInsulinCharges,
            maxCharges: fastInsulinCharges,
            cooldownTicks: 0,
            isActive: false,
            activeTicks: 0,
          }}
          cooldownMax={0}
          onActivate={() => {}}
          isFastInsulin
        />
      </div>

      <button
        className="planning-header__simulate"
        onClick={onSimulate}
        disabled={!isValid}
      >
        Simulate
      </button>
    </div>
  );
}
