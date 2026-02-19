# Project Rules for Claude

## Git Workflow

**Always pull before starting work** — Other collaborators may have pushed changes. Run `git pull` at the start of each session.

**Always push after commits** — User tests online, so every commit must be pushed immediately after creation.

```bash
# At start of session:
git pull

# After changes:
git add ... && git commit ... && git push
```

## Repository Structure

This repository contains **independent projects** on separate branches:

| Branch | Project | Version | Description |
|--------|---------|---------|-------------|
| `main` | BG Planner | v0.30.4 | Graph-based food planning with cubes, interventions, decay, wave animations |
| `port-planner` | Port Planner | v0.27.1 | Archived — metabolic simulation (WP, slots, organs, SVG pipes) |
| `match3` | Port Planner + Match-3 | v0.28.11 | Match-3 mini-game for food card acquisition |
| `tower-defense` | Glucose TD | v0.4.1 | Tower defense reimagining (projectiles, organ zones) |
| `Dariy` | Port Planner | v0.25.1 | Archived — Mood system branch |

**Production deploy** (Vercel): `main` branch → https://level-two-eight.vercel.app/

## Version Number

**Always increment version after changes** — Update `src/version.ts` after every change and tell user which version to test.

Format: `v0.X.Y` where X is feature number, Y is fix number within feature.

Example:
```
v0.2.4  →  v0.2.5  (fix within same feature)
v0.2.5  →  v0.3.0  (new feature)
```

## Language

- Communicate in Russian
- Code and comments in English

## Build Verification

**CRITICAL: Always run `npm run build` before committing** — Vercel will reject deployments with TypeScript errors.

Common TypeScript issues to avoid:
- Unused imports → Remove them or prefix with `_`
- Unused function parameters → Prefix with `_` (e.g., `_context`)
- Missing fields in types → Update type definitions when adding new fields
- Optional fields → Use `??` for defaults (e.g., `config.minTier ?? 0`)
- Private method access → Make methods `public` or `static` if needed externally

```bash
# Before committing:
npm run build

# If build fails, fix errors, then commit
```

## Documentation

**Keep documentation up to date** — After making significant changes, update:

1. **CLAUDE.md** — Update "Current State" and "Known Issues" sections
2. **docs/** — Update relevant design docs if architecture changes
3. **Code comments** — Add/update comments for complex logic

What counts as "significant":
- New features or components
- Changed architecture or data flow
- Fixed or discovered issues
- Changed file structure

---

## Project: BG Planner (branch: `main`)

**BG Planner** — a blood glucose management game where players drag food cards and exercise interventions onto a BG graph timeline. Food converts into colored "cubes" (20 mg/dL blocks) with ramp-up and decay curves. Interventions (walking, running) remove cubes from the top. The goal is to plan meals within WP budget while keeping BG levels reasonable.

### Tech Stack
- React 19 + TypeScript + Vite
- @dnd-kit for drag-and-drop
- Zustand for state management

### Game Flow

```
Single screen: BG Graph (top) + Food Inventory + Intervention Inventory (bottom)
→ Drag food card onto graph → cubes appear with wave animation
→ Drag intervention onto graph → top cubes fade out with wave animation
→ Track WP budget (food + interventions share same pool)
→ Track kcal with assessment labels
→ Click cubes to remove placed food/intervention
```

### Key Files

#### Core Engine
- `src/version.ts` — version number (v0.30.4)
- `src/core/types.ts` — type definitions (Ship, PlacedFood, Intervention, PlacedIntervention, GameSettings, GRAPH_CONFIG)
- `src/core/cubeEngine.ts` — ramp+decay curve algorithm, intervention reduction, graph state calculation

#### Graph Component (`src/components/graph/`)
- `BgGraph.tsx` — SVG-based BG graph with grid, cubes, zones, intervention burn rendering, wave animations, drag-and-drop target
- `BgGraph.css` — graph styles, cubeAppear/cubeBurn keyframe animations
- `index.ts` — exports

#### Planning Phase (`src/components/planning/`)
- `PlanningPhase.tsx` — single-screen orchestrator with DnD context for food + interventions
- `PlanningHeader.tsx` — header with day label, WP budget, kcal assessment, settings toggles (time format, BG unit, decay ON/OFF)
- `ShipCard.tsx` — draggable food cards with emoji, kcal, carbs, duration, WP badge
- `ShipInventory.tsx` — food card list from level config
- `InterventionCard.tsx` — draggable intervention cards (green) with emoji, duration, depth, WP badge
- `InterventionCard.css` — intervention card styles
- `InterventionInventory.tsx` — intervention card list from level config

#### State Management
- `src/store/gameStore.ts` — Zustand store: placedFoods, placedInterventions, settings, combined kcal/WP tracking

#### Configuration
- `src/config/loader.ts` — loads and transforms foods.json, interventions.json, level configs
- `public/data/foods.json` — 24 food items with glucose, carbs, protein, fat, duration, kcal, wpCost
- `public/data/interventions.json` — 2 interventions: Light Walk, Heavy Run
- `public/data/levels/level-01.json` — 3-day level config with kcalBudget, wpBudget, availableInterventions per day

#### Shared UI
- `src/components/ui/Tooltip.tsx` — universal tooltip component
- `src/App.tsx` — root app component (single screen, no phase routing)
- `src/App.css` — app layout styles

### Current State (v0.30.4) — Interventions + Wave Animations

- **Single-Screen Design** ✅
  - Graph on top, food inventory + intervention inventory below (horizontal card layout)
  - No phase transitions — everything on one screen

- **BG Graph** ✅
  - SVG graph with X axis (8 AM to 8 PM, 48 columns × 15 min)
  - Y axis (60 to 400 mg/dL, 17 rows × 20 mg/dL)
  - Grid lines: major every hour, minor every 15 min
  - Zone colors: green (60-140), yellow (140-200), orange (200-300), red (300-400)
  - X axis labels: 8 AM, 11 AM, 2 PM, 5 PM, 8 PM
  - Y axis labels: 100, 200, 300, 400 (60 mg/dL label removed)
  - BG line and food emoji on graph — disabled
  - Droppable zone for @dnd-kit (accepts both food and interventions)

- **Cube Engine** ✅
  - Food → cubes: glucose / 20 = peak cube height
  - Duration → columns: duration / 15 = ramp-up column count
  - **Ramp + Decay curve** (replaces old pyramid):
    - Rise phase: linear from 0 to peak over duration columns
    - Decay ON: gradual decline after peak (~0.5 cubes per column = 1 cube/30 min)
    - Decay OFF: flat plateau from peak to right edge
  - Stacking: cubes from different foods stack vertically
  - Decay toggle: ON/OFF button in header (toggling restarts game)

- **Intervention System** ✅
  - Two interventions: Light Walk (🚶 60m, 2 WP, -3 cubes) and Heavy Run (🏃 30m, 4 WP, -5 cubes)
  - Intervention curve: ramp up during duration, then flat to end of graph
  - Cubes are removed from the **top** of the food stack at each column
  - Burned cubes rendered semi-transparent (opacity 0.35) in original food color
  - Click burned cubes to remove intervention
  - Interventions share WP budget with food

- **Wave Animations** ✅
  - `cubeAppear`: food cubes pop in with scale (0.3→1.08→1) + opacity wave, left-to-right
  - `cubeBurn`: burned cubes fade to 0.35 opacity with wave effect
  - Wave delay: 20ms per column offset from drop point

- **WP Budget** ✅
  - Per-day wpBudget from level config (16 for all days)
  - Header shows wpUsed/wpBudget with ☀️ icon
  - **Combined tracking**: food wpCost + intervention wpCost share same pool
  - **Hard limit**: cards disabled (grayed out, non-draggable) when WP insufficient
  - Drop rejected if wpCost exceeds remaining WP

- **Food Cards** ✅
  - Display: emoji, name, kcal, carbs (g), duration (m)
  - WP cost badge (☀️) when wpCost > 0
  - Disabled state (grayed out) when WP insufficient
  - Drag from inventory → drop on graph
  - Click on placed cubes → remove food
  - Inventory below graph, cards arranged horizontally (flex-wrap)

- **Kcal Assessment** ✅
  - No hard calorie limit — kcal is informational
  - All food kcal values multiplied by 2.5 (from original USDA per-serving)
  - Header shows total kcal + text assessment based on % of kcalBudget:
    - 0%: Fasting (gray)
    - <25%: Starving (red)
    - 25-50%: Hungry (orange)
    - 50-75%: Light (yellow)
    - 75-100%: Well Fed (green)
    - 100-120%: Full (green)
    - 120-150%: Overeating (orange)
    - >150%: Stuffed (red)

- **Food Nutritional Data** ✅
  - All 24 foods have: carbs, protein, fat, kcal (from USDA × 2.5)
  - protein/fat stored for future use, not displayed on cards yet

- **Game Settings** ✅
  - Time format toggle: 12h ↔ 24h
  - BG unit toggle: mg/dL ↔ mmol/L
  - Decay toggle: ON ↔ OFF (restarts game)
  - Persisted in localStorage

### Food Data Structure
```json
{
  "id": "banana",
  "name": "Banana",
  "emoji": "🍌",
  "glucose": 270,
  "carbs": 27,
  "protein": 1,
  "fat": 0,
  "duration": 45,
  "kcal": 263,
  "wpCost": 1,
  "description": "Natural energy, potassium rich."
}
```

### Intervention Data Structure
```json
{
  "id": "lightwalk",
  "name": "Light Walk",
  "emoji": "🚶",
  "depth": 3,
  "duration": 60,
  "wpCost": 2
}
```

### Food Parameters Table

Based on USDA FoodData Central, GI databases. `glucose = carbs × 10`, duration from GI + macronutrient composition. Kcal = USDA per-serving × 2.5.

| # | Food | Emoji | Carbs | Protein | Fat | Kcal | WP | Duration | Cubes | Cols |
|---|------|-------|------:|--------:|----:|-----:|---:|---------:|------:|-----:|
| 1 | Banana | 🍌 | 27g | 1g | 0g | 263 | 1 | 45m | 14 | 3 |
| 2 | Apple | 🍎 | 25g | 1g | 0g | 238 | 1 | 45m | 13 | 3 |
| 3 | Ice Cream | 🍦 | 24g | 4g | 11g | 518 | 0 | 60m | 12 | 4 |
| 4 | Popcorn | 🍿 | 22g | 3g | 2g | 283 | 1 | 45m | 11 | 3 |
| 5 | Cookie | 🍪 | 17g | 2g | 7g | 365 | 2 | 30m | 9 | 2 |
| 6 | Caesar Salad | 🥗 | 10g | 9g | 12g | 475 | 3 | 75m | 5 | 5 |
| 7 | Choco Muffin | 🧁 | 52g | 6g | 18g | 993 | 0 | 60m | 26 | 4 |
| 8 | Sandwich | 🥪 | 40g | 22g | 28g | 1250 | 2 | 75m | 20 | 5 |
| 9 | Chicken Meal | 🍗 | 5g | 35g | 12g | 700 | 3 | 120m | 3 | 8 |
| 10 | Bowl of Rice | 🍚 | 45g | 4g | 0g | 513 | 4 | 45m | 23 | 3 |
| 11 | Hamburger | 🍔 | 24g | 17g | 14g | 738 | 3 | 75m | 12 | 5 |
| 12 | Oatmeal | 🥣 | 28g | 6g | 4g | 415 | 4 | 60m | 14 | 4 |
| 13 | Pizza | 🍕 | 34g | 12g | 12g | 750 | 3 | 60m | 17 | 4 |
| 14 | Boiled Eggs | 🥚 | 1g | 13g | 10g | 388 | 4 | 150m | 1 | 10 |
| 15 | Mixed Berries | 🫐 | 21g | 2g | 1g | 213 | 2 | 45m | 11 | 3 |
| 16 | Greek Yogurt | 🥛 | 8g | 11g | 11g | 488 | 3 | 75m | 4 | 5 |
| 17 | Milk 2% | 🥛 | 12g | 8g | 5g | 305 | 3 | 45m | 6 | 3 |
| 18 | Vegetable Stew | 🥘 | 20g | 5g | 5g | 420 | 4 | 75m | 10 | 5 |
| 19 | Boiled Carrots | 🥕 | 8g | 1g | 0g | 133 | 4 | 45m | 4 | 3 |
| 20 | Chickpeas | 🫘 | 27g | 9g | 3g | 410 | 3 | 75m | 14 | 5 |
| 21 | Cottage Cheese | 🧀 | 5g | 25g | 9g | 515 | 4 | 120m | 3 | 8 |
| 22 | Hard Cheese | 🧀 | 1g | 7g | 9g | 300 | 3 | 150m | 1 | 10 |
| 23 | Avocado | 🥑 | 9g | 2g | 15g | 400 | 3 | 105m | 5 | 7 |
| 24 | Mixed Nuts | 🥜 | 4g | 5g | 16g | 455 | 2 | 105m | 2 | 7 |

**Derived:** Cubes = glucose / 20 (glucose = carbs × 10), Cols = duration / 15. Sources: USDA FoodData Central, glycemic-index.net

### Intervention Parameters

| Intervention | Emoji | Depth | Duration | WP | Effect |
|-------------|-------|------:|---------:|---:|--------|
| Light Walk | 🚶 | 3 cubes | 60m | 2 | Removes 3 cubes from top, ramp 60m then flat to end |
| Heavy Run | 🏃 | 5 cubes | 30m | 4 | Removes 5 cubes from top, ramp 30m then flat to end |

### Level Config Structure
```json
{
  "id": "level-01",
  "name": "First Steps",
  "days": 3,
  "dayConfigs": [
    {
      "day": 1,
      "kcalBudget": 2000,
      "wpBudget": 16,
      "availableFoods": [
        { "id": "banana", "count": 1 }
      ],
      "availableInterventions": [
        { "id": "lightwalk", "count": 1 },
        { "id": "heavyrun", "count": 1 }
      ]
    }
  ]
}
```

### Graph Configuration Constants
| Constant | Value | Location |
|----------|-------|----------|
| startHour | 8 (8 AM) | `types.ts` GRAPH_CONFIG |
| endHour | 20 (8 PM) | `types.ts` GRAPH_CONFIG |
| cellWidthMin | 15 min | `types.ts` GRAPH_CONFIG |
| cellHeightMgDl | 20 mg/dL | `types.ts` GRAPH_CONFIG |
| bgMin | 60 mg/dL | `types.ts` GRAPH_CONFIG |
| bgMax | 400 mg/dL | `types.ts` GRAPH_CONFIG |
| TOTAL_COLUMNS | 48 | `types.ts` derived |
| TOTAL_ROWS | 17 | `types.ts` derived |
| CELL_SIZE | 18px (SVG) | `BgGraph.tsx` |
| DECAY_RATE | 0.5 cubes/col | `cubeEngine.ts` |

### Cube Engine Details

#### Ramp + Decay/Plateau Algorithm
1. `peakCubes = Math.round(glucose / 20)`
2. `riseCols = Math.round(duration / 15)`
3. Rise phase (cols 0..riseCols-1): linear from 1 to peakCubes
4. If decay ON: decline at 0.5 cubes/col until 0
5. If decay OFF: flat plateau at peakCubes to right edge
6. Drop column = left edge (start of food absorption)

#### Intervention Algorithm
1. `depth` = cubes to remove at peak
2. `riseCols = Math.round(duration / 15)`
3. Rise phase: linear from 1 to depth
4. Plateau: flat at depth from peak to right edge of graph
5. Multiple interventions stack (reductions add up)
6. Cubes removed from top — bottom cubes stay visible

#### Food Colors
Cubes are colored per food type (8-color cycle): blue, red, green, orange, purple, pink, teal, yellow

#### BG Zones
| Zone | Range | Color |
|------|-------|-------|
| Normal | 60-140 mg/dL | Green |
| Elevated | 140-200 mg/dL | Yellow |
| High | 200-300 mg/dL | Orange |
| Danger | 300-400 mg/dL | Red |

### Removed Systems (archived in `port-planner` branch)
- Simulation engine (SimulationEngine, RuleEngine)
- Results system (calculateResults, assessment, degradation)
- Organ system (liver, pancreas, muscles, kidneys)
- Pipe system (SVG flow visualization)
- Slot grid (time slot placement)
- Old WP budget system (spend/refund per slot — replaced by graph-based WP)
- BG sparkline (replaced by main graph)
- Phase transitions (Planning/Simulation/Results)
- Degradation circles
- Metformin, fiber system

### Known Issues
- Preview during drag doesn't show ghost cubes yet (pointer tracking needs refinement)
- Win/loss conditions not yet implemented (to be discussed)
- No multi-day progression (day navigation UI not yet built)
- Intervention click on burned cubes always removes the first intervention (not necessarily the one that burned that specific cube)

---

## Project: Glucose TD (branch: `tower-defense`)

**Glucose TD** — tower defense reimagining of the metabolic simulation. Food generates glucose projectiles that fall through organ defense zones. See full documentation in `docs/td-concept/README.md` on the tower-defense branch.

Current version: v0.4.1 — survival mode, circle indicators, explosion VFX.
