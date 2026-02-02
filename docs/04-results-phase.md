# 04 - Фаза результатов

## Назначение

Фаза результатов подводит итоги дня: показывает график BG, рассчитывает деградацию органов и присваивает ранг прохождения.

---

## UI Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                         HEADER                                   │
│                      Day 1 Complete                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                       BG JOURNAL                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │     300 ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ critical││
│  │                                                              ││
│  │     200 ─ ─ ─ ─ ─ ─ ─ ─╱╲─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ high   ││
│  │                       ╱  ╲        ╱╲                         ││
│  │         ╱╲          ╱    ╲      ╱  ╲                         ││
│  │        ╱  ╲        ╱      ╲    ╱    ╲                        ││
│  │     100 ──╱────╲──╱────────╲──╱──────╲─────────────── target ││
│  │          ╱      ╲╱          ╲╱        ╲______                ││
│  │     70  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ low   ││
│  │         06  08  10  12  14  16  18  20  22  00               ││
│  │         ├── Morning ──┼─── Day ────┼── Evening ──┤           ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────┐  ┌─────────────────────┐                │
│  │ Average BG: 147     │  │ Excess BG: ●●●●○    │                │
│  │ (target: 100)       │  │ Time high: 4.5h     │                │
│  └─────────────────────┘  └─────────────────────┘                │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                      BODY HEALTH                                 │
│                                                                  │
│     ┌─────────────────────────────────────────────────────┐     │
│     │                                                      │     │
│     │   LIVER                          KIDNEY             │     │
│     │   ┌─────┐                        ┌─────┐            │     │
│     │   │░░░░░│ ●●○○○                  │     │ ○○○○○      │     │
│     │   └─────┘ +1 tier                └─────┘ OK         │     │
│     │                                                      │     │
│     │           ┌───────────┐                              │     │
│     │           │  BG: 147  │                              │     │
│     │           └───────────┘                              │     │
│     │                                                      │     │
│     │   PANCREAS                                           │     │
│     │   ┌─────┐                                            │     │
│     │   │  ◉  │ ●●●○○                                      │     │
│     │   └─────┘ +1 tier                                    │     │
│     │                                                      │     │
│     └─────────────────────────────────────────────────────┘     │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                         RANK                                     │
│                                                                  │
│                      ★ ★ ★ ☆ ☆                                  │
│                      Rank: 3/5                                   │
│                    "Day passed!"                                 │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│         ┌──────────────┐       ┌──────────────┐                 │
│         │   Continue   │       │    Retry     │                 │
│         └──────────────┘       └──────────────┘                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

> **Примечание:** В UI Layout отображаются также мышцы. Лейаут органов идентичен фазе симуляции.

---

## Расчёт результатов

### Входные данные

```typescript
interface SimulationHistory {
  bgHistory: number[];           // BG на каждом тике (18 значений)
  interventionsUsed: {
    liverBoosts: number;
    pancreasBoosts: number;
  };
  shipsProcessed: number;
}
```

### Метрики

```typescript
interface DayMetrics {
  // BG статистика
  averageBG: number;
  minBG: number;
  maxBG: number;
  timeInRange: number;           // Тики в диапазоне 70-200
  timeAboveHigh: number;         // Тики с BG > 200
  timeAboveCritical: number;     // Тики с BG > 300
  timeBelowLow: number;          // Тики с BG < 70

  // Excess BG (накопленный избыток)
  excessBG: number;              // Сумма (BG - 200) для тиков где BG > 200
}
```

### Расчёт метрик

```typescript
function calculateMetrics(bgHistory: number[]): DayMetrics {
  const thresholds = {
    low: 70,
    target: 100,
    high: 200,
    critical: 300,
  };

  let sum = 0;
  let min = Infinity;
  let max = -Infinity;
  let timeInRange = 0;
  let timeAboveHigh = 0;
  let timeAboveCritical = 0;
  let timeBelowLow = 0;
  let excessBG = 0;

  for (const bg of bgHistory) {
    sum += bg;
    min = Math.min(min, bg);
    max = Math.max(max, bg);

    if (bg >= thresholds.low && bg <= thresholds.high) {
      timeInRange++;
    }
    if (bg > thresholds.high) {
      timeAboveHigh++;
      excessBG += (bg - thresholds.high);
    }
    if (bg > thresholds.critical) {
      timeAboveCritical++;
    }
    if (bg < thresholds.low) {
      timeBelowLow++;
    }
  }

  return {
    averageBG: Math.round(sum / bgHistory.length),
    minBG: min,
    maxBG: max,
    timeInRange,
    timeAboveHigh,
    timeAboveCritical,
    timeBelowLow,
    excessBG: Math.round(excessBG),
  };
}
```

---

## Система деградации

### Расчёт очков деградации

```typescript
interface DegradationConfig {
  // Порог, с которого начинается деградация
  bgThreshold: number;           // 200

  // Множитель: насколько сильно BG влияет на деградацию
  bgMultiplier: number;          // 0.1

  // Дополнительная деградация за критический уровень
  criticalMultiplier: number;    // 0.3

  // Максимум деградации за день
  maxDailyDegradation: number;   // 30
}

function calculateDegradationPoints(
  metrics: DayMetrics,
  config: DegradationConfig
): number {
  // Базовая деградация от excess BG
  let points = metrics.excessBG * config.bgMultiplier;

  // Дополнительно за критические значения
  points += metrics.timeAboveCritical * config.criticalMultiplier * 10;

  // Ограничиваем максимумом
  return Math.min(Math.round(points), config.maxDailyDegradation);
}
```

### Распределение по органам

```typescript
interface DegradationDistribution {
  liver: number;      // 40%
  pancreas: number;   // 40%
  kidney: number;     // 20%
}

function distributeDegradation(
  totalPoints: number,
  distribution: DegradationDistribution
): { liver: number; pancreas: number; kidney: number } {
  return {
    liver: Math.round(totalPoints * 0.4),
    pancreas: Math.round(totalPoints * 0.4),
    kidney: Math.round(totalPoints * 0.2),
  };
}
```

### Пороги деградации органов

```typescript
interface OrganDegradation {
  currentValue: number;
  maxValue: number;
  thresholds: number[];
  currentTier: number;           // Текущий порог деградации
}

// Пример для печени
const liverDegradation: OrganDegradation = {
  currentValue: 45,
  maxValue: 120,
  thresholds: [20, 40, 60, 80, 100],  // 5 порогов
  currentTier: 2,                      // 45 > 40, значит tier 2
};
```

### Эффекты деградации

| Орган | Tier 1 | Tier 2 | Tier 3 | Tier 4 | Tier 5 |
|-------|--------|--------|--------|--------|--------|
| Liver | -10% capacity | -20% | -30% | -40% | -50% |
| Pancreas | -1 max tier | -1 | -2 | -2 | -3 |
| Kidney | +10% threshold | +20% | +30% | +40% | +50% |

---

## Система рангов

### Критерии ранга

```typescript
function calculateRank(metrics: DayMetrics): 1 | 2 | 3 | 4 | 5 {
  const { timeInRange, timeAboveCritical, averageBG } = metrics;
  const totalTicks = 18;

  // Rank 1: Провал
  if (timeAboveCritical >= 3 || timeInRange < 6) {
    return 1;
  }

  // Rank 5: Идеально
  if (timeInRange >= 16 && averageBG <= 130) {
    return 5;
  }

  // Rank 4: Отлично
  if (timeInRange >= 14 && averageBG <= 150) {
    return 4;
  }

  // Rank 3: Хорошо
  if (timeInRange >= 10 && averageBG <= 170) {
    return 3;
  }

  // Rank 2: Удовлетворительно
  return 2;
}
```

### UI ранга

| Rank | Stars | Message | Actions |
|------|-------|---------|---------|
| 1 | ☆☆☆☆☆ | "Day failed" | Retry only |
| 2 | ★☆☆☆☆ | "Day passed" | Continue, Retry |
| 3 | ★★★☆☆ | "Day passed" | Continue, Retry |
| 4 | ★★★★☆ | "Well done!" | Continue, Retry |
| 5 | ★★★★★ | "Perfect!" | Continue only |

---

## Визуализация

### BG Graph

```typescript
interface BGGraphProps {
  bgHistory: number[];
  thresholds: {
    low: number;
    target: number;
    high: number;
    critical: number;
  };
}
```

**Реализация:**
- SVG polyline для графика
- Горизонтальные линии для порогов
- Заливка зон:
  - Зелёная: 70-200 (норма)
  - Жёлтая: <70 (низкий)
  - Оранжевая: 200-300 (высокий)
  - Красная: >300 (критический)

### Excess BG Indicator

```
Excess BG: ●●●●○
           (4 из 5 "кругов" деградации)

Визуализация:
- Каждый круг = 10 excess points
- Заполненный = активный
- Пустой = потенциальный

Анимация:
- Круги "загораются" последовательно при расчёте
- Затем "улетают" к соответствующим органам
```

### Degradation Display

```
┌─────────────────────────────────────┐
│ LIVER                               │
│ ┌─────────────────────────────────┐ │
│ │████████████░░░░░░░░░░░░░░░░░░░░│ │
│ └─────────────────────────────────┘ │
│ Degradation: 45/120                 │
│ Tier: 2/5                           │
│ Effect: -20% capacity               │
│                                     │
│ +5 this day                         │
└─────────────────────────────────────┘
```

---

## Анимация фазы результатов

### Последовательность

1. **Появление графика** (1.5s)
   - График рисуется слева направо
   - Зоны подсвечиваются

2. **Подсчёт статистики** (1s)
   - Average BG считается вверх
   - Excess BG заполняется

3. **Деградация** (2s)
   - Круги excess "улетают" к органам
   - Полоски деградации увеличиваются
   - Если достигнут новый tier — flash эффект

4. **Ранг** (1s)
   - Звёзды появляются по одной
   - Сообщение появляется

5. **Кнопки** (0.5s)
   - Fade in

### Пропуск анимации

Tap/click в любой момент — пропустить к финальному состоянию.

---

## Действия игрока

### Continue

- Сохраняет деградацию
- Переходит к следующему дню (или завершает уровень)
- `gameStore.startNextDay()`

### Retry

- Сбрасывает день (возвращает состояние на начало дня)
- Деградация от этого дня НЕ применяется
- `gameStore.retryDay()`

### Условия доступности

```typescript
const canContinue = rank >= 2;
const canRetry = rank < 5;  // При 5 звёздах нет смысла retry

// Rank 1: только Retry
// Rank 2-4: оба варианта
// Rank 5: только Continue
```

---

## Компоненты

### ResultsPhase.tsx
- Основной контейнер
- Управление анимацией
- Layout

### BGGraph.tsx
- SVG график
- Polyline для данных
- Зоны порогов
- Labels времени

### StatsPanel.tsx
- Average BG
- Excess BG indicator
- Time in range

### DegradationDisplay.tsx
- Органы с полосками деградации
- Анимация прилёта кругов
- Показ эффектов

### RankDisplay.tsx
- Звёзды
- Сообщение
- Анимация появления

### ActionButtons.tsx
- Continue button
- Retry button
- Условная доступность

---

## Решённые вопросы

1. ~~**Сохранение при Retry**~~ → **Нет**, деградация сохраняется только при переходе на следующий уровень. Retry начинает уровень с теми же параметрами, что и в первый раз.

2. **Детальная статистика**: Показывать ли breakdown по сегментам (Morning/Day/Evening)? → Отложено

3. **Рекомендации**: Подсказки что улучшить на следующем дне? → Отложено

4. **Анимация деградации**: Насколько детально показывать распределение? → Отложено (polish slice)

---

## Решённые вопросы (дополнительно)

1. ~~**График BG — формат данных**~~ → **Конфигурируемо** — количество точек на час вынесено в конфигурацию

2. ~~**График BG — зоны**~~ → **Линии-маркеры** (не заливка фона)

3. ~~**Excess BG indicator**~~ → **Не нужно** — круги "улетают к органам" не реализуем

4. ~~**Retry из Results**~~ → **Возврат в Planning того же дня** (не сначала уровня)

---

## TODO

- [ ] Точные формулы деградации (баланс)
- [ ] Дизайн графика BG
- [ ] Анимации
- [ ] Звуки результатов
