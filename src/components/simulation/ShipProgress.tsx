import type { UnloadingShip } from '../../core/simulation';
import type { Ship } from '../../core/types';
import './ShipProgress.css';

interface QueuedShip {
  instanceId: string;
  shipId: string;
  slotNumber: number;
}

interface ShipProgressProps {
  unloadingShip: UnloadingShip | null;
  remainingShips: QueuedShip[];
  ships: Map<string, Ship>;
}

export function ShipProgress({ unloadingShip, remainingShips, ships }: ShipProgressProps) {
  const currentShip = unloadingShip ? ships.get(unloadingShip.shipId) : null;

  const progressPercent = unloadingShip
    ? ((unloadingShip.totalTicks - unloadingShip.remainingTicks) / unloadingShip.totalTicks) * 100
    : 0;

  return (
    <div className="ship-progress">
      {/* Current unloading ship */}
      <div className="ship-progress__current">
        {unloadingShip && currentShip ? (
          <>
            <div className="ship-progress__ship ship-progress__ship--active">
              <span className="ship-progress__emoji">{currentShip.emoji}</span>
              <div className="ship-progress__details">
                <span className="ship-progress__name">{currentShip.name}</span>
                <span className="ship-progress__rate">+{Math.round(unloadingShip.loadPerTick)}g/h → Liver</span>
              </div>
            </div>
            <div className="ship-progress__bar">
              <div
                className="ship-progress__fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="ship-progress__time">{unloadingShip.remainingTicks}h left</span>
          </>
        ) : (
          <span className="ship-progress__empty">No ship unloading</span>
        )}
      </div>

      {/* Queue */}
      {remainingShips.length > 0 && (
        <div className="ship-progress__queue">
          <span className="ship-progress__queue-label">Queue:</span>
          <div className="ship-progress__queue-items">
            {remainingShips.slice(0, 5).map((queued) => {
              const ship = ships.get(queued.shipId);
              if (!ship) return null;
              return (
                <div key={queued.instanceId} className="ship-progress__queue-item">
                  <span className="ship-progress__queue-emoji">{ship.emoji}</span>
                </div>
              );
            })}
            {remainingShips.length > 5 && (
              <span className="ship-progress__queue-more">+{remainingShips.length - 5}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
