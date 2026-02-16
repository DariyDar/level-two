import { BgSparkline } from './BgSparkline';
import { BoostButton } from '../simulation/BoostButton';
import { Tooltip } from '../ui/Tooltip';
import './PlanningHeader.css';

interface PlanningHeaderProps {
  currentBG: number;
  movesRemaining: number;
  moveBudget: number;
  isValid: boolean;
  onSimulate: () => void;
  bgPrediction: number[];
  fastInsulinCharges: number;
}

export function PlanningHeader({
  currentBG,
  movesRemaining,
  moveBudget,
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

      <Tooltip text="Match-3 moves remaining. Swap tiles to unlock food cards!">
        <div className="planning-header__moves">
          <span className="planning-header__moves-emoji">🎯</span>
          <span className={`planning-header__value ${movesRemaining <= 0 ? 'planning-header__value--depleted' : ''}`}>
            {movesRemaining}/{moveBudget}
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
