# 03 - Фаза симуляции

## Назначение

Фаза симуляции воспроизводит план дня во времени, моделируя работу метаболической системы. Игрок наблюдает за процессом и может ограниченно вмешиваться.

---

## Ключевые правила (согласованы)

### Разгрузка кораблей
- **Последовательно**: корабли разгружаются по очереди, слева направо
- **Равномерно**: глюкоза выгружается равными порциями каждый час
  - L (3 слота, 45g) → 15g/час × 3 часа
  - M (2 слота, 35g) → 17.5g/час × 2 часа
  - S (1 слот, 25g) → 25g/час × 1 час
- **В Liver**: глюкоза идёт в буфер печени, не напрямую в BG

### Поток глюкозы
```
Ship → Liver (buffer) → BG (blood) → Muscles (utilization)
                                   → Kidney (overflow)
```

### Timing рядов и сегментов
```
Структура дня (18 часов):
├── Morning (6ч)
│   ├── Row 1: часы 1-3 (слоты 0,1,2)
│   └── Row 2: часы 4-6 (слоты 0,1,2)
├── Day (6ч)
│   ├── Row 1: часы 7-9
│   └── Row 2: часы 10-12
└── Evening (6ч)
    ├── Row 1: часы 13-15
    └── Row 2: часы 16-18
```

**Важно:**
- **Ряд всегда = 3 часа** (независимо от заполнения)
- Корабли выполняются последовательно внутри ряда
- Пустой ряд = 3 часа без еды/интервенций
- Смена ряда происходит после 3 часов (когда все корабли ряда завершены)

### Контролы
- **Нет Skip** — только ускорение 1x/2x/4x
- **Анимация потока** — визуализация движения глюкозы между органами

---

## UI Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                         HEADER                                   │
│  ┌─────────────┐  ┌───────────────────┐  ┌──────────────────┐   │
│  │ Hour: 09:00 │  │ Morning ████░░░░░ │  │ [⏸][1x][2x][4x] │   │
│  │ Day 1       │  │ Progress: 3/18h   │  │                  │   │
│  └─────────────┘  └───────────────────┘  └──────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                     BODY DIAGRAM                                 │
│                                                                  │
│          ┌─────────────────────────────────────────┐            │
│          │              KIDNEY                      │            │
│          │            ┌───────┐                     │            │
│          │            │░░░░░░░│ 15/60               │            │
│          │            │░░░░░░░│                     │            │
│          │            └───┬───┘                     │            │
│          │                │ excrete                 │            │
│          │                ▼                         │            │
│          │  LIVER     ┌───────────┐                 │            │
│          │ ┌───────┐  │           │                 │            │
│          │ │███████│  │  BG: 147  │  ◄── Central   │            │
│          │ │███████│──│  ████████ │      container  │            │
│          │ │███████│  │  ████████ │                 │            │
│          │ └───────┘  │           │                 │            │
│          │   45/100   └─────┬─────┘                 │            │
│          │                  │                       │            │
│          │          ┌───────┴───────┐               │            │
│          │          │               │               │            │
│          │     ┌────▼────┐    ┌─────▼─────┐        │            │
│          │     │ PANCREAS│    │  MUSCLES  │        │            │
│          │     │  ◉◉◉○○  │    │  drain 50 │        │            │
│          │     │ fatigue │    │  /hour    │        │            │
│          │     └─────────┘    └───────────┘        │            │
│          └─────────────────────────────────────────┘            │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                      SHIP QUEUE                                  │
│  Morning:                                                        │
│  ┌─────┐ ┌───────────┐ ┌─────┐                                  │
│  │ 🥣  │ │    🍎     │ │     │  Row 1 (current)                 │
│  │▓▓▓░░│ │           │ │     │                                  │
│  └─────┘ └───────────┘ └─────┘                                  │
│  ┌─────┐ ┌─────┐ ┌─────┐                                        │
│  │ 💊  │ │     │ │     │        Row 2 (waiting)                 │
│  └─────┘ └─────┘ └─────┘                                        │
├─────────────────────────────────────────────────────────────────┤
│                    PLAYER CONTROLS                               │
│  ┌─────────────────────┐  ┌─────────────────────┐               │
│  │ 🔥 Boost Liver      │  │ 💪 Boost Muscles    │               │
│  │ Charges: 2/3        │  │ Charges: 1/2        │               │
│  │ [████████░░] ready  │  │ [░░░░░░░░░░] 2:30   │               │
│  └─────────────────────┘  └─────────────────────┘               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Движок симуляции

### Основные параметры

```typescript
interface SimulationConfig {
  ticksPerSegment: 6;        // 6 часов на сегмент
  totalTicks: 18;            // 18 часов на день
  tickDurationMs: 1000;      // Реальное время между тиками (при 1x)
}
```

### SimulationState

```typescript
interface SimulationState {
  // Время
  currentTick: number;       // 0-17
  currentSegment: DaySegment;
  currentHour: number;       // 6-23 (игровое время)

  // Контейнеры
  containers: {
    liver: ContainerState;
    bg: ContainerState;
    kidney: ContainerState;
    metforminEffect: ContainerState;
    exerciseEffect: ContainerState;
  };

  // Корабли
  shipQueue: QueuedShip[];   // Оставшиеся корабли
  unloadingShips: UnloadingShip[];  // Текущие разгрузки

  // История для графика
  bgHistory: number[];       // BG на каждом тике

  // Контролы
  isRunning: boolean;
  isPaused: boolean;
  speed: 1 | 2 | 4;

  // Вмешательства игрока
  interventions: {
    liverBoost: InterventionState;
    pancreasBoost: InterventionState;
  };
}

interface ContainerState {
  level: number;
  capacity: number;
  decayRate?: number;
}

interface QueuedShip {
  instanceId: string;
  shipId: string;
  segment: DaySegment;
  row: 0 | 1;
  startSlot: number;
}

interface UnloadingShip {
  instanceId: string;
  shipId: string;
  remainingTicks: number;
  totalTicks: number;
  loadPerTick: number;
}

interface InterventionState {
  charges: number;
  maxCharges: number;
  cooldownTicks: number;    // 0 = готово
  cooldownMax: number;
  isActive: boolean;
  activeDurationTicks: number;
}
```

---

## Simulation Engine

### Класс SimulationEngine

```typescript
class SimulationEngine {
  private state: SimulationState;
  private config: SimulationConfig;
  private organConfig: OrganConfig;
  private rules: Rule[];

  constructor(
    placedShips: PlacedShip[],
    organConfig: OrganConfig,
    rules: Rule[],
    initialDegradation: DegradationState
  ) {
    this.state = this.initializeState(placedShips, initialDegradation);
    // ...
  }

  tick(): SimulationState {
    // 1. Обработка разгрузки кораблей
    this.processShipUnloading();

    // 2. Проверка новых кораблей в очереди
    this.checkShipQueue();

    // 3. Decay эффект-контейнеров
    this.processEffectDecay();

    // 4. Обработка правил органов
    this.processOrganRules();

    // 5. Обновление кулдаунов вмешательств
    this.updateInterventionCooldowns();

    // 6. Запись истории
    this.state.bgHistory.push(this.state.containers.bg.level);

    // 7. Инкремент времени
    this.state.currentTick++;
    this.updateTimeInfo();

    return this.state;
  }

  // Вмешательства игрока
  activateLiverBoost(): boolean { /* ... */ }
  activatePancreasBoost(): boolean { /* ... */ }

  // Геттеры
  getState(): SimulationState { return this.state; }
  isComplete(): boolean { return this.state.currentTick >= 18; }
}
```

### Порядок обработки за тик

```
┌─────────────────────────────────────────────────────────┐
│                      TICK START                          │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ 1. SHIP UNLOADING                                        │
│    - Активные корабли выгружают load в target container │
│    - Уменьшается remainingTicks                          │
│    - Завершённые корабли удаляются                       │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ 2. SHIP QUEUE CHECK                                      │
│    - Если верхний ряд сегмента пуст, активируем корабли │
│    - Если сегмент завершён, переход к следующему        │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ 3. EFFECT DECAY                                          │
│    - metforminEffect -= decayRate                        │
│    - exerciseEffect -= decayRate                         │
│    - Clamp to 0                                          │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ 4. ORGAN RULES                                           │
│    a. LIVER → BG transfer                                │
│       - Проверить правила liver                          │
│       - Передать глюкозу в BG                            │
│                                                          │
│    b. PANCREAS → MUSCLES                                 │
│       - Определить rate tier по BG level                 │
│       - Учесть деградацию поджелудочной                  │
│       - Учесть Exercise эффект                           │
│       - Muscles забирают глюкозу из BG                   │
│                                                          │
│    c. KIDNEY                                             │
│       - Если BG > threshold, забрать в kidney            │
│       - Периодически сбрасывать из kidney                │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ 5. INTERVENTION COOLDOWNS                                │
│    - Уменьшить cooldownTicks                             │
│    - Уменьшить activeDurationTicks                       │
│    - Деактивировать если duration = 0                    │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ 6. RECORD HISTORY                                        │
│    - bgHistory.push(bg.level)                            │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ 7. INCREMENT TIME                                        │
│    - currentTick++                                       │
│    - Update segment if needed                            │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                       TICK END                           │
└─────────────────────────────────────────────────────────┘
```

---

## Органы и их логика

### Liver (Печень)

**Роль:** Буфер глюкозы, сглаживает поступление в кровь

```typescript
interface LiverConfig {
  capacity: number;              // 100
  transferRates: number[];       // [0, 30, 50] units/hour

  rules: [
    // При низком BG — сливаем из печени
    {
      condition: { container: 'bg', op: 'lte', value: 100 },
      action: { type: 'transfer', to: 'bg', rateTier: 1 }
    },
    // При высоком BG — останавливаем слив
    {
      condition: { container: 'bg', op: 'gte', value: 200 },
      action: { type: 'transfer', to: 'bg', rateTier: 0 }
    },
    // При переполнении печени — аварийный сброс
    {
      condition: { container: 'liver', op: 'gte', value: 100 },
      action: { type: 'transfer', to: 'bg', rateTier: 2 }
    }
  ];
}
```

**Деградация влияет на:** Уменьшение capacity

### BG Container (Кровь)

**Роль:** Центральный параметр, отражает уровень сахара

```typescript
interface BGConfig {
  capacity: number;           // 400 (теоретический максимум)
  initialLevel: number;       // 100
  thresholds: {
    low: number;              // 70  — гипогликемия
    target: number;           // 100 — норма
    high: number;             // 200 — гипергликемия
    critical: number;         // 300 — критический
  };
}
```

### Pancreas + Muscles (Поджелудочная + Мышцы)

**Роль:** Pancreas управляет скоростью, Muscles утилизируют глюкозу

```typescript
interface PancreasConfig {
  baseRateTier: number;       // 3 (номинальный)
  maxRateTier: number;        // 5

  // Правила активации
  rules: [
    {
      condition: { container: 'bg', op: 'gte', value: 150 },
      action: { type: 'setMuscleTier', tier: 3 }
    },
    {
      condition: { container: 'bg', op: 'lte', value: 100 },
      action: { type: 'setMuscleTier', tier: 0 }
    }
  ];
}

interface MusclesConfig {
  drainRates: number[];       // [0, 20, 30, 50, 70, 90] units/hour
}
```

**Деградация влияет на:** Уменьшение maxRateTier

**Exercise влияет на:** +1 к текущему tier

### Kidney (Почки)

**Роль:** Аварийный сброс при высоком сахаре

```typescript
interface KidneyConfig {
  capacity: number;           // 60
  intakeRates: number[];      // [0, 30, 50]
  excreteInterval: number;    // 3 (каждые 3 тика)
  excreteAmount: number;      // 30% от kidney level

  rules: [
    {
      condition: { container: 'bg', op: 'gte', value: 250 },
      action: { type: 'intake', rateTier: 1 }
    },
    {
      condition: { container: 'kidney', op: 'gte', value: 30 },  // 50%
      action: { type: 'excrete', amount: '30%' }
    }
  ];
}
```

---

## Effect Containers

### Metformin Effect

```typescript
interface MetforminEffectConfig {
  capacity: number;           // 120
  decayRate: number;          // 7 units/hour (~17 часов до 0)

  thresholds: [
    { level: 20, effect: { suppressDegradationTiers: 1 } },
    { level: 40, effect: { suppressDegradationTiers: 2 } },
    { level: 60, effect: { suppressDegradationTiers: 3 } },
    { level: 80, effect: { suppressDegradationTiers: 4 } },
    { level: 100, effect: { suppressDegradationTiers: 5 } },
  ];
}
```

### Exercise Effect

```typescript
interface ExerciseEffectConfig {
  capacity: number;           // 100
  decayRate: number;          // 50 units/hour (~2 часа)

  thresholds: [
    { level: 50, effect: { muscleRateTierBonus: 1 } },
    { level: 80, effect: { muscleRateTierBonus: 2 } },
  ];
}
```

---

## Вмешательство игрока

### Liver Boost

**Действие:** Ускоренный сброс глюкозы из печени в BG

```typescript
interface LiverBoostConfig {
  maxCharges: number;         // 3
  cooldownTicks: number;      // 3
  duration: number;           // 1 тик
  rateTier: number;           // 2 (ускоренный)
}
```

**UX:**
1. Нажатие на кнопку/печень
2. Анимация "рычага"
3. Ускоренный поток глюкозы
4. Кулдаун начинается

### Pancreas Boost

**Действие:** Ускоренная работа мышц

```typescript
interface PancreasBoostConfig {
  maxCharges: number;         // 2
  cooldownTicks: number;      // 3
  duration: number;           // 2 тика
  tierBonus: number;          // +2
}
```

---

## Game Loop (React)

```typescript
// hooks/useGameLoop.ts
function useGameLoop(engine: SimulationEngine | null) {
  const { speed, isPaused, updateSimulation, endSimulation } = useGameStore();

  useEffect(() => {
    if (!engine || isPaused) return;

    const tickDuration = 1000 / speed;  // 1000ms at 1x, 500ms at 2x, 250ms at 4x

    const interval = setInterval(() => {
      if (engine.isComplete()) {
        endSimulation();
        return;
      }

      const newState = engine.tick();
      updateSimulation(newState);
    }, tickDuration);

    return () => clearInterval(interval);
  }, [engine, speed, isPaused]);
}
```

---

## Визуализация

### Container View

```
┌─────────────────┐
│                 │  ◄── capacity (100%)
│                 │
│█████████████████│  ◄── current level
│█████████████████│
│█████████████████│
│█████████████████│
└─────────────────┘
      45/100

Цвета:
- Синий: нормальный уровень
- Оранжевый: приближается к переполнению
- Красный: переполнение
```

### BG Container (центральный)

```
     ┌─────────────────┐
     │    300 ────────│── critical (red zone)
     │                 │
     │    200 ────────│── high (orange zone)
     │                 │
     │    ███ 147 ────│── current (indicator)
     │    ███         │
     │    100 ────────│── target (green zone)
     │                 │
     │    70  ────────│── low (yellow zone)
     └─────────────────┘
```

### Ship Unloading Animation

```
Корабль в слоте:
┌─────────┐
│  🥣     │
│ ▓▓▓░░░░ │  ◄── progress bar
│  2/3h   │
└─────────┘

Поток к контейнеру:
🥣 ──●──●──●──► [Liver]
      glucose particles
```

---

## Speed Controls

| Speed | Tick Duration | Real time for 18h |
|-------|---------------|-------------------|
| 1x    | 1000ms        | 18 секунд         |
| 2x    | 500ms         | 9 секунд          |
| 4x    | 250ms         | 4.5 секунды       |

Кнопка паузы останавливает interval, состояние сохраняется.

---

## Компоненты

### SimulationPhase.tsx
- Основной контейнер
- useGameLoop hook
- Layout

### SimulationHeader.tsx
- Время (Hour: 09:00)
- Прогресс (Morning ████░░░░░)
- Speed controls

### BodyDiagram.tsx
- SVG схема органов
- Позиционирование ContainerView и OrganView

### ContainerView.tsx
- Визуализация уровня
- Анимация изменений (framer-motion)

### OrganView.tsx
- Иконка органа
- Индикатор состояния/деградации

### ShipQueue.tsx
- Текущий сегмент
- Корабли в рядах
- Progress bar разгрузки

### PlayerControls.tsx
- Кнопки boost
- Счётчик зарядов
- Cooldown indicator

---

## Решённые вопросы

1. ~~**Визуализация потока глюкозы**~~ → **Анимация потока** (частицы/линии между органами, в polish slice)

2. ~~**Параллельная разгрузка**~~ → **По очереди** (слева направо, один корабль за другим в ряду)

3. ~~**Skip to end**~~ → **Нет**, только ускорение 1x/2x/4x

4. **Replay**: Можно ли перемотать назад? → Не для прототипа

---

## Открытые вопросы

### Кнопки Boost (Liver/Pancreas)

1. **Механика зарядов и cooldown**: Правильно ли понимаю?
   - Заряды расходуются при нажатии (например, 3 заряда liverBoost на уровень)
   - После использования — cooldown N тиков перед следующим использованием
   - Или cooldown только если заряды закончились?

2. **Эффект Liver Boost**: Что именно делает?
   - Временно увеличивает transfer rate из Liver в BG?
   - Или что-то другое?

3. **Эффект Pancreas Boost**: Что именно делает?
   - Временно увеличивает muscle drain (утилизацию глюкозы)?
   - На сколько тиков действует эффект?

### Визуализация симуляции

4. **Текущий корабль**: Корабль, который сейчас разгружается — он показан отдельно (в специальной зоне) или остаётся в сетке слотов с индикатором прогресса разгрузки?

5. **Effect containers (Metformin/Exercise)**: Они показаны на UI во время симуляции как отдельные контейнеры или работают "под капотом" без визуализации?

6. **Degradation containers**: Показываем ли деградацию органов во время симуляции или только в Results?

### Timing

7. **Порядок операций в тике**: В каком порядке выполняются операции за один тик (час)?
   - Сначала разгрузка корабля, потом правила?
   - Или сначала правила, потом разгрузка?
   - Или всё параллельно?

---

## TODO

- [ ] Уточнить формулы rate tiers
- [ ] Определить exact timing правил
- [ ] Анимации переходов
- [ ] Звуки событий
