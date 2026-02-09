import { BgSparkline } from './BgSparkline';
import { BoostButton } from '../simulation/BoostButton';
import './PlanningHeader.css';

interface PlanningHeaderProps {
  currentBG: number;
  wpRemaining: number;
  wpBudget: number;
  isValid: boolean;
  onSimulate: () => void;
  bgPrediction: number[];
  fastInsulinCharges: number;
}

export function PlanningHeader({
  currentBG,
  wpRemaining,
  wpBudget,
  isValid,
  onSimulate,
  bgPrediction,
  fastInsulinCharges,
}: PlanningHeaderProps) {
  return (
    <div className="planning-header">
      <div className="planning-header__bg">
        <span className="planning-header__label">BG</span>
        <span className="planning-header__value">{currentBG}</span>
      </div>

      <div className="planning-header__wp">
        <span className="planning-header__label">WP</span>
        <span className={`planning-header__value ${wpRemaining <= 0 ? 'planning-header__value--depleted' : ''}`}>
          {wpRemaining}/{wpBudget}
        </span>
      </div>

      <BgSparkline bgHistory={bgPrediction} />

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
