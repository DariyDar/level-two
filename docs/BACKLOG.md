# Backlog

## Linear Drain (A+B)

**Статус:** отложено (v0.18.3)
**Приоритет:** средний
**Цель:** повысить детерминированность и предсказуемость симуляции

### Бриф

Заменить ступенчатые (tier-based) функции drain/release на линейные, зависящие напрямую от BG. Убирает дискретные скачки на порогах, осцилляции и непредсказуемые feedback loops.

**A — Линейный drain мышц:**
- Сейчас: BG → pancreas tier (пороги 80/150/200/300) → muscle rate (таблица 7 значений)
- Вместо: `drainRate = clamp((BG - 80) × k, 0, maxRate)`
- Два параметра вместо 5 порогов + 7 rates: `k` (коэффициент) и `maxRate`
- Плавная, предсказуемая реакция: выше BG = пропорционально больше drain

**B — Линейная печень:**
- Сейчас: 3 ступени (150/h, 75/h, 0) по порогам BG 250/300
- Вместо: `liverRate = clamp(maxRate × (stopBG - BG) / range, 0, maxRate)`
- Параметры: `maxRate` (150/h), `stopBG` (порог полной остановки), `startBG` (макс. скорость)

### Открытые вопросы

1. **Порог остановки печени:** 200 слишком агрессивно (еда застревает, обучающий момент теряется). 300 — совпадает с текущим critical. Нужно тестировать.
2. **PassThrough при линейной печени:** при переполнении печени еда идёт напрямую в BG, обходя линейное правило. Может создать разрыв предсказуемости. Варианты: убрать PassThrough совсем, или убрать роль печени как буфера (еда → BG напрямую).
3. **Визуализация тиров:** tier circles на мышцах теряют точный смысл при линейном drain. Можно показывать приблизительный диапазон.
4. **Exercise модификаторы:** при линейном drain "+1 tier" не имеет смысла. Заменить на фиксированный бонус к drain (+30/h flat).
5. **Деградация pancreas:** сейчас снижает maxTier. При линейном drain нужно снижать `k` или `maxRate`.
6. **Скорость всасывания при BG=100:** если линейная печень замедляется пропорционально BG, при старте (BG=100) скорость может быть ~75/h вместо 150/h. Нужен ли минимальный порог, ниже которого печень всегда работает на максимуме?

### План реализации (предварительный)

1. **SimulationEngine** — заменить `processMuscleDrain()`:
   - Убрать lookup по таблице rates[tier]
   - Вычислять drain напрямую из BG: `rate = clamp((bg - 80) * k, 0, maxRate)`
   - Убрать зависимость от pancreas tier

2. **SimulationEngine** — заменить `processLiverRelease()`:
   - Убрать tier-based rules
   - Вычислять rate из BG: `rate = clamp(maxRate * (stopBG - bg) / (stopBG - startBG), 0, maxRate)`
   - Решить судьбу PassThrough

3. **organRules.json** — упростить конфиг:
   - muscles: убрать rules[], rates[], заменить на `{ k, maxRate, minBG }`
   - liver: убрать rules[], rates[], заменить на `{ maxRate, stopBG, startBG }`

4. **Exercise модификаторы** — заменить +tier на +flat drain:
   - `exercise_bonus`: `{ addDrainRate: 30 }` вместо `{ addTier: 1 }`
   - `intense_exercise_bonus`: `{ addDrainRate: 30 }` permanent

5. **Degradation** — адаптировать:
   - Вместо снижения maxTier → снижение `k` или `maxRate`

6. **UI** — адаптировать tier circles:
   - Показывать приблизительный диапазон на основе текущего drain rate

7. **Баланс** — подобрать k и maxRate для аналогичной динамики BG

### Ожидаемый результат

- Убрано: pancreas rules (5 правил), muscle rates array (7 значений), liver rules (5 правил)
- Добавлено: 2-3 скалярных параметра на орган
- Поведение: плавное, непрерывное, полностью предсказуемое по формуле
- Комплексность кода: снижается (меньше ветвлений, нет tier lookup)

---

## Removed: Star Rating System (v0.22.0)

**Удалена в v0.22.0** — заменена на assessment по кружкам деградации.

### Старая логика рейтинга (1-5 звёзд)

Рейтинг рассчитывался в `calculateRank(metrics: DayMetrics)` на основе трёх метрик:
- `timeInRange` — % времени BG в диапазоне 70–200
- `timeBelowLow` — % времени BG < 70
- `timeAboveCritical` — % времени BG > 300

**Алгоритм:**

1. Штрафы (приоритетные):
   - `timeBelowLow > 20%` ИЛИ `timeAboveCritical > 30%` → 1 звезда (Poor)
   - `timeBelowLow > 10%` ИЛИ `timeAboveCritical > 20%` → 2 звезды (Below Average)

2. По timeInRange:
   - ≥ 80% → 5 звёзд (Excellent)
   - ≥ 60% → 4 звезды (Good)
   - ≥ 40% → 3 звезды (Average)
   - < 40% → 2 звезды (Below Average)

**Условие победы:** `rank >= winCondition.minRank` (по умолчанию minRank=2)

**Сообщения:**
- 1: "Dangerous glucose levels! Review your meal plan."
- 2: "Room for improvement. Try balancing your meals."
- 3: "Decent day. Keep working on consistency."
- 4: "Good job! Your planning is paying off."
- 5: "Excellent! Perfect glucose management!"

**Компоненты:** RankDisplay.tsx (⭐ эмодзи + label + message), RankDisplay.css

### Причина удаления

Рейтинг на основе timeInRange был абстрактным — игрок не понимал связь между звёздами и механикой деградации. Новая система (assessment по кружкам деградации) напрямую привязана к видимой механике: видишь кружки → видишь оценку.
