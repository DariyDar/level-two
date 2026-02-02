import type { UnloadingShip } from '../../core/simulation';
import type { Ship } from '../../core/types';
import './ShipProgress.css';

interface ShipProgressProps {
  unloadingShip: UnloadingShip | null;
  ships: Map<string, Ship>;
}

export function ShipProgress({ unloadingShip, ships }: ShipProgressProps) {
  if (!unloadingShip) {
    return (
      <div className="ship-progress ship-progress--empty">
        <span className="ship-progress__label">No ship unloading</span>
      </div>
    );
  }

  const ship = ships.get(unloadingShip.shipId);
  if (!ship) return null;

  const progressPercent =
    ((unloadingShip.totalTicks - unloadingShip.remainingTicks) /
      unloadingShip.totalTicks) *
    100;

  return (
    <div className="ship-progress">
      <div className="ship-progress__ship">
        <span className="ship-progress__emoji">{ship.emoji}</span>
        <span className="ship-progress__name">{ship.name}</span>
      </div>

      <div className="ship-progress__bar">
        <div
          className="ship-progress__fill"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="ship-progress__info">
        <span>{unloadingShip.remainingTicks}h remaining</span>
        <span>+{Math.round(unloadingShip.loadPerTick)}g/h</span>
      </div>
    </div>
  );
}
