import { useState, useEffect, useCallback, useMemo } from 'react';
import type { DragStartEvent, DragEndEvent, DragMoveEvent } from '@dnd-kit/core';
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
import { getDayConfig } from '../../core/utils/levelUtils';
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
    currentDay,
    setLevel,
    currentMood,
    updateMood,
    checkNegativeEvent,
  } = useGameStore();

  const [allShips, setAllShips] = useState<Ship[]>([]);
  const [activeShip, setActiveShip] = useState<Ship | null>(null);
  const [validDropSlots, setValidDropSlots] = useState<Set<number>>(new Set());
  const [hoveredSlot, setHoveredSlot] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load configs on mount
  useEffect(() => {
    async function loadConfigs() {
      try {
        const ships = await loadAllShips();
        setAllShips(ships);

        // Only load level if not already loaded (to preserve currentDay)
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Get day-specific configuration
  const dayConfig = useMemo(() => {
    if (!currentLevel) return null;
    return getDayConfig(currentLevel, currentDay);
  }, [currentLevel, currentDay]);

  // Validate plan whenever placed ships change
  useEffect(() => {
    if (!currentLevel || !dayConfig) return;

    let totalCarbs = 0;
    for (const placed of placedShips) {
      const ship = allShips.find((s) => s.id === placed.shipId);
      if (ship && isGlucoseShip(ship)) {
        totalCarbs += ship.carbs ?? ship.load;
      }
    }

    const { min, max } = dayConfig.carbRequirements;
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
  }, [placedShips, allShips, currentLevel, dayConfig, updateValidation]);

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

  const handleDragMove = useCallback(
    (event: DragMoveEvent) => {
      const { over } = event;
      if (!over) {
        setHoveredSlot(null);
        return;
      }

      const slotMatch = String(over.id).match(/^slot-(\d+)$/);
      if (slotMatch) {
        setHoveredSlot(parseInt(slotMatch[1], 10));
      } else {
        setHoveredSlot(null);
      }
    },
    []
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      setActiveShip(null);
      setValidDropSlots(new Set());
      setHoveredSlot(null);

      if (!over) {
        // Dropped outside - if was placed, remove it (return to inventory)
        const wasPlaced = active.data.current?.isPlaced;
        const instanceId = active.data.current?.instanceId;
        const isPreOccupied = placedShips.find(s => s.instanceId === instanceId)?.isPreOccupied;

        if (wasPlaced && instanceId && !isPreOccupied) {
          // Revert mood effect when removing ship
          const ship = active.data.current?.ship as Ship;
          if (ship.mood) {
            updateMood(-ship.mood as 1 | -1); // Reverse the effect
          }
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
          // Revert mood effect when removing ship
          const ship = active.data.current?.ship as Ship;
          if (ship.mood) {
            updateMood(-ship.mood as 1 | -1); // Reverse the effect
          }
          removeShip(instanceId);
        }
        return;
      }

      // Parse slot number from droppable id
      const slotMatch = String(over.id).match(/^slot-(\d+)$/);
      if (!slotMatch) return;

      // Use groupStartSlot if available (for multi-slot ships dropped on non-start slots)
      const groupStartSlot = over.data.current?.groupStartSlot as number | undefined;
      const targetSlot = groupStartSlot ?? parseInt(slotMatch[1], 10);

      if (!validDropSlots.has(targetSlot)) return;

      const ship = active.data.current?.ship as Ship;
      const wasPlaced = active.data.current?.isPlaced;
      const oldInstanceId = active.data.current?.instanceId;

      // Remove old placement if moving (mood reverts then reapplies - net zero change)
      if (wasPlaced && oldInstanceId) {
        if (ship.mood) {
          updateMood(-ship.mood as 1 | -1); // Reverse old effect
        }
        removeShip(oldInstanceId);
      }

      // Convert slot number to position
      const pos = slotNumberToPosition(targetSlot);

      // Create new placement
      const newPlacement: PlacedShip = {
        instanceId: uuidv4(),
        shipId: ship.id,
        segment: pos.segment,
        row: pos.row,
        startSlot: pos.index,
      };

      placeShip(newPlacement);

      // Apply mood effect when placing ship
      if (ship.mood) {
        updateMood(ship.mood);
      }
    },
    [validDropSlots, placedShips, placeShip, removeShip, updateMood]
  );

  const handleSimulate = useCallback(() => {
    // Check for negative event before starting simulation
    checkNegativeEvent();
    setPhase('Simulation');
  }, [setPhase, checkNegativeEvent]);

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
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
    >
      <div className="planning-phase">
        <PlanningHeader
          currentBG={currentLevel.initialBG ?? 100}
          currentMood={currentMood}
          validation={planValidation}
          onSimulate={handleSimulate}
        />

        <div className="planning-phase__content">
          <SlotGrid
            placedShips={placedShips}
            ships={allShips}
            validDropSlots={validDropSlots}
            highlightedSlots={new Set()}
            activeShip={activeShip}
            hoveredSlot={hoveredSlot}
          />

          <ShipInventory
            allShips={allShips}
            availableFoods={dayConfig?.availableFoods || []}
            availableInterventions={currentLevel.availableInterventions}
            placedShips={placedShips}
          />
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeShip && <ShipCardOverlay ship={activeShip} />}
      </DragOverlay>
    </DndContext>
  );
}
