import { useState, useEffect, useCallback } from 'react';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { v4 as uuidv4 } from 'uuid';
import type { Ship, PlacedShip } from '../../core/types';
import { slotNumberToPosition, isGlucoseShip } from '../../core/types';
import { useGameStore } from '../../store/gameStore';
import { loadAllShips, loadLevel } from '../../config/loader';
import { PlanningHeader } from './PlanningHeader';
import { SlotGrid, calculateValidDropSlots } from './SlotGrid';
import { ShipInventory } from './ShipInventory';
import { ShipCardOverlay } from './ShipCard';
import './PlanningPhase.css';

export function PlanningPhase() {
  const {
    placedShips,
    placeShip,
    removeShip,
    planValidation,
    updateValidation,
    setPhase,
    currentLevel,
    setLevel,
  } = useGameStore();

  const [allShips, setAllShips] = useState<Ship[]>([]);
  const [activeShip, setActiveShip] = useState<Ship | null>(null);
  const [validDropSlots, setValidDropSlots] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Load configs on mount
  useEffect(() => {
    async function loadConfigs() {
      try {
        const ships = await loadAllShips();
        setAllShips(ships);

        // Load level if not already loaded
        if (!currentLevel) {
          const level = await loadLevel('level-01');
          setLevel(level);
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load configs:', error);
        setIsLoading(false);
      }
    }
    loadConfigs();
  }, [currentLevel, setLevel]);

  // Validate plan whenever placed ships change
  useEffect(() => {
    if (!currentLevel) return;

    let totalCarbs = 0;
    for (const placed of placedShips) {
      const ship = allShips.find((s) => s.id === placed.shipId);
      if (ship && isGlucoseShip(ship)) {
        totalCarbs += ship.load;
      }
    }

    const { min, max } = currentLevel.carbRequirements;
    const errors: string[] = [];
    const warnings: string[] = [];

    if (totalCarbs < min) {
      errors.push(`Need at least ${min}g carbs`);
    }
    if (totalCarbs > max) {
      warnings.push(`High carbs may cause spikes`);
    }

    updateValidation({
      isValid: errors.length === 0,
      totalCarbs,
      minCarbs: min,
      maxCarbs: max,
      errors,
      warnings,
    });
  }, [placedShips, allShips, currentLevel, updateValidation]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 8,
      },
    })
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const ship = event.active.data.current?.ship as Ship | undefined;
      if (!ship) return;

      setActiveShip(ship);

      // Calculate valid drop slots, excluding the currently dragged ship if it's placed
      const isPlaced = event.active.data.current?.isPlaced;
      const instanceId = event.active.data.current?.instanceId;

      const shipsForCalculation = isPlaced
        ? placedShips.filter((s) => s.instanceId !== instanceId)
        : placedShips;

      const valid = calculateValidDropSlots(ship, shipsForCalculation, allShips);
      setValidDropSlots(valid);
    },
    [placedShips, allShips]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      setActiveShip(null);
      setValidDropSlots(new Set());

      if (!over) {
        // Dropped outside - if was placed, remove it (return to inventory)
        const wasPlaced = active.data.current?.isPlaced;
        const instanceId = active.data.current?.instanceId;
        const isPreOccupied = placedShips.find(s => s.instanceId === instanceId)?.isPreOccupied;

        if (wasPlaced && instanceId && !isPreOccupied) {
          removeShip(instanceId);
        }
        return;
      }

      // Check if dropped on inventory (return to inventory)
      if (String(over.id).startsWith('inventory')) {
        const wasPlaced = active.data.current?.isPlaced;
        const instanceId = active.data.current?.instanceId;
        const isPreOccupied = placedShips.find(s => s.instanceId === instanceId)?.isPreOccupied;

        if (wasPlaced && instanceId && !isPreOccupied) {
          removeShip(instanceId);
        }
        return;
      }

      // Parse slot number from droppable id
      const slotMatch = String(over.id).match(/^slot-(\d+)$/);
      if (!slotMatch) return;

      const slotNumber = parseInt(slotMatch[1], 10);
      if (!validDropSlots.has(slotNumber)) return;

      const ship = active.data.current?.ship as Ship;
      const wasPlaced = active.data.current?.isPlaced;
      const oldInstanceId = active.data.current?.instanceId;

      // Remove old placement if moving
      if (wasPlaced && oldInstanceId) {
        removeShip(oldInstanceId);
      }

      // Convert slot number to position
      const pos = slotNumberToPosition(slotNumber);

      // Create new placement
      const newPlacement: PlacedShip = {
        instanceId: uuidv4(),
        shipId: ship.id,
        segment: pos.segment,
        row: pos.row,
        startSlot: pos.index,
      };

      placeShip(newPlacement);
    },
    [validDropSlots, placedShips, placeShip, removeShip]
  );

  const handleSimulate = useCallback(() => {
    setPhase('Simulation');
  }, [setPhase]);

  if (isLoading || !currentLevel) {
    return (
      <div className="planning-phase planning-phase--loading">
        Loading...
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="planning-phase">
        <PlanningHeader
          currentBG={currentLevel.initialBG ?? 100}
          validation={planValidation}
          onSimulate={handleSimulate}
        />

        <div className="planning-phase__content">
          <SlotGrid
            placedShips={placedShips}
            ships={allShips}
            validDropSlots={validDropSlots}
            highlightedSlots={new Set()}
          />

          <ShipInventory
            allShips={allShips}
            availableFoods={currentLevel.availableFoods}
            availableInterventions={currentLevel.availableInterventions}
            placedShips={placedShips}
          />
        </div>
      </div>

      <DragOverlay>
        {activeShip && <ShipCardOverlay ship={activeShip} />}
      </DragOverlay>
    </DndContext>
  );
}
