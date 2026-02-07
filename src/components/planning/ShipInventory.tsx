import { useState, useMemo } from 'react';
import type { Ship, PlacedShip, AvailableFood } from '../../core/types';
import { ShipCard } from './ShipCard';
import './ShipInventory.css';

type TabType = 'Food' | 'Interventions';

interface ShipInventoryProps {
  allShips: Ship[];
  availableFoods: AvailableFood[];
  availableInterventions: AvailableFood[];
  placedShips: PlacedShip[];
}

interface InventoryItem {
  ship: Ship;
  index: number; // For unique key when showing individual items
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

  // Get available ships for current tab - each item shown separately (no stacking)
  const inventoryItems = useMemo(() => {
    const items: InventoryItem[] = [];

    if (activeTab === 'Food') {
      for (const af of availableFoods) {
        const ship = allShips.find((s) => s.id === af.id);
        if (!ship) continue;

        const placed = placedCounts.get(af.id) || 0;
        const remaining = af.count - placed;

        // Add each remaining item separately
        for (let i = 0; i < remaining; i++) {
          items.push({ ship, index: i });
        }
      }
    } else {
      for (const ai of availableInterventions) {
        const ship = allShips.find((s) => s.id === ai.id);
        if (!ship) continue;

        const placed = placedCounts.get(ai.id) || 0;
        const remaining = ai.count - placed;

        for (let i = 0; i < remaining; i++) {
          items.push({ ship, index: i });
        }
      }
    }

    return items;
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
        {inventoryItems.length === 0 ? (
          <div className="ship-inventory__empty">
            {activeTab === 'Food' ? 'All food placed!' : 'No interventions available'}
          </div>
        ) : (
          inventoryItems.map(({ ship, index }) => (
            <ShipCard
              key={`${ship.id}-${index}`}
              ship={ship}
              instanceId={`inventory-${ship.id}-${index}`}
              showDetails={true}
            />
          ))
        )}
      </div>
    </div>
  );
}
