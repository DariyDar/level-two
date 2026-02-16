import { BgSparkline } from './BgSparkline';
import { BoostButton } from '../simulation/BoostButton';
import { Tooltip } from '../ui/Tooltip';
import './PlanningHeader.css';

interface PlanningHeaderProps {
  isValid: boolean;
  onSimulate: () => void;
  bgPrediction: number[];
  fastInsulinCharges: number;
  validationErrors: string[];
}

export function PlanningHeader({
  isValid,
  onSimulate,
  bgPrediction,
  fastInsulinCharges,
  validationErrors,
}: PlanningHeaderProps) {
  return (
    <div className="planning-header">
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

      {!isValid && validationErrors.length > 0 ? (
        <Tooltip text={`Fulfill segment carb requirements: ${validationErrors[0]}`} position="bottom">
          <button
            className="planning-header__simulate"
            disabled
          >
            Simulate
          </button>
        </Tooltip>
      ) : (
        <button
          className="planning-header__simulate"
          onClick={onSimulate}
          disabled={!isValid}
        >
          Simulate
        </button>
      )}
    </div>
  );
}
