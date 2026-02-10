# Glucose TD — Concept Document

**Version:** v0.4.1 (TD-feb10)
**Date:** February 10, 2026
**Branch:** `tower-defense`

## Overview

Glucose TD is a tower defense game that teaches blood glucose management. Food generates glucose "projectiles" that fall from top to bottom. Body organs act as defensive towers — liver slows projectiles, muscles and kidneys destroy them. Glucose that reaches the base counts as "excess" and causes organ degradation.

The game is a redesign of the Port Planner metabolic simulation, reimagined as a tower defense format for more intuitive and engaging gameplay.

## Core Concept

```
[Food Cards] → spawn glucose projectiles at top (position 0.0)
     ↓
[Liver Zone]  — slows projectiles (0.15–0.35)
     ↓
[Muscle Zone] — destroys glucose (0.30–0.75), DPS based on pancreas tier
     ↓
[Kidney Zone] — last defense (0.80–0.95)
     ↓
[Base Line]   — position 1.0 → excess glucose → organ damage
```

## Game Flow

### Three Phases

1. **Planning Phase** — Player composes a meal from food card offers
2. **Simulation Phase** — Glucose projectiles fall, organs defend automatically
3. **Results Phase** — Assessment, degradation applied, continue or defeat

### Survival Mode

The game runs as an endless survival loop:
- Each "meal" is a segment (Meal 1, Meal 2, Meal 3, ...)
- After each simulation, player receives a random food card as reward
- Degradation accumulates across segments
- Defeat at 12 total degradation circles
- Progressive difficulty: offer tiers increase with segment count

```
Planning → Simulation → Results → (Continue) → Planning → ...
                                  (Defeat)   → Restart
```

## Food System

### Food Cards

Each food card has:
| Field | Description |
|-------|-------------|
| `id` | Unique identifier (e.g., "oatmeal") |
| `name` | Display name |
| `emoji` | Visual icon |
| `carbs` | Displayed carbs in grams |
| `glucose` | Total glucose in mg (carbs × 10) |
| `glucoseSpeed` | Projectile fall speed (1–4) |
| `releaseDuration` | Seconds to release all glucose |
| `tier` | 1 = healthy, 2 = neutral, 3 = junk |
| `tag` | Category: fiber, protein, sweet |
| `modifiers` | Special effects (see below) |

### Tiers

| Tier | Type | Speed | Characteristics |
|------|------|-------|-----------------|
| 1 | Healthy | Slow (1) | Low glucose, beneficial modifiers (fiber, protein, fat) |
| 2 | Neutral | Medium (2) | Medium glucose, few or no modifiers |
| 3 | Junk | Fast (3–4) | High glucose, sugar modifier, fast release |

### Food Database (13 cards)

**Tier 1 — Healthy (speed 1):**
| ID | Emoji | Carbs | Glucose | Tag | Modifiers |
|----|-------|-------|---------|-----|-----------|
| oatmeal | 🥣 | 25g | 250mg | fiber | fiber |
| chicken_breast | 🍗 | 5g | 50mg | protein | protein |
| broccoli | 🥦 | 8g | 80mg | fiber | fiber |
| salmon | 🐟 | 3g | 30mg | protein | protein, fat |
| greek_yogurt | 🥛 | 10g | 100mg | protein | protein |

**Tier 2 — Neutral (speed 2):**
| ID | Emoji | Carbs | Glucose | Tag | Modifiers |
|----|-------|-------|---------|-----|-----------|
| rice | 🍚 | 35g | 350mg | fiber | — |
| pasta | 🍝 | 40g | 400mg | fiber | — |
| banana | 🍌 | 27g | 270mg | fiber | — |
| bread | 🍞 | 30g | 300mg | fiber | — |
| apple | 🍎 | 20g | 200mg | fiber | fiber |

**Tier 3 — Junk (speed 3–4):**
| ID | Emoji | Carbs | Glucose | Tag | Modifiers |
|----|-------|-------|---------|-----|-----------|
| cola | 🥤 | 35g | 350mg | sweet | sugar |
| chocolate_bar | 🍫 | 30g | 300mg | sweet | sugar |
| ice_cream | 🍦 | 35g | 350mg | sweet | sugar, fat |

### Modifiers

**Meal-level** (apply to all projectiles from this meal, don't stack):
| Modifier | Effect |
|----------|--------|
| `fiber` | All projectile speeds ×0.7 |
| `sugar` | All projectile speeds ×1.4 |

**Card-level** (apply only to this card's projectiles):
| Modifier | Effect |
|----------|--------|
| `protein` | Release duration ×1.5 (slower drip = fewer simultaneous projectiles) |
| `fat` | Speed ×0.85, duration ×1.3 |

**Tag-level:**
| Tag | Effect |
|-----|--------|
| `protein` | If any card in meal has tag "protein", muscle DPS ×1.25 |

## Offer System

### How Offers Work

Each planning phase presents 3 sequential offers of 3 cards each:
1. Player sees Offer 1 (3 cards) → picks 1 for a slot or sends 1 to inventory → rest discarded
2. Player sees Offer 2 (3 cards) → same choice
3. Player sees Offer 3 (3 cards) → same choice

Additionally:
- **Slot 0 pre-placed:** A random Fast/VeryFast food is auto-placed in slot 0 each segment
- **Inventory:** Cards saved for future segments; can be placed in empty slots

### Offer Templates (Progressive Difficulty)

Templates define the tier of each card in an offer: `[tier1, tier2, tier3]`

| Segments | Template 1 | Template 2 | Template 3 | Difficulty |
|----------|-----------|-----------|-----------|------------|
| 1–3 | [1,1,2] | [1,2,2] | [1,2,3] | Easy — mostly healthy |
| 4–6 | [1,2,3] | [1,2,3] | [2,2,3] | Medium — balanced |
| 7+ | [1,2,3] | [2,2,3] | [2,3,3] | Hard — more junk |

### Constraints

- `noRepeatCardIds`: Cards already offered this segment won't repeat
- `maxSameTag: 3`: Max cards of same tag across all offers

## Organ System

### Battlefield Layout

```
Position 0.0 ─── TOP (projectiles spawn here)
  │
  ├── 0.15 ─ Liver zone start
  ├── 0.30 ─ Muscle zone start
  ├── 0.35 ─ Liver zone end
  │
  ├── 0.75 ─ Muscle zone end
  ├── 0.80 ─ Kidney zone start
  ├── 0.95 ─ Kidney zone end
  │
Position 1.0 ─── BASE (excess glucose)
```

### Liver (Slowdown Tower)

| Parameter | Value |
|-----------|-------|
| Zone | 0.15 – 0.35 |
| Slow factor | 0.6 (reduces projectile speed to 60%) |
| Capacity | 4 simultaneous projectiles |
| Degradation penalty | +0.1 slow factor per circle (less slowdown) |

The liver slows projectiles passing through its zone, giving muscles more time to destroy them.

### Pancreas (Command Center)

The pancreas determines muscle activation tier based on active projectile count:

| Active Projectiles | Pancreas Tier |
|-------------------|---------------|
| 0 | Tier 0 (idle) |
| 1+ | Tier 1 |
| 3+ | Tier 2 |
| 5+ | Tier 3 |
| 8+ | Tier 4 |

- Max tier: 4 (reduced by degradation)
- Degradation penalty: -1 max tier per circle

### Muscles (Primary DPS Tower)

| Parameter | Value |
|-----------|-------|
| Zone | 0.30 – 0.75 |
| Max targets | 2 simultaneous |
| DPS per tier | 7 mg/sec |
| Targeting | Closest to base first |

Muscle DPS = pancreas_tier × 7 × protein_boost

With protein tag: DPS ×1.25

**Tier DPS table (no protein boost):**
| Pancreas Tier | Muscle DPS |
|---------------|-----------|
| 0 | 0 |
| 1 | 7 |
| 2 | 14 |
| 3 | 21 |
| 4 | 28 |

### Kidneys (Last Defense)

| Parameter | Value |
|-----------|-------|
| Zone | 0.80 – 0.95 |
| Max targets | 1 |
| DPS | 8 mg/sec (base) |
| Degradation penalty | -5 DPS per circle |

## Simulation Engine

### Projectiles

Each projectile has:
- `glucose`: Remaining mg (destroyed when ≤ 0)
- `position`: 0.0 (top) → 1.0 (base)
- `speed`: Current effective speed
- `baseSpeed`: Original speed from card

Spawning:
- `PROJECTILE_SIZE = 10 mg` — glucose per projectile
- A card with 300mg glucose spawns 30 projectiles
- Spawn interval = `releaseDuration / projectileCount`
- Slot activation delay: 3 seconds between slots

### Speed Calculation

```
baseSpeed = card.glucoseSpeed × mealSpeedMultiplier × cardSpeedMultiplier × SPEED_SCALE

SPEED_SCALE = 0.04 (glucoseSpeed 1 → 0.04 pos/sec → ~25 sec to cross)

In liver zone: effectiveSpeed = baseSpeed × liverSlowFactor
```

### Tick Loop (per frame)

1. **Activate slots** — based on time vs segment delay
2. **Spawn projectiles** — from active slot spawn states
3. **Move projectiles** — apply speed, liver slowdown
4. **Update pancreas** — tier from active projectile count
5. **Muscle fire** — target and damage projectiles in range
6. **Kidney fire** — target and damage projectiles in range
7. **Process base impacts** — remove dead/impacted projectiles, track VFX
8. **Check completion** — all slots spawned, no projectiles remain

### Impact VFX

When a projectile reaches position ≥ 1.0:
- Its remaining glucose is added to `excessGlucose`
- An `ImpactVFX` entry is created (explosion emoji 💥)
- VFX cleaned up after 0.6 seconds

## Degradation System

### How Degradation Works

After each simulation, excess glucose determines degradation:

| Excess Glucose | Degradation Circles |
|---------------|-------------------|
| < 100 mg | 0 |
| ≥ 100 mg | 1 |
| ≥ 250 mg | 2 |
| ≥ 500 mg | 3 |
| ≥ 800 mg | 4 |
| ≥ 1200 mg | 5 |

### Degradation Distribution

Circles are distributed in a cycle: **Liver → Pancreas → Kidneys → Liver → ...**

Example: 5 total circles = 2 Liver + 2 Pancreas + 1 Kidneys

### Degradation Effects

| Organ | Per Circle | Effect |
|-------|-----------|--------|
| Liver | +0.1 slow factor | Less slowdown (0.6 → 0.7 → 0.8 → ...) |
| Pancreas | -1 max tier | Lower max muscle activation (4 → 3 → 2 → ...) |
| Kidneys | -5 DPS | Less last-defense damage (8 → 3 → 0) |

### Assessment

| New Circles | Assessment |
|------------|------------|
| 0 | Excellent |
| 1 | Decent |
| 2–3 | Poor |
| 4+ | Defeat |

**Defeat condition:** Total degradation circles ≥ 12

## UI Components

### Planning Phase
- **Header:** "Meal {N}" counter
- **MealSlots:** 3 drag-and-drop slots for food cards
- **VersusBar:** Attack vs Defense comparison labels
- **MealSummary:** Summary of placed cards
- **OfferCards:** Current offer (3 cards to choose from)
- **Simulate button:** Appears when all 3 slots filled
- **Inventory:** Saved cards from previous segments
- **OrganDamageGrid:** Current organ degradation state (emoji + circles)

### Simulation Phase
- **Battlefield:** SVG with colored organ zones, animated projectiles, targeting lines
- **OrganStatus:** 2×2 grid with emoji, name, and tier circles (active circles flash)
- **Stats:** Active projectile count, excess glucose counter
- **Impact VFX:** 💥 emoji explosion animation at base

### Results Phase
- **Assessment:** Excellent / Decent / Poor / Defeat
- **Stats:** Excess glucose total, new degradation circles
- **OrganDamageGrid:** Updated organ damage visualization
- **Actions:** Continue (next meal) or Restart (on defeat)

## Tech Stack

- **React 19** — UI framework
- **TypeScript** — type safety
- **Vite 7** — build tool
- **Zustand** — state management (with persist middleware)
- **@dnd-kit** — drag-and-drop for food cards
- **framer-motion** — animations (available, not yet utilized)

## File Structure

```
src/
├── version.ts              — version number
├── types.ts                — all TypeScript types and constants
├── App.tsx                 — app shell, phase routing
├── App.css                 — app styles
├── config/
│   └── loader.ts           — JSON data loading
├── core/
│   ├── offerAlgorithm.ts   — offer generation with tier/tag constraints
│   └── simulation/
│       └── TDSimulation.ts — simulation engine (tick loop)
├── store/
│   └── gameStore.ts        — Zustand store (game state + actions)
├── components/
│   ├── planning/
│   │   ├── PlanningPhase.tsx/css    — planning orchestrator
│   │   ├── FoodCardComponent.tsx/css — food card display
│   │   ├── MealSlots.tsx/css        — 3 meal slots
│   │   ├── MealSummary.tsx/css      — slot summary
│   │   ├── OfferCards.tsx/css       — offer card display
│   │   ├── Inventory.tsx/css        — inventory panel
│   │   ├── VersusBar.tsx/css        — attack/defense bar
│   │   ├── OrganTierCircles.tsx/css — circle indicators
│   │   └── OrganOverview.tsx/css    — organ overview (disabled)
│   ├── simulation/
│   │   ├── SimulationPhase.tsx/css  — simulation orchestrator
│   │   ├── Battlefield.tsx/css      — SVG battlefield
│   │   └── OrganStatus.tsx/css      — organ status panel
│   ├── results/
│   │   └── ResultsPhase.tsx/css     — results display
│   └── shared/
│       └── OrganDamageGrid.tsx/css  — shared organ damage component
└── hooks/
    └── useSimulationLoop.ts         — requestAnimationFrame loop

public/data/
├── foods.json              — 13 food cards
└── levels/
    └── level-01.json       — level config (degradation thresholds)
```

## Key Constants

```typescript
// Simulation
SPEED_SCALE = 0.04          // position units per second at speed 1
PROJECTILE_SIZE = 10        // mg per projectile
SEGMENT_DELAY = 3           // seconds between slot activations

// Liver
LIVER_SLOW_FACTOR = 0.6     // speed multiplier in liver zone
LIVER_CAPACITY = 4          // max simultaneous slowdowns

// Pancreas
PANCREAS_TIER_THRESHOLDS = [0, 1, 3, 5, 8]  // projectile count → tier
PANCREAS_MAX_TIER = 4

// Muscles
MUSCLE_DPS_PER_TIER = 7     // mg/sec per pancreas tier
MUSCLE_MAX_TARGETS = 2

// Kidneys
KIDNEY_DPS = 8              // mg/sec base
KIDNEY_MAX_TARGETS = 1

// Degradation
MAX_DEGRADATION_CIRCLES = 12    // defeat threshold
DEGRADATION_THRESHOLDS = [100, 250, 500, 800, 1200]  // excess glucose → circles

// Modifiers
FIBER_SPEED_MULTIPLIER = 0.7
SUGAR_SPEED_MULTIPLIER = 1.4
PROTEIN_DURATION_MULTIPLIER = 1.5
FAT_SPEED_MULTIPLIER = 0.85
FAT_DURATION_MULTIPLIER = 1.3
PROTEIN_TAG_MUSCLE_BOOST = 1.25

// Degradation penalties
LIVER_SLOW_PENALTY = 0.1       // per circle
PANCREAS_TIER_PENALTY = 1      // per circle
KIDNEYS_DPS_PENALTY = 5        // per circle
```

## Strategy Implications

### For Players
- **Healthy food (tier 1):** Slow projectiles, low glucose, beneficial modifiers → safe choice
- **Junk food (tier 3):** Fast projectiles, high glucose, sugar modifier → dangerous
- **Protein tag:** Boosts muscle damage by 25% — key defensive multiplier
- **Fiber modifier:** Slows ALL projectiles in the meal — excellent defense
- **Inventory management:** Save healthy cards for tough segments

### Progressive Difficulty
- Early segments (1–3): Easy offers with more tier 1 options
- Mid segments (4–6): Balanced offers
- Late segments (7+): Harder offers with more tier 2-3 cards
- Slot 0 always gets a random fast/junk food → guaranteed challenge

### Degradation Spiral
- Liver degradation → less slowdown → projectiles reach muscles faster
- Pancreas degradation → lower max tier → less muscle DPS
- Kidneys degradation → less last-defense DPS
- Each organ weakening compounds the others → death spiral
