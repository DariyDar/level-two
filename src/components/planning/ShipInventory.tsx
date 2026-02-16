import { useMemo } from 'react';
import type { Ship, PlacedShip, AvailableFood } from '../../core/types';
import { ShipCard } from './ShipCard';
import './ShipInventory.css';

interface ShipInventoryProps {
  allShips: Ship[];
  match3Inventory: Ship[];                // Food tiles dropped from Match-3 board
  availableInterventions: AvailableFood[]; // Interventions from level config (bypass match-3)
  placedShips: PlacedShip[];
}

interface InventoryItem {
  ship: Ship;
  index: number;
}

export function ShipInventory({
  allShips,
  match3Inventory,
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

    // Food items from match-3 drops (each drop = 1 card instance)
    // Count how many of each food are already placed
    const foodPlacedCounts = new Map<string, number>(placedCounts);

    for (let i = 0; i < match3Inventory.length; i++) {
      const ship = match3Inventory[i];
      const placed = foodPlacedCounts.get(ship.id) || 0;
      if (placed > 0) {
        // This instance is already placed on the grid
        foodPlacedCounts.set(ship.id, placed - 1);
        continue;
      }
      items.push({ ship, index: i });
    }

    // Intervention items from level config
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
  }, [allShips, match3Inventory, availableInterventions, placedCounts]);

  return (
    <div className="ship-inventory">
      <div className="ship-inventory__grid">
        {inventoryItems.length === 0 ? (
          <div className="ship-inventory__empty">
            {match3Inventory.length === 0
              ? 'Match tiles to drop food cards!'
              : 'All cards placed!'}
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
