import { BgSparkline } from './BgSparkline';
import { BoostButton } from '../simulation/BoostButton';
import { Tooltip } from '../ui/Tooltip';
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
      <Tooltip text="Starting blood glucose level for this day">
        <div className="planning-header__bg">
          <span className="planning-header__label">BG</span>
          <span className="planning-header__value">{currentBG}</span>
        </div>
      </Tooltip>

      <Tooltip text="Willpower — spend to place food cards. Each card's ☀️ cost is shown on its badge">
        <div className="planning-header__wp">
          <span className="planning-header__wp-emoji">☀️</span>
          <span className={`planning-header__value ${wpRemaining <= 0 ? 'planning-header__value--depleted' : ''}`}>
            {wpRemaining}/{wpBudget}
          </span>
        </div>
      </Tooltip>

      <BgSparkline bgHistory={bgPrediction} />

      <Tooltip text="Boosts muscle's glucose absorption">
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
      </Tooltip>

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
