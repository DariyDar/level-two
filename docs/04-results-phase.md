# 04 - Фаза результатов

## Назначение

Фаза результатов подводит итоги дня: показывает график BG, рассчитывает деградацию органов и определяет оценку на основе полученных кругов деградации.

---

## UI Layout (v0.22.9)

```
┌─────────────────────────────────────────┐
│          Day 1/3 Results                │
├─────────────────────────────────────────┤
│                                         │
│  BG GRAPH                               │
│  ┌─────────────────────────────────────┐│
│  │ 300 ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  red ││
│  │          ╱╲                         ││
│  │ 200 ─ ─╱──╲─ ─ ─ ─ ─ ─ ─  orange  ││
│  │     ╱╲╱    ╲    ╱╲                  ││
│  │    ╱        ╲  ╱  ╲                 ││
│  │───╱──────────╲╱────╲───── green     ││
│  │ 70 ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─        ││
│  │   06:00  12:00  18:00  00:00        ││
│  └─────────────────────────────────────┘│
│                                         │
│              EXCESS BG                  │
│  ┌─────────────────────────────────────┐│
│  │      ●  ●  ●  ✕  ✕                 ││
│  │   3 degradations till defeat        ││
│  └─────────────────────────────────────┘│
│                                         │
│            DEGRADATIONS                 │
│  ┌─────────────────────────────────────┐│
│  │  [Liver]       [Pancreas]           ││
│  │   56×56          56×56              ││
│  │  ● ● ● ●       ● ● ● ✕            ││
│  └─────────────────────────────────────┘│
│                                         │
│  ┌──────────┐  ┌──────────┐            │
│  │ Continue │  │  Retry   │            │
│  └──────────┘  └──────────┘            │
└─────────────────────────────────────────┘

Условные обозначения:
● = зелёный круг (здоровый)
✕ = розовый крестик 45° в пунктирном розовом круге (деградация)
```

---

## Расчёт результатов

### Входные данные

```typescript
interface SimulationHistory {
  bgHistory: number[];           // BG на каждом тике (18 значений)
}
```

### Метрики

```typescript
interface DayMetrics {
  averageBG: number;
  minBG: number;
  maxBG: number;
  timeInRange: number;           // Тики в диапазоне 70-200
  timeAboveHigh: number;         // Тики с BG > 200
  timeAboveCritical: number;     // Тики с BG > 300
  timeBelowLow: number;          // Тики с BG < 70
  excessBG: number;              // Накопленный избыток BG
}
```

---

## Система деградации

### Расчёт excessBG (v0.18.0)

ExcessBG рассчитывается из BG history с зональными коэффициентами:

```typescript
// Зоны деградации (из calculateResults.ts):
for (const bg of bgHistory) {
  if (bg > bgHigh) {  // bgHigh = 200
    if (bg <= bgCritical) {  // 200-300 zone
      excessBG += (bg - bgHigh) * 1.5;
    } else {  // 300+ zone
      excessBG += (bgCritical - bgHigh) * 1.5;  // 200-300 portion
      excessBG += (bg - bgCritical) * 3.0;       // 300+ portion
    }
  }
}
```

### Degradation Pipeline

ExcessBG → circles → distribution → points → tiers:

1. **Circles**: `Math.ceil(excessBG / thresholdPerCircle)` где threshold = 100
2. **Distribution**: чередование liver → pancreas → liver → ...
3. **Points**: каждый circle = 25 points к органу
4. **Tiers**: 0-24 = tier 1, 25-49 = tier 2, ... , 100+ = tier 5

### Конфигурация деградации

```typescript
interface DegradationConfig {
  bgThreshold: number;              // 200
  highZoneCoefficient: number;      // 1.5 (200-300)
  criticalZoneCoefficient: number;  // 3.0 (300+)
  thresholdPerCircle: number;       // 100
  maxCircles: number;               // 5
  pointsPerCircle: number;          // 25
}
```

### Эффекты деградации

| Орган | Tier 1 | Tier 2 | Tier 3 | Tier 4 | Tier 5 |
|-------|--------|--------|--------|--------|--------|
| Liver | -10% capacity | -20% | -30% | -40% | -50% |
| Pancreas | -1 max tier | -1 | -2 | -2 | -3 |
| Kidney | +10% threshold | +20% | +30% | +40% | +50% |

---

## Система оценки (v0.22.0, заменила систему рангов/звёзд)

### Оценка по кругам деградации

```typescript
type DayAssessment = 'Excellent' | 'Decent' | 'Poor' | 'Defeat';

const DEFAULT_ASSESSMENT_THRESHOLDS = {
  excellent: 0,  // 0 кругов
  decent: 1,     // 1 круг
  poor: 2,       // 2-3 круга
  defeat: 4,     // 4-5 кругов
};

function calculateAssessment(totalCircles: number): DayAssessment {
  if (totalCircles <= 0) return 'Excellent';
  if (totalCircles <= 1) return 'Decent';
  if (totalCircles < 4) return 'Poor';
  return 'Defeat';
}
```

### Условия победы/поражения

```typescript
// В level config:
winCondition: { maxDegradationCircles?: number }  // default: 5

// В ResultsPhase:
const defeated = assessment === 'Defeat';
const excellent = assessment === 'Excellent';
```

| Assessment | Circles | Continue | Retry |
|-----------|---------|----------|-------|
| Excellent | 0 | ✅ | ❌ |
| Decent | 1 | ✅ | ✅ |
| Poor | 2-3 | ✅ | ✅ |
| Defeat | 4-5 | ❌ | ✅ |

> **Примечание:** Оценка рассчитывается только за текущий день (не накопительная).

---

## Визуализация

### BG Graph (BGGraph.tsx)

```typescript
interface BGGraphProps {
  bgHistory: number[];
  thresholds: {
    low: number;     // 70
    high: number;    // 200
    critical: number; // 300
  };
}
```

**Реализация:**
- SVG path для линии графика
- Зоны фона (rect): зелёная (70-200), оранжевая (200-300), красная (300+)
- Пороговые линии: high (200, оранжевая), critical (300, красная)
- Линия и точки раскрашены по зонам: зелёные (70-200), оранжевые (200-300), красные (300+)
- Базовый цвет линии/точек: серый (#a0aec0) для зон вне диапазона
- X-axis: 06:00, 12:00, 18:00, 00:00
- Y-axis labels: 70, 200, 300 (цвет #718096)

### ExcessBG Indicator (ExcessBGIndicator.tsx)

5 маркеров отображают кол-во кругов деградации:
- **Здоровые** (слева): зелёные круги с градиентом (#48bb78 → #38a169)
- **Повреждённые** (справа): розовые крестики (45°) в пунктирных розовых кругах (#ff6b9d)
- Заполнение справа: `isDamaged(i) = i >= maxCircles - totalCircles`
- Подпись: `{N} degradation(s) till defeat` — 19px, белый, число жирным
- Заголовок: "EXCESS BG" — 18px, цвет #718096

### Organ Degradation Display (OrganDegradationDisplay.tsx)

Печень и поджелудочная с иконками и маркерами:
- Иконки органов: 56×56px в контейнерах 110px (#4a5568)
- 4 маркера на орган (burnable tiers 2-5, tier 1 несгораемый):
  - Здоровые: зелёные круги
  - Деградированные: розовые крестики в пунктирных розовых кругах
- Заголовок: "DEGRADATIONS" — 18px, цвет #718096

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

---

## Компоненты

### ResultsPhase.tsx
- Основной контейнер, layout
- Расчёт результатов через `calculateDayResults()`
- Pass/fail логика на основе assessment
- Заголовок "Day X/Y Results" (currentDay/totalDays)

### BGGraph.tsx
- SVG график с `viewBox="0 0 100 100"`, `preserveAspectRatio="none"`
- Зоны: rect элементы с rgba заливкой
- Сегменты линий по зонам: `buildColoredSegments()` функция
- Точки раскрашены по зонам

### ExcessBGIndicator.tsx
- 5 маркеров (green circles / pink crosses)
- Подпись о кол-ве деградаций до поражения
- Анимация крестиков при переносе (transfer-cross keyframes)

### OrganDegradationDisplay.tsx
- Иконки печени и поджелудочной
- 4 маркера на орган с анимацией перехода тиров
- `convertPointsToTier()` для расчёта текущего тира

---

## Удалённые компоненты (v0.22.0)

- **RankDisplay.tsx** — звёзды и сообщение ранга (удалён)
- **Система рангов** — 5-звёздочная система (1-5) на основе timeInRange/averageBG (заменена на assessment)
- Подробности старой системы: см. `docs/BACKLOG.md`

---

## TODO

- [ ] Анимации (последовательное появление элементов)
- [ ] Звуки результатов
- [ ] Детальная статистика по сегментам (Morning/Day/Evening)
