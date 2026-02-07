# 03 - Фаза симуляции

## Назначение

Фаза симуляции воспроизводит план дня во времени, моделируя работу метаболической системы. Игрок наблюдает за процессом и может ограниченно вмешиваться.

---

## Ключевые правила (согласованы)

### Разгрузка кораблей
- **Последовательно**: корабли разгружаются по очереди, слева направо
- **Равномерно**: груз выгружается равными порциями каждый час
- **Размер ≠ количество груза**: размер определяет только слоты и время разгрузки
- **Скорость = load / hours**: например, корабль L с 45g → 45/3 = 15g/час
- **В Liver**: глюкоза идёт в буфер печени, не напрямую в BG

### Поток глюкозы
```
Ship → Liver (buffer) → BG (blood) → Muscles (utilization)
```
**Примечание:** Kidney исключён на данном этапе

### Timing рядов и сегментов
```
Структура дня (18 часов, сквозная нумерация слотов 1-18):
├── Morning (6ч)
│   ├── Row 1: часы 1-3 (слоты 1,2,3)
│   └── Row 2: часы 4-6 (слоты 4,5,6)
├── Day (6ч)
│   ├── Row 3: часы 7-9 (слоты 7,8,9)
│   └── Row 4: часы 10-12 (слоты 10,11,12)
└── Evening (6ч)
    ├── Row 5: часы 13-15 (слоты 13,14,15)
    └── Row 6: часы 16-18 (слоты 16,17,18)
```

**Важно:**
- **Ряд всегда = 3 часа** (независимо от заполнения)
- Корабли выполняются последовательно внутри ряда
- Пустой ряд = 3 часа без еды/интервенций
- Смена ряда происходит после 3 часов (когда все корабли ряда завершены)

### Контролы
- **Ускорение симуляции** — 1x/2x/4x скорость (нет кнопки "пропустить до конца")
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

**Примечание по Body Diagram:**
- Kidney убран из диаграммы (не реализуется на данном этапе)
- Визуально: Muscles слева, Liver справа (поменяли местами)
- Показана связь Pancreas → Muscles (Pancreas реагирует на BG level, включая работу Muscles)

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

**Rates:** `[0, 150, 75]` — tier 0: stop, tier 1: normal 150/h, tier 2: reduced 75/h

**Rules (v0.18.1):**
| Priority | ID | Condition | Tier | Rate |
|----------|---|-----------|------|------|
| 1 | liver_boost_active | Liver Boost active | 2 | 75/h (max transfer) |
| 2 | bg_critical_stop | BG ≥ 300 | 0 | 0 (stop) |
| 3 | bg_high_reduce | BG ≥ 250 | 2 | 75/h (reduced) |
| 4 | bg_low_release | BG ≤ 100 | 1 | 150/h (normal) |
| 5 | default_normal | Default | 1 | 150/h |

**PassThrough mode:** когда liver ≥95% AND корабль разгружается → output = input rate (обходит правила)

**Деградация влияет на:** Уменьшение capacity (tier 1-5: 100/90/80/70/60)

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

**Роль:** Pancreas определяет tier инсулина по BG, передаёт Muscles. Muscles утилизируют глюкозу.

**Pancreas Rules (v0.18.0 — gradual response):**
| Priority | ID | Condition | Pancreas Tier | Muscle Drain |
|----------|---|-----------|---------------|-------------|
| 1 | bg_critical | BG ≥ 300 | 4 | 150/h |
| 2 | bg_very_high | BG ≥ 200 | 3 | 125/h |
| 3 | bg_high | BG ≥ 150 | 2 | 100/h |
| 4 | bg_low | BG ≤ 80 | 0 | 0 |
| 5 | default_basal | Default | 1 | 50/h |

**Muscle Drain Rates:** `[0, 50, 100, 125, 150, 200, 250]` (tiers 0-6)

**Modifiers applied after base tier:**
- **Fast Insulin** (+1 tier, ignores degradation, enables tier 6 = 250/h)
- **Exercise** (+1 tier, only if `baseTier ≥ 1` — prevents hypoglycemia) (v0.18.1)
- **Intense Exercise** (+1 tier permanent, only if `baseTier ≥ 1`) (v0.18.1)

**Деградация влияет на:** Уменьшение maxTier поджелудочной (tier 1-5: max 5/4/3/2/1)

**Exercise fix (v0.18.1):** `minBaseTier: 1` — exercise modifiers only apply when pancreas has already activated muscles (baseTier > 0). This prevents BG dropping below 70 due to exercise when pancreas tier is 0.

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

> **Примечание:** Kidney на данном этапе не реализуем. Секция оставлена для справки.

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

  // Modifier: +1 tier when exerciseEffect > 50 AND baseTier >= 1
  thresholds: [
    { level: 50, effect: { muscleRateTierBonus: 1 } },
  ];
}
```

### Intense Exercise Effect (v0.17.0)

```typescript
interface IntenseExerciseEffectConfig {
  capacity: number;           // 100
  decayRate: number;          // 0 (permanent — no decay)

  // Modifier: +1 tier when intenseExerciseEffect > 0 AND baseTier >= 1
  thresholds: [
    { level: 0, effect: { muscleRateTierBonus: 1 } },
  ];
}
```

> **Note:** intense_exercise provides a permanent +1 tier boost from the moment it loads until end of day (decayRate = 0).

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

## Решённые вопросы (дополнительно)

### Кнопки Boost (Liver/Pancreas)

1. ~~**Механика зарядов и cooldown**~~ → **Решено:**
   - Заряды расходуются при нажатии
   - После использования — cooldown перед следующим использованием
   - Cooldown: Liver Boost = 1 час, Pancreas Boost = 3 часа

2. ~~**Эффект Liver Boost**~~ → **Решено:**
   - Временно переключает скорость выброски глюкозы из Liver в BG на Tier 2

3. ~~**Эффект Pancreas Boost**~~ → **Решено:**
   - Временно переключает скорость muscle drain на 1 тир выше
   - Длительность эффекта: 1 час (как время разгрузки малого корабля)

### Визуализация симуляции

4. ~~**Текущий корабль**~~ → **Остаётся в сетке слотов** с индикатором разгрузки

5. ~~**Effect containers (Metformin/Exercise)**~~ → **Работают "под капотом"** без визуализации (на данном этапе)

6. ~~**Degradation containers**~~ → **Показываем** степень деградации органов во время симуляции

### Timing

7. ~~**Порядок операций в тике**~~ → **Всё параллельно** (разгрузка и правила выполняются одновременно)

---

## TODO

- [ ] Уточнить формулы rate tiers
- [ ] Определить exact timing правил
- [ ] Анимации переходов
- [ ] Звуки событий
