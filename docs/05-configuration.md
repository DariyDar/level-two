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

### Схема

```json
{
  "foods": [
    {
      "id": "apple",
      "name": "Apple",
      "image": "assets/food/apple.png",
      "size": "S",
      "glucose": 15,
      "description": "Light snack with moderate sugar"
    }
  ]
}
```

> **Примечание:** Параметр `description` не обязателен для кораблей.

### Поля

| Поле | Тип | Обязательное | Описание |
|------|-----|--------------|----------|
| `id` | string | ✅ | Уникальный идентификатор |
| `name` | string | ✅ | Отображаемое название |
| `image` | string | ❌ | Путь к картинке (если нет — emoji fallback) |
| `emoji` | string | ❌ | Emoji для placeholder (🍎) |
| `size` | "S" \| "M" \| "L" | ✅ | Размер корабля |
| `glucose` | number | ✅ | Количество глюкозы (load) |
| `description` | string | ❌ | Описание для tooltip |

### Размеры кораблей

| Size | Слотов | Часов разгрузки | Характеристика |
|------|--------|-----------------|----------------|
| S | 1 | 1 | Быстрый spike, опасный |
| M | 2 | 2 | Умеренный |
| L | 3 | 3 | Плавный, безопасный |

### Пример полного файла

```json
{
  "foods": [
    {
      "id": "candy",
      "name": "Candy",
      "emoji": "🍬",
      "size": "S",
      "glucose": 25,
      "description": "Fast sugar spike. Use carefully."
    },
    {
      "id": "apple",
      "name": "Apple",
      "emoji": "🍎",
      "size": "S",
      "glucose": 15,
      "description": "Light snack with moderate sugar."
    },
    {
      "id": "juice",
      "name": "Orange Juice",
      "emoji": "🧃",
      "size": "S",
      "glucose": 20,
      "description": "Quick energy, fast absorption."
    },
    {
      "id": "sandwich",
      "name": "Sandwich",
      "emoji": "🥪",
      "size": "M",
      "glucose": 35,
      "description": "Balanced meal, steady release."
    },
    {
      "id": "pasta",
      "name": "Pasta",
      "emoji": "🍝",
      "size": "M",
      "glucose": 45,
      "description": "High carbs, moderate absorption."
    },
    {
      "id": "rice",
      "name": "Rice Bowl",
      "emoji": "🍚",
      "size": "M",
      "glucose": 40,
      "description": "Staple food, reliable energy."
    },
    {
      "id": "oatmeal",
      "name": "Oatmeal",
      "emoji": "🥣",
      "size": "L",
      "glucose": 40,
      "description": "Slow release, gentle on system."
    },
    {
      "id": "beans",
      "name": "Bean Stew",
      "emoji": "🫘",
      "size": "L",
      "glucose": 35,
      "description": "Very slow absorption, high fiber."
    },
    {
      "id": "salad",
      "name": "Big Salad",
      "emoji": "🥗",
      "size": "L",
      "glucose": 25,
      "description": "Low carbs, fills slots, very gentle."
    }
  ]
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

### Схема

```json
{
  "id": "level-01",
  "name": "First Steps",
  "description": "Learn the basics of meal planning.",
  "days": 1,

  "availableFoods": ["apple", "sandwich", "oatmeal"],
  "availableInterventions": [],

  "carbRequirements": {
    "min": 60,
    "max": 120
  },

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
| `availableFoods` | string[] | ✅ | Список ID еды из foods.json |
| `availableInterventions` | string[] | ✅ | Список ID интервенций (может быть пустым) |
| `carbRequirements.min` | number | ✅ | Минимум углеводов для старта симуляции |
| `carbRequirements.max` | number | ✅ | Рекомендуемый максимум (warning) |
| `initialDegradation` | object | ❌ | Начальная деградация органов |
| `interventionCharges` | object | ✅ | Заряды boost кнопок |
| `winCondition.minRank` | 1-5 | ✅ | Минимальный ранг для прохождения дня |
| `initialBG` | number | ❌ | Стартовый уровень глюкозы (по умолчанию 100) |
| `preOccupiedSlots` | array | ❌ | Заранее занятые слоты (нельзя убрать/заменить) |

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

### Примеры уровней

#### level-01.json — Туториал

```json
{
  "id": "level-01",
  "name": "First Steps",
  "description": "Learn the basics of meal planning.",
  "days": 1,

  "availableFoods": ["apple", "sandwich", "oatmeal"],
  "availableInterventions": [],

  "carbRequirements": {
    "min": 60,
    "max": 120
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

#### level-02.json — Интервенции

```json
{
  "id": "level-02",
  "name": "Interventions",
  "description": "Learn to use metformin and exercise.",
  "days": 1,

  "availableFoods": ["apple", "sandwich", "pasta", "oatmeal"],
  "availableInterventions": ["metformin", "exercise"],

  "carbRequirements": {
    "min": 80,
    "max": 150
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

#### level-03.json — Повреждённая печень

```json
{
  "id": "level-03",
  "name": "Damaged Liver",
  "description": "Your liver is already under stress.",
  "days": 2,

  "availableFoods": ["apple", "sandwich", "pasta", "oatmeal", "beans"],
  "availableInterventions": ["metformin", "exercise"],

  "carbRequirements": {
    "min": 100,
    "max": 180
  },

  "initialDegradation": {
    "liver": 40,
    "pancreas": 0,
    "kidney": 0
  },

  "interventionCharges": {
    "liverBoost": 2,
    "pancreasBoost": 2
  },

  "winCondition": {
    "minRank": 3
  }
}
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

### TypeScript код

```typescript
// src/config/loader.ts

export interface FoodConfig {
  id: string;
  name: string;
  image?: string;
  emoji?: string;
  size: 'S' | 'M' | 'L';
  glucose: number;
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
  availableFoods: string[];
  availableInterventions: string[];
  carbRequirements: {
    min: number;
    max: number;
  };
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

// Загрузка
export async function loadFoods(): Promise<FoodConfig[]> {
  const response = await fetch('/data/foods.json');
  const data = await response.json();
  return data.foods;
}

export async function loadInterventions(): Promise<InterventionConfig[]> {
  const response = await fetch('/data/interventions.json');
  const data = await response.json();
  return data.interventions;
}

export async function loadLevel(levelId: string): Promise<LevelConfig> {
  const response = await fetch(`/data/levels/${levelId}.json`);
  return response.json();
}
```

---

## Валидация конфигов

При загрузке проверяем:

1. **foods.json**:
   - Все ID уникальны
   - size один из: S, M, L
   - glucose > 0

2. **interventions.json**:
   - Все ID уникальны
   - targetContainer валидный

3. **level.json**:
   - Все availableFoods существуют в foods.json
   - Все availableInterventions существуют в interventions.json
   - carbRequirements.min <= carbRequirements.max
   - days >= 1

---

## Баланс

### Рекомендации по еде

| Тип | Size | Glucose | Характер |
|-----|------|---------|----------|
| Сладкое | S | 20-30 | Опасно, быстрый spike |
| Фрукты | S | 10-20 | Умеренно |
| Обычная еда | M | 30-45 | Стандарт |
| Сложные углеводы | L | 25-40 | Безопасно |

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
