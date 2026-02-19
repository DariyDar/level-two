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
import type { Ship, Intervention, Medication } from '../../core/types';
import { useGameStore, getDayConfig, selectKcalUsed, selectWpUsed } from '../../store/gameStore';
import { loadFoods, loadLevel, loadInterventions, loadMedications } from '../../config/loader';
import { computeMedicationModifiers } from '../../core/cubeEngine';
import { DEFAULT_MEDICATION_MODIFIERS } from '../../core/types';
import { BgGraph, pointerToColumn } from '../graph';
import { PlanningHeader } from './PlanningHeader';
import { ShipInventory } from './ShipInventory';
import { InterventionInventory } from './InterventionInventory';
import { MedicationPanel } from './MedicationPanel';
import { ShipCardOverlay } from './ShipCard';
import { InterventionCardOverlay } from './InterventionCard';
import './PlanningPhase.css';

export function PlanningPhase() {
  const {
    placedFoods,
    placeFood,
    removeFood,
    placedInterventions,
    placeIntervention,
    removeIntervention,
    activeMedications,
    toggleMedication,
    clearFoods,
    currentLevel,
    currentDay,
    setLevel,
    goToDay,
    settings,
    updateSettings,
  } = useGameStore();

  const [allShips, setAllShips] = useState<Ship[]>([]);
  const [allInterventions, setAllInterventions] = useState<Intervention[]>([]);
  const [allMedications, setAllMedications] = useState<Medication[]>([]);
  const [activeShip, setActiveShip] = useState<Ship | null>(null);
  const [activeIntervention, setActiveIntervention] = useState<Intervention | null>(null);
  const [previewColumn, setPreviewColumn] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const graphRef = useRef<HTMLDivElement>(null);

  // Load configs on mount
  useEffect(() => {
    async function loadConfigs() {
      try {
        const [ships, interventions, medications] = await Promise.all([
          loadFoods(),
          loadInterventions(),
          loadMedications(),
        ]);
        setAllShips(ships);
        setAllInterventions(interventions);
        setAllMedications(medications);

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

  // Compute medication modifiers from active medications
  const medicationModifiers = useMemo(
    () => activeMedications.length > 0
      ? computeMedicationModifiers(activeMedications, allMedications)
      : DEFAULT_MEDICATION_MODIFIERS,
    [activeMedications, allMedications]
  );

  const kcalUsed = useMemo(
    () => selectKcalUsed(placedFoods, allShips),
    [placedFoods, allShips]
  );

  const wpUsed = useMemo(
    () => selectWpUsed(placedFoods, allShips, placedInterventions, allInterventions),
    [placedFoods, allShips, placedInterventions, allInterventions]
  );

  const kcalBudget = dayConfig?.kcalBudget ?? 2000;
  const wpBudget = dayConfig?.wpBudget ?? 16;
  const effectiveWpBudget = wpBudget + medicationModifiers.wpBonus;
  const wpRemaining = effectiveWpBudget - wpUsed;

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
    const intervention = event.active.data.current?.intervention as Intervention | undefined;
    if (ship) {
      setActiveShip(ship);
      setActiveIntervention(null);
    } else if (intervention) {
      setActiveIntervention(intervention);
      setActiveShip(null);
    }
  }, []);

  const handleDragMove = useCallback((_event: DragMoveEvent) => {
    if (!graphRef.current || (!activeShip && !activeIntervention)) {
      setPreviewColumn(null);
      return;
    }

    const graphEl = graphRef.current.querySelector('.bg-graph') as HTMLElement;
    if (!graphEl) {
      setPreviewColumn(null);
      return;
    }

    const { delta, activatorEvent } = _event;
    if (activatorEvent && 'clientX' in activatorEvent) {
      const pointerX = (activatorEvent as PointerEvent).clientX + delta.x;
      const col = pointerToColumn(graphEl, pointerX);
      setPreviewColumn(col);
    }
  }, [activeShip, activeIntervention]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      setActiveShip(null);
      setActiveIntervention(null);
      setPreviewColumn(null);

      if (!over || over.id !== 'bg-graph') return;

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

      // Check if it's a food or intervention drop
      const isIntervention = active.data.current?.isIntervention === true;

      if (isIntervention) {
        const intervention = active.data.current?.intervention as Intervention | undefined;
        if (!intervention) return;
        if (intervention.wpCost > wpRemaining) return;
        placeIntervention(intervention.id, col);
      } else {
        const ship = active.data.current?.ship as Ship | undefined;
        if (!ship) return;
        const shipWp = ship.wpCost ?? 0;
        if (shipWp > wpRemaining) return;
        placeFood(ship.id, col);
      }
    },
    [placeFood, placeIntervention, wpRemaining]
  );

  const handleFoodClick = useCallback(
    (placementId: string) => {
      removeFood(placementId);
    },
    [removeFood]
  );

  const handleInterventionClick = useCallback(
    (placementId: string) => {
      removeIntervention(placementId);
    },
    [removeIntervention]
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
          medicationModifiers={medicationModifiers}
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
            placedInterventions={placedInterventions}
            allInterventions={allInterventions}
            settings={settings}
            medicationModifiers={medicationModifiers}
            previewShip={activeShip}
            previewIntervention={activeIntervention}
            previewColumn={previewColumn}
            onFoodClick={handleFoodClick}
            onInterventionClick={handleInterventionClick}
          />

          <MedicationPanel
            allMedications={allMedications}
            availableMedicationIds={dayConfig?.availableMedications ?? []}
            activeMedications={activeMedications}
            onToggle={toggleMedication}
          />

          <ShipInventory
            allShips={allShips}
            availableFoods={dayConfig?.availableFoods || []}
            placedFoods={placedFoods}
            wpRemaining={wpRemaining}
          />

          <InterventionInventory
            allInterventions={allInterventions}
            availableInterventions={dayConfig?.availableInterventions || []}
            placedInterventions={placedInterventions}
            wpRemaining={wpRemaining}
          />

          {/* Day navigation (cheat buttons) */}
          <div className="planning-phase__day-nav">
            {Array.from({ length: currentLevel.days }, (_, i) => i + 1).map(day => (
              <button
                key={day}
                className={`planning-phase__day-btn ${day === currentDay ? 'planning-phase__day-btn--active' : ''}`}
                onClick={() => goToDay(day)}
                disabled={day === currentDay}
              >
                Day {day}
              </button>
            ))}
          </div>
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeShip && <ShipCardOverlay ship={activeShip} />}
        {activeIntervention && <InterventionCardOverlay intervention={activeIntervention} />}
      </DragOverlay>
    </DndContext>
  );
}
