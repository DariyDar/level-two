# 01 - Архитектура проекта

## Технологический стек

```
┌─────────────────────────────────────────────────────────┐
│                        UI Layer                         │
│  React 18 + Framer Motion + @dnd-kit                   │
├─────────────────────────────────────────────────────────┤
│                     State Layer                         │
│  Zustand (with persist middleware)                      │
├─────────────────────────────────────────────────────────┤
│                     Core Layer                          │
│  Pure TypeScript (framework-agnostic)                   │
│  SimulationEngine, RuleEvaluator, ResultsCalculator     │
├─────────────────────────────────────────────────────────┤
│                   Configuration                         │
│  Ships, Organs, Levels (JSON/TS)                        │
└─────────────────────────────────────────────────────────┘
```

### Зависимости

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "zustand": "^4.5.0",
    "framer-motion": "^11.0.0",
    "@dnd-kit/core": "^6.1.0",
    "@dnd-kit/sortable": "^8.0.0",
    "@dnd-kit/utilities": "^3.2.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "vitest": "^1.2.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0"
  }
}
```

---

## Структура проекта

```
port-management/
│
├── src/
│   │
│   ├── core/                        # Игровая логика (чистый TS)
│   │   ├── types.ts                 # Все интерфейсы и типы
│   │   ├── simulation/
│   │   │   ├── SimulationEngine.ts  # Главный движок
│   │   │   ├── ContainerManager.ts  # Управление контейнерами
│   │   │   ├── ShipProcessor.ts     # Обработка разгрузки
│   │   │   └── RuleEvaluator.ts     # Система правил
│   │   ├── planning/
│   │   │   └── PlanValidator.ts     # Валидация плана
│   │   └── results/
│   │       ├── DegradationCalc.ts   # Расчёт деградации
│   │       └── RankCalculator.ts    # Расчёт ранга
│   │
│   ├── store/                       # Zustand stores
│   │   ├── gameStore.ts             # Главный store
│   │   ├── selectors.ts             # Селекторы
│   │   └── actions.ts               # Действия
│   │
│   ├── components/                  # React компоненты
│   │   ├── App.tsx
│   │   ├── planning/
│   │   │   ├── PlanningPhase.tsx
│   │   │   ├── DayTimeline.tsx
│   │   │   ├── Segment.tsx
│   │   │   ├── SlotGrid.tsx
│   │   │   ├── Slot.tsx
│   │   │   ├── ShipCard.tsx
│   │   │   ├── ShipInventory.tsx
│   │   │   └── PlanningHeader.tsx
│   │   ├── simulation/
│   │   │   ├── SimulationPhase.tsx
│   │   │   ├── BodyDiagram.tsx
│   │   │   ├── ContainerView.tsx
│   │   │   ├── OrganView.tsx
│   │   │   ├── ShipQueue.tsx
│   │   │   ├── TimelineProgress.tsx
│   │   │   ├── PlayerControls.tsx
│   │   │   └── SimulationHeader.tsx
│   │   ├── results/
│   │   │   ├── ResultsPhase.tsx
│   │   │   ├── BGGraph.tsx
│   │   │   ├── DegradationDisplay.tsx
│   │   │   ├── RankDisplay.tsx
│   │   │   └── ActionButtons.tsx
│   │   └── shared/
│   │       ├── Header.tsx
│   │       ├── ProgressBar.tsx
│   │       ├── Container.tsx
│   │       └── Modal.tsx
│   │
│   ├── hooks/                       # Custom React hooks
│   │   ├── useSimulation.ts
│   │   ├── useGameLoop.ts
│   │   └── useDragDrop.ts
│   │
│   ├── config/                      # Загрузчики конфигов
│   │   ├── loader.ts                # Загрузка JSON конфигов
│   │   ├── types.ts                 # Типы для конфигов
│   │   └── validation.ts            # Валидация конфигов
│   │
│   ├── utils/                       # Утилиты
│   │   ├── helpers.ts
│   │   └── constants.ts
│   │
│   ├── styles/                      # Стили
│   │   ├── global.css
│   │   └── variables.css
│   │
│   └── main.tsx                     # Entry point
│
├── tests/
│   ├── simulation/
│   │   ├── SimulationEngine.test.ts
│   │   └── RuleEvaluator.test.ts
│   └── results/
│       └── DegradationCalc.test.ts
│
├── public/
│   ├── assets/                      # Будущие ассеты
│   └── data/                        # JSON конфиги
│       ├── foods.json               # Корабли с едой
│       ├── interventions.json       # Интервенции
│       ├── organs.json              # Параметры органов
│       └── levels/                  # Уровни
│           ├── level-01.json
│           ├── level-02.json
│           └── ...
│
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── vitest.config.ts
```

---

## Data Flow

### Общий поток данных

```
┌──────────────┐
│ JSON Config  │ ─── foods.json, interventions.json, organs.json, levels/*.json
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Store      │ ─── gameStore (Zustand)
│  (Zustand)   │     - phase: Planning | Simulation | Results
└──────┬───────┘     - placedShips: PlacedShip[]
       │             - simulation: SimulationState
       │             - results: DayResults
       │             - degradation: {...}
       ▼
┌──────────────┐
│  Components  │ ─── React UI
└──────────────┘
       │
       │ actions
       ▼
┌──────────────┐
│    Core      │ ─── SimulationEngine, Validators, Calculators
└──────────────┘
       │
       │ updates
       ▼
┌──────────────┐
│   Store      │
└──────────────┘
```

### Planning Phase Flow

```
User drags ship
       │
       ▼
┌─────────────────┐
│ @dnd-kit events │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ store.placeShip │ ─── Добавляет ship в placedShips[]
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ PlanValidator   │ ─── Проверяет min carbs
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ UI updates      │ ─── Кнопка Simulate активна/неактивна
└─────────────────┘
```

### Simulation Phase Flow

```
┌─────────────────┐
│ Start Simulation│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ SimulationEngine│
│   .initialize() │ ─── Создаёт начальное состояние из placedShips
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Game Loop      │ ─── setInterval / requestAnimationFrame
│  (useGameLoop)  │
└────────┬────────┘
         │
    every tick
         │
         ▼
┌─────────────────┐
│ SimulationEngine│
│     .tick()     │
└────────┬────────┘
         │
         ├──► ShipProcessor.processUnloading()
         │         │
         │         ▼
         │    Корабли разгружают cargo в контейнеры
         │
         ├──► ContainerManager.processDecay()
         │         │
         │         ▼
         │    Effect containers теряют вещество
         │
         ├──► RuleEvaluator.evaluateAll()
         │         │
         │         ▼
         │    Проверяются триггеры, выполняются actions
         │
         └──► Store.updateSimulation()
                   │
                   ▼
              UI обновляется
```

### Results Phase Flow

```
┌─────────────────┐
│ Simulation ends │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ DegradationCalc │ ─── Анализирует bgHistory
│   .calculate()  │     Считает время выше порога
└────────┬────────┘     Распределяет damage по органам
         │
         ▼
┌─────────────────┐
│ RankCalculator  │ ─── Определяет ранг 1-5
│   .calculate()  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Store.setResults│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Results UI      │
└─────────────────┘
```

---

## State Management (Zustand)

### Store Structure

```typescript
interface GameStore {
  // === State ===
  phase: GamePhase;
  day: number;

  // Planning
  placedShips: PlacedShip[];
  availableShips: Ship[];

  // Simulation
  simulation: SimulationState | null;

  // Results
  results: DayResults | null;

  // Persistent (между днями)
  degradation: {
    liver: number;
    pancreas: number;
    kidney: number;
  };

  // === Actions ===
  // Planning
  placeShip: (ship: Ship, segment: DaySegment, row: number, slot: number) => void;
  removeShip: (shipInstanceId: string) => void;
  clearPlan: () => void;

  // Phase transitions
  startSimulation: () => void;
  endSimulation: () => void;
  startNextDay: () => void;
  retryDay: () => void;

  // Simulation controls
  pauseSimulation: () => void;
  resumeSimulation: () => void;
  setSpeed: (speed: 1 | 2 | 4) => void;

  // Player interventions
  boostLiver: () => void;
  boostPancreas: () => void;

  // Internal
  tick: () => void;
  updateContainers: (containers: ContainerStates) => void;
}
```

### Persistence

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      // ... state and actions
    }),
    {
      name: 'port-management-save',
      partialize: (state) => ({
        // Сохраняем только то, что нужно между сессиями
        day: state.day,
        degradation: state.degradation,
        // НЕ сохраняем: simulation, phase (начинаем с Planning)
      }),
    }
  )
);
```

---

## Компонентная архитектура

### Иерархия компонентов

```
App
├── Header (shared)
│
├── [phase === 'Planning']
│   └── PlanningPhase
│       ├── PlanningHeader
│       │   ├── CarbsMeter
│       │   └── SimulateButton
│       ├── DayTimeline
│       │   ├── Segment (Morning)
│       │   │   └── SlotGrid
│       │   │       └── Slot (×6)
│       │   ├── Segment (Day)
│       │   └── Segment (Evening)
│       └── ShipInventory
│           ├── TabSelector (Food | Interventions)
│           └── ShipCard (×n)
│
├── [phase === 'Simulation']
│   └── SimulationPhase
│       ├── SimulationHeader
│       │   ├── TimeDisplay
│       │   └── SpeedControls
│       ├── BodyDiagram
│       │   ├── ContainerView (Liver)
│       │   ├── ContainerView (BG) [central]
│       │   ├── OrganView (Pancreas)
│       │   ├── OrganView (Muscles)
│       │   └── ContainerView (Kidney)
│       ├── ShipQueue
│       │   └── ShipCard (current unloading)
│       └── PlayerControls
│           ├── BoostLiverButton
│           └── BoostPancreasButton
│
└── [phase === 'Results']
    └── ResultsPhase
        ├── BGGraph
        ├── StatsPanel
        │   ├── AverageBG
        │   └── ExcessBG
        ├── DegradationDisplay
        │   ├── OrganDegradation (Liver)
        │   └── OrganDegradation (Pancreas)
        ├── RankDisplay
        └── ActionButtons
            ├── ContinueButton
            └── RetryButton
```

---

## Решённые вопросы по архитектуре

1. **Тестирование**: Нужно ли интеграционное тестирование UI или достаточно unit tests для core? → Отложено

2. **Оптимизация**: Стоит ли использовать React.memo / useMemo для компонентов симуляции? → По необходимости

3. **Анимации**: Framer Motion для всего или только для ключевых переходов? → Ключевые переходы

4. ~~**Mobile**~~ → **Mobile First** — делаем адаптацию сразу

---

## TODO

- [ ] Детализировать интерфейсы в 06-data-models.md
- [ ] Описать систему правил подробнее
- [ ] Определить формат конфигов
