import { useMemo } from 'react';
import type { Ship, PlacedShip, AvailableFood } from '../../core/types';
import { ShipCard } from './ShipCard';
import './ShipInventory.css';

interface ShipInventoryProps {
  allShips: Ship[];
  availableInterventions: AvailableFood[];
  placedShips: PlacedShip[];
  blockedMoodThreshold: number;
}

interface InventoryItem {
  ship: Ship;
  index: number;
}

export function ShipInventory({
  allShips,
  availableInterventions,
  placedShips,
  blockedMoodThreshold,
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

    // ALL food ships are available (unlimited count), filtered by mood threshold
    const foodShips = allShips.filter((s) => s.loadType === 'Glucose');
    for (const ship of foodShips) {
      const shipMood = ship.mood ?? 0;
      // Filter out foods where mood <= blockedMoodThreshold
      if (shipMood <= blockedMoodThreshold) continue;

      // Foods can be placed multiple times (show 1 card in inventory always)
      items.push({ ship, index: 0 });
    }

    // Interventions with counts from config
    for (const ai of availableInterventions) {
      const ship = allShips.find((s) => s.id === ai.id);
      if (!ship) continue;

      const placed = placedCounts.get(ai.id) || 0;
      const remaining = ai.count - placed;

      for (let i = 0; i < remaining; i++) {
        items.push({ ship, index: i });
      }
    }

    return items;
  }, [allShips, availableInterventions, placedCounts, blockedMoodThreshold]);

  return (
    <div className="ship-inventory">
      <div className="ship-inventory__grid">
        {inventoryItems.length === 0 ? (
          <div className="ship-inventory__empty">No cards available!</div>
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
