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
import { slotNumberToPosition, isGlucoseShip, DAY_SEGMENTS, DEFAULT_MOVE_BUDGET } from '../../core/types';
import type { Match3Config } from '../../core/match3';
import { useGameStore } from '../../store/gameStore';
import { loadAllShips, loadLevel } from '../../config/loader';
import { getDayConfig } from '../../core/utils/levelUtils';
import { useBgPrediction } from '../../hooks/useBgPrediction';
import { useMatch3 } from '../../hooks/useMatch3';
import { PlanningHeader } from './PlanningHeader';
import { SlotGrid, calculateValidDropSlots } from './SlotGrid';
import { ShipInventory } from './ShipInventory';
import { Match3Board } from './match3/Match3Board';
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
    moveBudget,
    match3Inventory,
    addToMatch3Inventory,
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

  // Match-3 config from day config
  const match3Config = useMemo<Match3Config | null>(() => {
    if (!dayConfig?.match3Config) return null;
    return dayConfig.match3Config as Match3Config;
  }, [dayConfig]);

  // Available food ship IDs for match-3 board refill
  const availableFoodShipIds = useMemo(() => {
    return allShips
      .filter(s => s.loadType === 'Glucose')
      .map(s => s.id);
  }, [allShips]);

  // Effective move budget
  const effectiveMoveBudget = dayConfig?.moveBudget ?? currentLevel?.moveBudget ?? moveBudget ?? DEFAULT_MOVE_BUDGET;

  // Match-3 hook
  const match3 = useMatch3(
    match3Config,
    allShips,
    availableFoodShipIds,
    effectiveMoveBudget,
  );

  // When match-3 drops food tiles, add them to store inventory
  useEffect(() => {
    if (match3.droppedFoodTiles.length === 0) return;

    // Compare with current match3Inventory to find new drops
    const currentCount = match3Inventory.length;
    const newDrops = match3.droppedFoodTiles.slice(currentCount);

    for (const foodTile of newDrops) {
      const ship = allShips.find(s => s.id === foodTile.shipId);
      if (ship) {
        addToMatch3Inventory(ship);
      }
    }
  }, [match3.droppedFoodTiles, match3Inventory.length, allShips, addToMatch3Inventory]);

  // Initialize pre-occupied ships from day config
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

        if (current < limits.min) {
          errors.push(`${seg}: need at least ${limits.min}g carbs`);
        }
        if (current > limits.max) {
          errors.push(`${seg}: too many carbs (max ${limits.max}g)`);
        }
      }
    } else if (dayConfig.carbRequirements) {
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
        const wasPlaced = active.data.current?.isPlaced;
        const instanceId = active.data.current?.instanceId;
        const isPreOccupied = placedShips.find(s => s.instanceId === instanceId)?.isPreOccupied;

        if (wasPlaced && instanceId && !isPreOccupied) {
          removeShip(instanceId);
        }
        return;
      }

      if (String(over.id).startsWith('inventory')) {
        const wasPlaced = active.data.current?.isPlaced;
        const instanceId = active.data.current?.instanceId;
        const isPreOccupied = placedShips.find(s => s.instanceId === instanceId)?.isPreOccupied;

        if (wasPlaced && instanceId && !isPreOccupied) {
          removeShip(instanceId);
        }
        return;
      }

      const slotMatch = String(over.id).match(/^slot-(\d+)$/);
      if (!slotMatch) return;

      const groupStartSlot = over.data.current?.groupStartSlot as number | undefined;
      const targetSlot = groupStartSlot ?? parseInt(slotMatch[1], 10);

      if (!validDropSlots.has(targetSlot)) return;

      const ship = active.data.current?.ship as Ship;
      const wasPlaced = active.data.current?.isPlaced;
      const oldInstanceId = active.data.current?.instanceId;

      if (wasPlaced && oldInstanceId) {
        removeShip(oldInstanceId);
      }

      const pos = slotNumberToPosition(targetSlot);

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
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
    >
      <div className="planning-phase">
        <div className="planning-phase__day-title">
          Day {currentDay}/{currentLevel.days}
        </div>
        <PlanningHeader
          isValid={planValidation.isValid}
          onSimulate={handleSimulate}
          bgPrediction={bgPrediction.bgHistory}
          fastInsulinCharges={dayConfig?.pancreasBoostCharges ?? 0}
          validationErrors={planValidation.errors}
        />

        <div className="planning-phase__slot-hint">
          Drag food into slots to meet carb goals!
        </div>
        <SlotGrid
          placedShips={placedShips}
          ships={allShips}
          validDropSlots={validDropSlots}
          highlightedSlots={new Set()}
          activeShip={activeShip}
          hoveredSlot={hoveredSlot}
          segmentValidation={planValidation.segments}
          blockedSlots={dayConfig?.blockedSlots}
          compact={true}
        />

        {match3Config && (
          <Match3Board
            match3={match3}
            allShips={allShips}
          />
        )}

        <ShipInventory
          allShips={allShips}
          match3Inventory={match3Inventory}
          availableInterventions={dayConfig?.availableInterventions || []}
          placedShips={placedShips}
        />
      </div>

      <DragOverlay dropAnimation={null}>
        {activeShip && <ShipCardOverlay ship={activeShip} />}
      </DragOverlay>
    </DndContext>
  );
}
