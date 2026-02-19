import { useMemo } from 'react';
import type { Intervention, PlacedIntervention, AvailableFood } from '../../core/types';
import { InterventionCard } from './InterventionCard';
import './ShipInventory.css';

interface InterventionInventoryProps {
  allInterventions: Intervention[];
  availableInterventions: AvailableFood[];
  placedInterventions: PlacedIntervention[];
  wpRemaining: number;
}

interface InventoryItem {
  intervention: Intervention;
  index: number;
  remaining: number;
}

export function InterventionInventory({
  allInterventions,
  availableInterventions,
  placedInterventions,
  wpRemaining,
}: InterventionInventoryProps) {
  const placedCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const placed of placedInterventions) {
      counts.set(placed.interventionId, (counts.get(placed.interventionId) || 0) + 1);
    }
    return counts;
  }, [placedInterventions]);

  const inventoryItems = useMemo(() => {
    const items: InventoryItem[] = [];

    for (const ai of availableInterventions) {
      const intervention = allInterventions.find((i) => i.id === ai.id);
      if (!intervention) continue;

      const placed = placedCounts.get(ai.id) || 0;
      const remaining = ai.count - placed;

      for (let i = 0; i < remaining; i++) {
        items.push({ intervention, index: i, remaining });
      }
    }

    return items;
  }, [allInterventions, availableInterventions, placedCounts]);

  if (availableInterventions.length === 0) return null;

  return (
    <div className="ship-inventory">
      <div className="ship-inventory__title">Interventions</div>
      <div className="ship-inventory__grid">
        {inventoryItems.length === 0 ? (
          <div className="ship-inventory__empty">All interventions placed!</div>
        ) : (
          inventoryItems.map(({ intervention, index }) => {
            const wpDisabled = intervention.wpCost > wpRemaining;
            return (
              <InterventionCard
                key={`${intervention.id}-${index}`}
                intervention={intervention}
                instanceId={`intervention-${intervention.id}-${index}`}
                wpDisabled={wpDisabled}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
