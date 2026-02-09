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
import type { Ship, PlacedShip, SegmentValidation } from '../../core/types';
import { slotNumberToPosition, isGlucoseShip, DAY_SEGMENTS } from '../../core/types';
import { useGameStore } from '../../store/gameStore';
import { loadAllShips, loadLevel } from '../../config/loader';
import { getDayConfig } from '../../core/utils/levelUtils';
import { useBgPrediction } from '../../hooks/useBgPrediction';
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
    wpBudget,
    wpSpent,
    spendWp,
    refundWp,
    degradation,
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

  // Initialize pre-occupied ships from day config
  useEffect(() => {
    if (!dayConfig || allShips.length === 0) return;

    const preOccSlots = dayConfig.preOccupiedSlots;
    if (!preOccSlots || preOccSlots.length === 0) return;

    // Calculate total WP cost of pre-occupied ships
    let preOccWpCost = 0;
    for (const po of preOccSlots) {
      const ship = allShips.find((s) => s.id === po.shipId);
      if (ship) preOccWpCost += ship.wpCost ?? 0;
    }

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

    // Ensure WP accounts for pre-occupied ships (handles retry where wpSpent resets to 0)
    if (wpSpent < preOccWpCost) {
      spendWp(preOccWpCost - wpSpent);
    }
  }, [dayConfig, allShips, currentDay, placedShips, wpSpent, placeShip, spendWp]);

  // Validate plan whenever placed ships change
  useEffect(() => {
    if (!currentLevel || !dayConfig) return;

    // Calculate carbs per segment
    const segmentCarbTotals: Record<string, number> = { Morning: 0, Day: 0, Evening: 0 };
    let totalCarbs = 0;

    for (const placed of placedShips) {
      const ship = allShips.find((s) => s.id === placed.shipId);
      if (ship && isGlucoseShip(ship)) {
        const carbs = ship.carbs ?? ship.load;
        totalCarbs += carbs;
        segmentCarbTotals[placed.segment] += carbs;
      }
    }

    const errors: string[] = [];
    const warnings: string[] = [];
    const segments: SegmentValidation[] = [];

    // Validate per segment if segmentCarbs defined
    if (dayConfig.segmentCarbs) {
      for (const seg of DAY_SEGMENTS) {
        const limits = dayConfig.segmentCarbs[seg];
        if (!limits) continue;

        const current = segmentCarbTotals[seg];
        segments.push({
          segment: seg,
          currentCarbs: current,
          min: limits.min,
          optimal: limits.optimal,
          max: limits.max,
        });

        // Every segment must meet its minimum carbs
        if (current < limits.min) {
          errors.push(`${seg}: need at least ${limits.min}g carbs`);
        }
        if (current > limits.max) {
          warnings.push(`${seg}: too many carbs (max ${limits.max}g)`);
        }
      }
    } else if (dayConfig.carbRequirements) {
      // Legacy day-level validation
      const { min, max } = dayConfig.carbRequirements;
      if (totalCarbs < min) {
        errors.push(`Need at least ${min}g carbs`);
      }
      if (totalCarbs > max) {
        warnings.push(`High carbs may cause spikes`);
      }
    }

    updateValidation({
      isValid: errors.length === 0,
      totalCarbs,
      minCarbs: dayConfig.carbRequirements?.min ?? 0,
      maxCarbs: dayConfig.carbRequirements?.max ?? 999,
      segments,
      errors,
      warnings,
    });
  }, [placedShips, allShips, currentLevel, dayConfig, updateValidation]);

  // BG prediction for sparkline graph
  const bgPrediction = useBgPrediction(
    placedShips,
    allShips,
    degradation,
    currentLevel?.initialBG ?? 100
  );

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

      const valid = calculateValidDropSlots(ship, shipsForCalculation, allShips, dayConfig?.blockedSlots);
      setValidDropSlots(valid);
    },
    [placedShips, allShips, dayConfig]
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
          refundWp(ship.wpCost ?? 0);
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
          refundWp(ship.wpCost ?? 0);
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

      // Check WP budget (only if placing from inventory, not moving)
      const wpCost = ship.wpCost ?? 0;
      if (!wasPlaced && wpCost > 0) {
        const wpRemaining = wpBudget - wpSpent;
        if (wpRemaining < wpCost) return; // Not enough WP
      }

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

      // Spend WP when placing from inventory (not when moving)
      if (!wasPlaced && wpCost > 0) {
        spendWp(wpCost);
      }
    },
    [validDropSlots, placedShips, placeShip, removeShip, wpBudget, wpSpent, spendWp]
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
        <PlanningHeader
          currentBG={currentLevel.initialBG ?? 100}
          wpRemaining={wpBudget - wpSpent}
          wpBudget={wpBudget}
          isValid={planValidation.isValid}
          onSimulate={handleSimulate}
          bgPrediction={bgPrediction.bgHistory}
          fastInsulinCharges={dayConfig?.pancreasBoostCharges ?? 0}
        />

        <div className="planning-phase__content">
          <ShipInventory
            allShips={allShips}
            availableFoods={dayConfig?.availableFoods || []}
            availableInterventions={dayConfig?.availableInterventions || []}
            placedShips={placedShips}
          />

          <SlotGrid
            placedShips={placedShips}
            ships={allShips}
            validDropSlots={validDropSlots}
            highlightedSlots={new Set()}
            activeShip={activeShip}
            hoveredSlot={hoveredSlot}
            segmentValidation={planValidation.segments}
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
