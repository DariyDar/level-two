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
import { slotNumberToPosition } from '../../core/types';
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
    mood,
    applyMoodDelta,
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

  // Initialize pre-occupied ships from day config (no WP deduction)
  useEffect(() => {
    if (!dayConfig || allShips.length === 0) return;

    const preOccSlots = dayConfig.preOccupiedSlots;
    if (!preOccSlots || preOccSlots.length === 0) return;

    // Place pre-occupied ships if not already placed
    const alreadyPlaced = placedShips.some((s) => s.isPreOccupied);
    if (!alreadyPlaced) {
      for (const po of preOccSlots) {
        const pos = slotNumberToPosition(po.slot);
        placeShip({
          instanceId: `pre-${po.shipId}-${po.slot}`,
          shipId: po.shipId,
          segment: pos.segment,
          row: pos.row,
          startSlot: pos.index,
          isPreOccupied: true,
        });
      }
    }
  }, [dayConfig, allShips, currentDay, placedShips, placeShip]);

  // Validate plan whenever placed ships change
  // Simple validation: at least 1 card placed
  useEffect(() => {
    if (!currentLevel || !dayConfig) return;

    const nonPreOccupied = placedShips.filter((s) => !s.isPreOccupied);
    const isValid = nonPreOccupied.length >= 1;

    const errors: string[] = [];
    const warnings: string[] = [];

    if (!isValid) {
      errors.push('Place at least 1 card');
    }

    updateValidation({
      isValid,
      errors,
      warnings,
    });
  }, [placedShips, currentLevel, dayConfig, updateValidation]);

  // Calculate blockedMoodThreshold based on current mood
  const blockedMoodThreshold = useMemo(() => {
    if (mood > -2) return -Infinity;  // mood >= -1: all food available
    if (mood > -5) return -4;         // mood -2..-4: block super-healthy (mood <= -4)
    if (mood > -8) return -2;         // mood -5..-7: block medium-healthy (mood <= -2)
    return 0;                          // mood <= -8: only junk food (mood > 0)
  }, [mood]);

  // Extract slot numbers from BlockedSlotConfig[] for calculateValidDropSlots
  const blockedSlotNumbers = useMemo(() => {
    return dayConfig?.blockedSlots?.map((b) => b.slot) ?? [];
  }, [dayConfig]);

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

      const valid = calculateValidDropSlots(ship, shipsForCalculation, allShips, blockedSlotNumbers);
      setValidDropSlots(valid);
    },
    [placedShips, allShips, blockedSlotNumbers]
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
          const ship = active.data.current?.ship as Ship;
          // Reverse mood delta when removing
          const moodDelta = ship.mood ?? 0;
          if (moodDelta !== 0) {
            applyMoodDelta(-moodDelta);
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
          const ship = active.data.current?.ship as Ship;
          // Reverse mood delta when removing
          const moodDelta = ship.mood ?? 0;
          if (moodDelta !== 0) {
            applyMoodDelta(-moodDelta);
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

      // Remove old placement if moving
      if (wasPlaced && oldInstanceId) {
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

      // Apply mood delta when placing from inventory (not when moving)
      if (!wasPlaced) {
        const moodDelta = ship.mood ?? 0;
        if (moodDelta !== 0) {
          applyMoodDelta(moodDelta);
        }
      }
    },
    [validDropSlots, placedShips, placeShip, removeShip, applyMoodDelta]
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
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
    >
      <div className="planning-phase">
        <div className="planning-phase__day-title">
          Day {currentDay}/{currentLevel.days}
        </div>
        <PlanningHeader
          currentBG={currentLevel.initialBG ?? 100}
          mood={mood}
          isValid={planValidation.isValid}
          onSimulate={handleSimulate}
          fastInsulinCharges={dayConfig?.pancreasBoostCharges ?? 0}
        />

        <div className="planning-phase__content">
          <ShipInventory
            allShips={allShips}
            availableInterventions={dayConfig?.availableInterventions || []}
            placedShips={placedShips}
            blockedMoodThreshold={blockedMoodThreshold}
          />

          <SlotGrid
            placedShips={placedShips}
            ships={allShips}
            validDropSlots={validDropSlots}
            highlightedSlots={new Set()}
            activeShip={activeShip}
            hoveredSlot={hoveredSlot}
            blockedSlots={dayConfig?.blockedSlots}
          />
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeShip && <ShipCardOverlay ship={activeShip} />}
      </DragOverlay>
    </DndContext>
  );
}
