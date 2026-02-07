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

### Таблица продуктов (v0.16.0)

| ID | Name | Size | Carbs | Glucose | WP | Fiber |
|----|------|------|-------|---------|-----|-------|
| banana | Banana | S | 20 | 200 | 1 | — |
| apple | Apple | S | 15 | 150 | 1 | yes |
| icecream | Ice Cream | S | 15 | 150 | 0 | — |
| popcorn | Popcorn | S | 15 | 150 | 1 | — |
| cookie | Cookie | M | 15 | 150 | 0 | — |
| caesarsalad | Caesar Salad | M | 15 | 150 | 3 | yes |
| chocolatemuffin | Chocolate Muffin | M | 15 | 150 | 0 | — |
| sandwich | Sandwich | M | 25 | 250 | 2 | — |
| chicken | Chicken | L | 10 | 100 | 3 | — |
| rice | Rice | L | 30 | 300 | 4 | — |
| burger | Hamburger | L | 30 | 300 | 3 | — |
| oatmeal | Oatmeal | L | 25 | 250 | 4 | yes |
| pizza | Pizza | L | 30 | 300 | 3 | — |

> **Принцип WP:** Сладкое (ice cream, cookie, muffin) бесплатно (WP=0) — это соблазн. Полезная еда (oatmeal, rice, chicken) стоит дорого (3-4 WP). Создаёт дилемму risk/reward.

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

### Поля

| Поле | Тип | Обязательное | Описание |
|------|-----|--------------|----------|
| `id` | string | ✅ | Уникальный идентификатор |
| `name` | string | ✅ | Отображаемое название |
| `image` | string | ❌ | Путь к картинке |
| `emoji` | string | ❌ | Emoji fallback |
| `size` | "S" \| "M" \| "L" | ✅ | Размер корабля |
| `load` | number | ✅ | Количество вещества |
| `targetContainer` | string | ✅ | Целевой effect container |
| `description` | string | ❌ | Описание |

### Целевые контейнеры

| targetContainer | Эффект |
|-----------------|--------|
| `metforminEffect` | Подавляет деградацию печени |
| `exerciseEffect` | Ускоряет утилизацию глюкозы мышцами |

### Пример файла

```json
{
  "interventions": [
    {
      "id": "metformin",
      "name": "Metformin",
      "emoji": "💊",
      "size": "S",
      "load": 100,
      "targetContainer": "metforminEffect",
      "description": "Reduces liver degradation effects."
    },
    {
      "id": "light_exercise",
      "name": "Light Exercise",
      "emoji": "🚶",
      "size": "M",
      "load": 60,
      "targetContainer": "exerciseEffect",
      "description": "Moderate boost to glucose utilization."
    },
    {
      "id": "exercise",
      "name": "Exercise",
      "emoji": "🏃",
      "size": "M",
      "load": 100,
      "targetContainer": "exerciseEffect",
      "description": "Strong boost to muscle glucose uptake."
    }
  ]
}
```

---

## levels/level-XX.json — Уровни

### Схема (v0.16.0)

```json
{
  "id": "level-01",
  "name": "First Steps",
  "description": "Learn the basics of meal planning.",
  "days": 3,

  "availableFoods": [
    { "id": "apple", "count": 3 },
    { "id": "sandwich", "count": 2 }
  ],
  "availableInterventions": [],

  "wpBudget": 16,

  "dayConfigs": [
    {
      "day": 1,
      "segmentCarbs": {
        "Morning": { "min": 25, "optimal": 30, "max": 35 },
        "Day": { "min": 30, "optimal": 35, "max": 40 },
        "Evening": { "min": 20, "optimal": 25, "max": 30 }
      }
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
    "minRank": 2
  }
}
```

### Поля

| Поле | Тип | Обязательное | Описание |
|------|-----|--------------|----------|
| `id` | string | ✅ | Уникальный ID уровня |
| `name` | string | ✅ | Название для UI |
| `description` | string | ❌ | Описание уровня |
| `days` | number | ✅ | Количество дней в уровне |
| `availableFoods` | array | ✅ | Список ID еды из foods.json (с количеством) |
| `availableInterventions` | string[] | ✅ | Список ID интервенций (может быть пустым) |
| `wpBudget` | number | ❌ | Бюджет WP на уровень (по умолчанию 16) |
| `dayConfigs` | array | ❌ | Конфиги для отдельных дней (переопределяют уровневые) |
| `initialDegradation` | object | ❌ | Начальная деградация органов |
| `interventionCharges` | object | ✅ | Заряды boost кнопок |
| `winCondition.minRank` | 1-5 | ✅ | Минимальный ранг для прохождения дня |
| `initialBG` | number | ❌ | Стартовый уровень глюкозы (по умолчанию 100) |
| `preOccupiedSlots` | array | ❌ | Заранее занятые слоты (нельзя убрать/заменить) |

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

### Формат dayConfigs

Каждый день может переопределять параметры уровня:

```json
"dayConfigs": [
  {
    "day": 1,
    "segmentCarbs": { ... },
    "wpBudget": 12,
    "availableFoods": [ ... ],
    "preOccupiedSlots": [ ... ]
  }
]
```

Если `dayConfigs` не указан или для конкретного дня нет записи, используются уровневые значения.

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
    "liverTransfer": [0, 30, 50],
    "muscleDrain": [0, 20, 30, 50, 70, 90],
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

### TypeScript код (v0.16.0)

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
  description?: string;
}

export interface LevelConfig {
  id: string;
  name: string;
  description?: string;
  days: number;
  availableFoods: Array<{ id: string; count: number }>;
  availableInterventions: string[];
  wpBudget?: number;           // по умолчанию DEFAULT_WP_BUDGET (16)
  carbRequirements?: {         // legacy, необязательное с v0.16.0
    min: number;
    max: number;
  };
  dayConfigs?: Array<{
    day: number;
    segmentCarbs?: Record<DaySegment, SegmentCarbLimits>;
    wpBudget?: number;
    availableFoods?: Array<{ id: string; count: number }>;
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
    minRank: 1 | 2 | 3 | 4 | 5;
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

### Принцип WP-баланса

- **WP = 0** — сладкое, соблазн (ice cream, cookie, muffin)
- **WP = 1** — лёгкие перекусы (banana, apple, popcorn)
- **WP = 2-3** — обычная еда (sandwich, chicken, burger, pizza, salad)
- **WP = 4** — самая полезная (oatmeal, rice)
- **Бюджет 16 WP** — хватает на ~4-6 полезных продуктов или неограниченное количество сладкого

### Рекомендации по интервенциям

| Интервенция | Size | Load | Эффект |
|-------------|------|------|--------|
| Metformin | S | 80-120 | Долгий эффект (~17ч) |
| Light Exercise | S-M | 40-60 | Короткий эффект (~1-2ч) |
| Exercise | M | 80-100 | Средний эффект (~2ч) |

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
