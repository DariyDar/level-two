import { useState, useMemo } from 'react';
import type { Ship, PlacedShip, AvailableFood } from '../../core/types';
import { ShipCard } from './ShipCard';
import './ShipInventory.css';

type TabType = 'Food' | 'Interventions';

interface ShipInventoryProps {
  allShips: Ship[];
  availableFoods: AvailableFood[];
  availableInterventions: string[];
  placedShips: PlacedShip[];
}

export function ShipInventory({
  allShips,
  availableFoods,
  availableInterventions,
  placedShips,
}: ShipInventoryProps) {
  const [activeTab, setActiveTab] = useState<TabType>('Food');

  // Count how many of each ship are placed
  const placedCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const placed of placedShips) {
      counts.set(placed.shipId, (counts.get(placed.shipId) || 0) + 1);
    }
    return counts;
  }, [placedShips]);

  // Get available ships for current tab
  const availableShips = useMemo(() => {
    if (activeTab === 'Food') {
      return availableFoods
        .map((af) => {
          const ship = allShips.find((s) => s.id === af.id);
          if (!ship) return null;
          const placed = placedCounts.get(af.id) || 0;
          const remaining = af.count - placed;
          return { ship, remaining, maxCount: af.count };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null && item.remaining > 0);
    } else {
      return availableInterventions
        .map((id) => {
          const ship = allShips.find((s) => s.id === id);
          if (!ship) return null;
          const placed = placedCounts.get(id) || 0;
          // Interventions have unlimited uses (for now)
          return { ship, remaining: 99 - placed, maxCount: 99 };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null && item.remaining > 0);
    }
  }, [activeTab, allShips, availableFoods, availableInterventions, placedCounts]);

  const hasInterventions = availableInterventions.length > 0;

  return (
    <div className="ship-inventory">
      {hasInterventions && (
        <div className="ship-inventory__tabs">
          <button
            className={`ship-inventory__tab ${activeTab === 'Food' ? 'ship-inventory__tab--active' : ''}`}
            onClick={() => setActiveTab('Food')}
          >
            🍽️ Food
          </button>
          <button
            className={`ship-inventory__tab ${activeTab === 'Interventions' ? 'ship-inventory__tab--active' : ''}`}
            onClick={() => setActiveTab('Interventions')}
          >
            💊 Interventions
          </button>
        </div>
      )}

      <div className="ship-inventory__grid">
        {availableShips.length === 0 ? (
          <div className="ship-inventory__empty">
            {activeTab === 'Food' ? 'All food placed!' : 'No interventions available'}
          </div>
        ) : (
          availableShips.map(({ ship, remaining, maxCount }) => (
            <ShipCard
              key={ship.id}
              ship={ship}
              showDetails={true}
              remainingCount={maxCount < 99 ? remaining : undefined}
            />
          ))
        )}
      </div>
    </div>
  );
}
