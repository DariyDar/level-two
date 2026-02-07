import { useMemo } from 'react';
import type { Ship, PlacedShip, AvailableFood } from '../../core/types';
import { ShipCard } from './ShipCard';
import './ShipInventory.css';

interface ShipInventoryProps {
  allShips: Ship[];
  availableFoods: AvailableFood[];
  availableInterventions: AvailableFood[];
  placedShips: PlacedShip[];
}

interface InventoryItem {
  ship: Ship;
  index: number;
}

export function ShipInventory({
  allShips,
  availableFoods,
  availableInterventions,
  placedShips,
}: ShipInventoryProps) {
  const placedCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const placed of placedShips) {
      counts.set(placed.shipId, (counts.get(placed.shipId) || 0) + 1);
    }
    return counts;
  }, [placedShips]);

  const inventoryItems = useMemo(() => {
    const items: InventoryItem[] = [];
    const allAvailable = [...availableFoods, ...availableInterventions];

    for (const af of allAvailable) {
      const ship = allShips.find((s) => s.id === af.id);
      if (!ship) continue;

      const placed = placedCounts.get(af.id) || 0;
      const remaining = af.count - placed;

      for (let i = 0; i < remaining; i++) {
        items.push({ ship, index: i });
      }
    }

    return items;
  }, [allShips, availableFoods, availableInterventions, placedCounts]);

  return (
    <div className="ship-inventory">
      <div className="ship-inventory__grid">
        {inventoryItems.length === 0 ? (
          <div className="ship-inventory__empty">All cards placed!</div>
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
