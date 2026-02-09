# 05 - Конфигурация

## Обзор

Игра конфигурируется через JSON файлы для удобства редактирования без знания программирования.

---

## Структура файлов

```
public/
└── data/
    ├── foods.json           # Все корабли с едой
    ├── interventions.json   # Все интервенции
    ├── organs.json          # Параметры органов и правил
    └── levels/
        ├── level-01.json
        ├── level-02.json
        └── ...
```

---

## foods.json — Корабли с едой

### Схема (v0.16.0)

```json
{
  "foods": [
    {
      "id": "apple",
      "name": "Apple",
      "emoji": "🍎",
      "size": "S",
      "glucose": 150,
      "carbs": 15,
      "wpCost": 1,
      "fiber": true,
      "description": "Light snack with fiber."
    }
  ]
}
```

> **Конвертация:** `glucose = carbs × 10` (строгое правило с v0.16.0)

### Поля

| Поле | Тип | Обязательное | Описание |
|------|-----|--------------|----------|
| `id` | string | ✅ | Уникальный идентификатор |
| `name` | string | ✅ | Отображаемое название |
| `emoji` | string | ❌ | Emoji для placeholder (🍎) |
| `size` | "S" \| "M" \| "L" | ✅ | Размер корабля |
| `glucose` | number | ✅ | Количество глюкозы (mg/dL) = carbs × 10 |
| `carbs` | number | ✅ | Углеводы в граммах (для UI) |
| `wpCost` | number | ❌ | Стоимость в WP (0-9, по умолчанию 0) |
| `fiber` | boolean | ❌ | Наличие клетчатки (замедляет поток ×0.7) |
| `description` | string | ❌ | Описание для tooltip |

### Размеры кораблей

| Size | Слотов | Часов разгрузки | Характеристика |
|------|--------|-----------------|----------------|
| S | 1 | 1 | Быстрый spike, опасный |
| M | 2 | 2 | Умеренный |
| L | 3 | 3 | Плавный, безопасный |

### Таблица продуктов (v0.16.2)

| ID | Name | Size | Carbs | Glucose | WP | Fiber |
|----|------|------|-------|---------|-----|-------|
| banana | Banana | S | 20 | 200 | 1 | — |
| apple | Apple | S | 15 | 150 | 1 | yes |
| icecream | Ice Cream | S | 15 | 150 | 0 | — |
| popcorn | Popcorn | S | 15 | 150 | 1 | — |
| berriesmixed | Mixed Berries | S | 10 | 100 | 2 | yes |
| milk | Milk 2% | S | 10 | 100 | 3 | — |
| cookie | Cookie | M | 15 | 150 | 2 | — |
| caesarsalad | Caesar Salad | M | 15 | 150 | 3 | yes |
| chocolatemuffin | Chocolate Muffin | M | 15 | 150 | 0 | — |
| sandwich | Sandwich | M | 25 | 250 | 2 | — |
| eggsboiled | Boiled Eggs | M | 5 | 50 | 4 | — |
| greekyogurt | Greek Yogurt | M | 10 | 100 | 3 | — |
| boiledcarrots | Boiled Carrots | M | 10 | 100 | 4 | yes |
| chickpeas | Chickpeas | M | 10 | 100 | 3 | yes |
| cheesewedge | Hard Cheese | M | 3 | 30 | 3 | — |
| nutsmixed | Mixed Nuts | M | 5 | 50 | 2 | — |
| chicken | Chicken | L | 10 | 100 | 3 | — |
| rice | Rice | L | 30 | 300 | 4 | — |
| burger | Hamburger | L | 30 | 300 | 3 | — |
| oatmeal | Oatmeal | L | 25 | 250 | 4 | yes |
| pizza | Pizza | L | 30 | 300 | 3 | — |
| vegetablestew | Vegetable Stew | L | 10 | 100 | 4 | yes |
| cottagecheese | Cottage Cheese 5% | L | 10 | 100 | 4 | — |
| avocado | Avocado | L | 5 | 50 | 3 | yes |

> **Принцип WP:** Сладкое (ice cream, muffin) бесплатно (WP=0) — это соблазн. Cookie стоит 2 WP (v0.17.3). Полезная еда (oatmeal, rice, chicken) стоит дорого (3-4 WP). Создаёт дилемму risk/reward.

### Пример записи

```json
{
  "id": "apple",
  "name": "Apple",
  "emoji": "🍎",
  "size": "S",
  "glucose": 150,
  "carbs": 15,
  "wpCost": 1,
  "fiber": true,
  "description": "Light snack with fiber."
}
```

---

## interventions.json — Интервенции

### Схема

```json
{
  "interventions": [
    {
      "id": "metformin",
      "name": "Metformin",
      "image": "assets/interventions/pill.png",
      "size": "S",
      "load": 100,
      "targetContainer": "metforminEffect",
      "description": "Reduces liver degradation effects"
    }
  ]
}
```

### Поля (v0.17.0)

| Поле | Тип | Обязательное | Описание |
|------|-----|--------------|----------|
| `id` | string | ✅ | Уникальный идентификатор |
| `name` | string | ✅ | Отображаемое название |
| `image` | string | ❌ | Путь к картинке |
| `emoji` | string | ❌ | Emoji fallback |
| `size` | "S" \| "M" \| "L" | ✅ | Размер корабля |
| `load` | number | ✅ | Количество вещества |
| `targetContainer` | string | ✅ | Целевой effect container |
| `wpCost` | number | ❌ | Стоимость в WP (по умолчанию 0) |
| `group` | string | ❌ | Группа для лимитов (e.g. "exercise") |
| `requiresEmptySlotBefore` | boolean | ❌ | Слот N-1 не должен содержать еду |
| `description` | string | ❌ | Описание |

### Целевые контейнеры

| targetContainer | Эффект |
|-----------------|--------|
| `metforminEffect` | Подавляет деградацию печени |
| `exerciseEffect` | Временный +1 tier мышцам (при exerciseEffect > 50) |
| `intenseExerciseEffect` | Перманентный +1 tier мышцам (не затухает) |

### Текущие интервенции

| ID | Emoji | Size | Load | WP | Group | Target | Special |
|----|-------|------|------|----|-------|--------|---------|
| metformin | 💊 | S | 100 | 0 | — | metforminEffect | — |
| light_exercise | 🚶 | S | 100 | 2 | exercise | exerciseEffect | — |
| intense_exercise | 🏋️ | S | 100 | 4 | exercise | intenseExerciseEffect | requiresEmptySlotBefore |
| exercise | 🏃 | M | 100 | 0 | exercise | exerciseEffect | (legacy, unused in level-01) |

---

## levels/level-XX.json — Уровни

### Схема (v0.17.2)

```json
{
  "id": "level-01",
  "name": "First Steps",
  "description": "Learn the basics of meal planning.",
  "days": 3,

  "dayConfigs": [
    {
      "day": 1,
      "wpBudget": 12,
      "availableFoods": [
        { "id": "banana", "count": 5 },
        { "id": "apple", "count": 5 }
      ],
      "availableInterventions": [
        { "id": "light_exercise", "count": 2 },
        { "id": "intense_exercise", "count": 1 }
      ],
      "segmentCarbs": {
        "Morning": { "min": 25, "optimal": 30, "max": 35 },
        "Day": { "min": 30, "optimal": 35, "max": 40 },
        "Evening": { "min": 20, "optimal": 25, "max": 30 }
      },
      "blockedSlots": [],
      "preOccupiedSlots": []
    }
  ],

  "initialDegradation": {
    "liver": 0,
    "pancreas": 0,
    "kidney": 0
  },

  "interventionCharges": {
    "liverBoost": 3,
    "pancreasBoost": 2
  },

  "winCondition": {
    "maxDegradationCircles": 5
  }
}
```

### Поля LevelConfig

| Поле | Тип | Обязательное | Описание |
|------|-----|--------------|----------|
| `id` | string | ✅ | Уникальный ID уровня |
| `name` | string | ✅ | Название для UI |
| `description` | string | ❌ | Описание уровня |
| `days` | number | ✅ | Количество дней в уровне |
| `availableFoods` | array | ❌ | Fallback список еды (если не задан в dayConfig) |
| `availableInterventions` | array | ❌ | Fallback интервенции (если не задан в dayConfig) |
| `wpBudget` | number | ❌ | Fallback бюджет WP (по умолчанию 16) |
| `dayConfigs` | array | ✅ | Конфиги для каждого дня |
| `initialDegradation` | object | ❌ | Начальная деградация органов |
| `interventionCharges` | object | ✅ | Заряды boost кнопок |
| `winCondition.maxDegradationCircles` | number | ❌ | Макс. кругов деградации до поражения (default 5) |
| `initialBG` | number | ❌ | Стартовый уровень глюкозы (по умолчанию 100) |

### Segment Carb Limits (v0.16.0)

Лимиты углеводов задаются **на каждый сегмент дня** вместо дневного min/max.

```json
"segmentCarbs": {
  "Morning": { "min": 25, "optimal": 30, "max": 35 },
  "Day":     { "min": 30, "optimal": 35, "max": 40 },
  "Evening": { "min": 20, "optimal": 25, "max": 30 }
}
```

| Параметр | Описание | Цвет индикатора |
|----------|----------|-----------------|
| `min` | Минимум углеводов в сегменте | Жёлтый (если ниже) |
| `optimal` | Идеальное количество | Зелёный |
| `max` | Максимум углеводов в сегменте | Жёлтый (если выше), красный (если сильно выше) |

> **Legacy:** Старый формат `carbRequirements: { min, max }` на уровне по-прежнему поддерживается как fallback.

### Формат dayConfigs (v0.17.2)

Каждый день имеет свой полный конфиг:

```json
"dayConfigs": [
  {
    "day": 1,
    "segmentCarbs": { ... },
    "wpBudget": 12,
    "availableFoods": [ { "id": "banana", "count": 5 } ],
    "availableInterventions": [ { "id": "light_exercise", "count": 2 } ],
    "blockedSlots": [6, 12],
    "preOccupiedSlots": [ { "slot": 1, "shipId": "oatmeal" } ]
  }
]
```

| DayConfig поле | Тип | Описание |
|----------------|-----|----------|
| `day` | number | Номер дня (1-indexed) |
| `segmentCarbs` | object | Лимиты углеводов на сегмент |
| `wpBudget` | number | WP бюджет на день |
| `availableFoods` | `[{id, count}]` | Еда доступная в этот день |
| `availableInterventions` | `[{id, count}]` | Интервенции доступные в этот день (v0.17.2) |
| `blockedSlots` | `number[]` | Заблокированные слоты (v0.17.1) |
| `preOccupiedSlots` | `[{slot, shipId}]` | Предустановленные карточки |

Если `dayConfigs` не указан или для конкретного дня нет записи, используются уровневые значения как fallback.

### Level-01 "First Steps" — Конфигурация (v0.23.0)

| Параметр | День 1 | День 2 | День 3 |
|----------|--------|--------|--------|
| WP бюджет | 14 | 14 | 15 |
| Предустановлено | oatmeal (слот 13) | chocmuffin (1) + chicken (7) | cookie (4) + icecream (13) |
| Заблокировано | [5, 11] | [6, 14] | [3, 9, 11, 17] |
| Кол-во продуктов | 8 (2L, 2M, 4S) | 8 (1L, 4M, 3S) | 7 (0L, 3M, 4S) |
| Интервенции | — | light_exercise ×2 | light ×1 + intense ×1 |

**Инвентарь по дням:**
- День 1: banana, apple, cookie, burger, popcorn, berriesmixed, pizza, greekyogurt
- День 2: banana, popcorn, cookie, nutsmixed, rice, milk, chickpeas, caesarsalad
- День 3: apple, popcorn, banana, sandwich, boiledcarrots, milk, cheesewedge

### Формат preOccupiedSlots

```json
"preOccupiedSlots": [
  { "slot": 1, "shipId": "oatmeal" },
  { "slot": 4, "shipId": "sandwich" }
]
```

### Формат availableFoods (с количеством)

```json
"availableFoods": [
  { "id": "apple", "count": 3 },
  { "id": "sandwich", "count": 2 },
  { "id": "oatmeal", "count": 1 }
]
```

---

## organs.json — Параметры органов (опционально)

Этот файл содержит параметры симуляции. Можно вынести в JSON или оставить в коде.

### Схема

```json
{
  "containers": {
    "liver": {
      "capacity": 100,
      "initialLevel": 20
    },
    "bg": {
      "capacity": 400,
      "initialLevel": 100,
      "thresholds": {
        "low": 70,
        "target": 100,
        "high": 200,
        "critical": 300
      }
    },
    "kidney": {
      "capacity": 60,
      "initialLevel": 0
    },
    "metforminEffect": {
      "capacity": 120,
      "initialLevel": 0,
      "decayRate": 7
    },
    "exerciseEffect": {
      "capacity": 100,
      "initialLevel": 0,
      "decayRate": 50
    }
  },

  "rateTiers": {
    "liverTransfer": [0, 150, 75],
    "muscleDrain": [0, 25, 50, 85, 120, 150, 175],
    "kidneyIntake": [0, 30, 50]
  },

  "degradation": {
    "bgHighThreshold": 200,
    "bgCriticalThreshold": 300,
    "baseMultiplier": 0.1,
    "criticalMultiplier": 0.3,
    "maxDailyPoints": 30,
    "distribution": {
      "liver": 0.4,
      "pancreas": 0.4,
      "kidney": 0.2
    }
  }
}
```

---

## Загрузка конфигов в приложении

### TypeScript код (v0.17.2)

```typescript
// src/config/loader.ts

export interface FoodConfig {
  id: string;
  name: string;
  image?: string;
  emoji?: string;
  size: 'S' | 'M' | 'L';
  glucose: number;
  carbs: number;
  wpCost: number;      // 0-9, по умолчанию 0
  fiber?: boolean;
  description?: string;
}

export interface InterventionConfig {
  id: string;
  name: string;
  image?: string;
  emoji?: string;
  size: 'S' | 'M' | 'L';
  load: number;
  targetContainer: string;
  wpCost?: number;                  // v0.17.0
  group?: string;                   // v0.17.0 (e.g. "exercise")
  requiresEmptySlotBefore?: boolean; // v0.17.0
  description?: string;
}

export interface LevelConfig {
  id: string;
  name: string;
  description?: string;
  days: number;
  availableFoods?: Array<{ id: string; count: number }>;   // fallback
  availableInterventions?: Array<{ id: string; count: number }>; // fallback (v0.17.2)
  wpBudget?: number;           // fallback, по умолчанию DEFAULT_WP_BUDGET (16)
  dayConfigs?: Array<{
    day: number;
    segmentCarbs?: Record<DaySegment, SegmentCarbLimits>;
    wpBudget?: number;
    availableFoods?: Array<{ id: string; count: number }>;
    availableInterventions?: Array<{ id: string; count: number }>; // v0.17.2
    blockedSlots?: number[];            // v0.17.1
    preOccupiedSlots?: Array<{ slot: number; shipId: string }>;
  }>;
  initialDegradation?: {
    liver: number;
    pancreas: number;
    kidney: number;
  };
  interventionCharges: {
    liverBoost: number;
    pancreasBoost: number;
  };
  winCondition: {
    maxDegradationCircles?: number;  // default 5
  };
}
```

---

## Валидация конфигов

При загрузке проверяем:

1. **foods.json**:
   - Все ID уникальны
   - size один из: S, M, L
   - glucose > 0
   - `glucose == carbs × 10` (строгая конвертация)
   - wpCost >= 0

2. **interventions.json**:
   - Все ID уникальны
   - targetContainer валидный

3. **level.json**:
   - Все availableFoods существуют в foods.json
   - Все availableInterventions существуют в interventions.json
   - segmentCarbs: min <= optimal <= max для каждого сегмента
   - days >= 1

---

## Баланс

### Рекомендации по еде (v0.16.0)

| Тип | Size | Carbs | Glucose | WP | Характер |
|-----|------|-------|---------|-----|----------|
| Сладкое (соблазн) | S-M | 15 | 150 | 0 | Бесплатно, но spike |
| Фрукты | S | 15-20 | 150-200 | 1 | Дёшево, умеренно |
| Обычная еда | M | 15-25 | 150-250 | 2-3 | Стандарт |
| Полезная еда | L | 10-30 | 100-300 | 3-4 | Дорого, но безопасно |

### Принцип WP-баланса (v0.23.0)

- **WP = 0** — сладкое, соблазн (ice cream, muffin, metformin)
- **WP = 1** — лёгкие перекусы (banana, apple, popcorn)
- **WP = 2** — cookie, light_exercise, sandwich, nuts
- **WP = 3** — обычная еда (chicken, burger, pizza, salad, milk, cheese)
- **WP = 4** — самая полезная (oatmeal, rice, boiledcarrots) и intense_exercise
- **Бюджет 14-15 WP** (level-01) — даёт пространство для нескольких комбинаций

### Рекомендации по интервенциям (v0.17.0)

| Интервенция | Size | Load | WP | Эффект |
|-------------|------|------|----|--------|
| Metformin | S | 100 | 0 | Долгий эффект (~17ч), блокирует деградацию |
| Light Exercise | S | 100 | 2 | Временный +1 tier мышцам (~2ч) |
| Intense Exercise | S | 100 | 4 | Перманентный +1 tier мышцам (до конца дня) |
| Exercise | M | 100 | 0 | Средний эффект (~2ч) (legacy) |

---

## Решённые вопросы

1. ~~**Organs.json**: Выносить параметры органов в JSON или оставить в коде?~~ → **В JSON**

2. **Версионирование**: Как обрабатывать изменения в формате конфигов? → Пока не критично для прототипа

3. ~~**Редактор**: Нужен ли web-редактор для создания уровней?~~ → Нет, вручную

---

## Открытые вопросы

1. **Начальный BG**: Какой BG в начале дня? Всегда 100 (target) или зависит от предыдущего дня / настроек уровня?

2. **Начальный Liver**: Какой уровень глюкозы в печени в начале дня? 0 или какое-то значение?

3. **Rate tiers — конкретные значения**: Какие конкретно rate tiers для каждого органа? В документе указаны примеры `[0, 30, 50]`, но нужны точные значения для баланса.

4. **Decay rate для effects**: Metformin decay = 7/tick, Exercise decay = 50/tick — это правильные значения?

5. **Degradation distribution**: 40% liver, 40% pancreas, 20% kidney — это финальное распределение?

---

## TODO

- [ ] Создать начальные JSON файлы
- [ ] Написать loader с валидацией
- [ ] Определить все параметры баланса
- [ ] Протестировать загрузку
