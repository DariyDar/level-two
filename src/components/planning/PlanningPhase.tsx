import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { DragStartEvent, DragEndEvent, DragMoveEvent } from '@dnd-kit/core';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { Ship } from '../../core/types';
import { useGameStore, getDayConfig, selectKcalUsed, selectWpUsed } from '../../store/gameStore';
import { loadFoods, loadLevel } from '../../config/loader';
import { BgGraph, pointerToColumn } from '../graph';
import { PlanningHeader } from './PlanningHeader';
import { ShipInventory } from './ShipInventory';
import { ShipCardOverlay } from './ShipCard';
import './PlanningPhase.css';

export function PlanningPhase() {
  const {
    placedFoods,
    placeFood,
    removeFood,
    clearFoods,
    currentLevel,
    currentDay,
    setLevel,
    settings,
    updateSettings,
  } = useGameStore();

  const [allShips, setAllShips] = useState<Ship[]>([]);
  const [activeShip, setActiveShip] = useState<Ship | null>(null);
  const [previewColumn, setPreviewColumn] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const graphRef = useRef<HTMLDivElement>(null);

  // Load configs on mount
  useEffect(() => {
    async function loadConfigs() {
      try {
        const ships = await loadFoods();
        setAllShips(ships);

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

  const kcalUsed = useMemo(
    () => selectKcalUsed(placedFoods, allShips),
    [placedFoods, allShips]
  );

  const wpUsed = useMemo(
    () => selectWpUsed(placedFoods, allShips),
    [placedFoods, allShips]
  );

  const kcalBudget = dayConfig?.kcalBudget ?? 2000;
  const wpBudget = dayConfig?.wpBudget ?? 10;
  const wpRemaining = wpBudget - wpUsed;

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const ship = event.active.data.current?.ship as Ship | undefined;
    if (!ship) return;
    setActiveShip(ship);
  }, []);

  const handleDragMove = useCallback((_event: DragMoveEvent) => {
    // Compute column from pointer position over graph
    if (!graphRef.current || !activeShip) {
      setPreviewColumn(null);
      return;
    }

    // Use activatorEvent from the drag event to get current pointer position
    // Since DragMoveEvent doesn't directly give pointer coords,
    // we rely on the over + graph element
    const graphEl = graphRef.current.querySelector('.bg-graph') as HTMLElement;
    if (!graphEl) {
      setPreviewColumn(null);
      return;
    }

    // Get the droppable rect and compute from the delta
    const { delta, activatorEvent } = _event;
    if (activatorEvent && 'clientX' in activatorEvent) {
      const pointerX = (activatorEvent as PointerEvent).clientX + delta.x;
      const col = pointerToColumn(graphEl, pointerX);
      setPreviewColumn(col);
    }
  }, [activeShip]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      setActiveShip(null);
      setPreviewColumn(null);

      if (!over || over.id !== 'bg-graph') return;

      const ship = active.data.current?.ship as Ship | undefined;
      if (!ship) return;

      // Check WP budget
      const shipWp = ship.wpCost ?? 0;
      if (shipWp > wpRemaining) return;

      // Compute drop column from pointer position
      const graphEl = document.querySelector('.bg-graph') as HTMLElement;
      if (!graphEl) return;

      const { activatorEvent, delta } = event;
      let col: number | null = null;
      if (activatorEvent && 'clientX' in activatorEvent) {
        const pointerX = (activatorEvent as PointerEvent).clientX + delta.x;
        col = pointerToColumn(graphEl, pointerX);
      }

      if (col == null) return;

      placeFood(ship.id, col);
    },
    [placeFood, wpRemaining]
  );

  const handleFoodClick = useCallback(
    (placementId: string) => {
      removeFood(placementId);
    },
    [removeFood]
  );

  const handleToggleTimeFormat = useCallback(() => {
    updateSettings({
      timeFormat: settings.timeFormat === '12h' ? '24h' : '12h',
    });
  }, [settings.timeFormat, updateSettings]);

  const handleToggleBgUnit = useCallback(() => {
    updateSettings({
      bgUnit: settings.bgUnit === 'mg/dL' ? 'mmol/L' : 'mg/dL',
    });
  }, [settings.bgUnit, updateSettings]);

  const handleToggleDecay = useCallback(() => {
    updateSettings({ decayEnabled: !settings.decayEnabled });
    clearFoods();
  }, [settings.decayEnabled, updateSettings, clearFoods]);

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
      <div className="planning-phase" ref={graphRef}>
        <PlanningHeader
          dayLabel={`Day ${currentDay}/${currentLevel.days}`}
          kcalUsed={kcalUsed}
          kcalBudget={kcalBudget}
          wpUsed={wpUsed}
          wpBudget={wpBudget}
          settings={settings}
          onToggleTimeFormat={handleToggleTimeFormat}
          onToggleBgUnit={handleToggleBgUnit}
          onToggleDecay={handleToggleDecay}
        />

        <div className="planning-phase__hint">
          Drag food cards onto the graph to plan your meals!
        </div>

        <div className="planning-phase__content">
          <BgGraph
            placedFoods={placedFoods}
            allShips={allShips}
            settings={settings}
            previewShip={activeShip}
            previewColumn={previewColumn}
            onFoodClick={handleFoodClick}
          />

          <ShipInventory
            allShips={allShips}
            availableFoods={dayConfig?.availableFoods || []}
            placedFoods={placedFoods}
            wpRemaining={wpRemaining}
          />
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeShip && <ShipCardOverlay ship={activeShip} />}
      </DragOverlay>
    </DndContext>
  );
}
