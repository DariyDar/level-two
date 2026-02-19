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
| `main` | BG Planner | v0.28.0 | Graph-based food planning with cube mechanics, calorie tracking |
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

**BG Planner** — a blood glucose management game where players drag food cards directly onto a BG graph timeline. Food converts into colored "cubes" (20 mg/dL blocks) arranged in a pyramid shape. The goal is to plan meals within calorie limits while keeping BG levels reasonable.

### Tech Stack
- React 19 + TypeScript + Vite
- @dnd-kit for drag-and-drop
- Zustand for state management

### Game Flow

```
Single screen: Food Inventory (left) + BG Graph (right)
→ Drag food card onto graph
→ Food converts to pyramid of cubes
→ Track calories vs budget
→ Click cubes to remove placed food
```

### Key Files

#### Core Engine
- `src/version.ts` — version number (v0.28.0)
- `src/core/types.ts` — type definitions (Ship, PlacedFood, GameSettings, GRAPH_CONFIG)
- `src/core/cubeEngine.ts` — pyramid distribution algorithm, graph state calculation

#### Graph Component (`src/components/graph/`)
- `BgGraph.tsx` — SVG-based BG graph with grid, cubes, zones, drag-and-drop target
- `BgGraph.css` — graph styles
- `index.ts` — exports

#### Planning Phase (`src/components/planning/`)
- `PlanningPhase.tsx` — single-screen orchestrator with DnD context
- `PlanningHeader.tsx` — header with day label, kcal counter, settings toggles
- `ShipCard.tsx` — draggable food cards with emoji, kcal, duration, WP badge
- `ShipInventory.tsx` — food card list from level config

#### State Management
- `src/store/gameStore.ts` — Zustand store: placedFoods, settings, kcal tracking

#### Configuration
- `src/config/loader.ts` — loads and transforms foods.json, level configs
- `public/data/foods.json` — 24 food items with glucose, carbs, duration, kcal, wpCost
- `public/data/levels/level-01.json` — 3-day level config with kcalBudget per day

#### Shared UI
- `src/components/ui/Tooltip.tsx` — universal tooltip component
- `src/App.tsx` — root app component (single screen, no phase routing)
- `src/App.css` — app layout styles

### Current State (v0.28.0) — Graph-Based Planning

- **Single-Screen Design** ✅
  - No more Planning → Simulation → Results phase transitions
  - One screen: food inventory + BG graph
  - Old simulation engine, results system, organs, degradation — all removed

- **BG Graph** ✅
  - SVG graph with X axis (8 AM to 8 PM, 48 columns × 15 min)
  - Y axis (60 to 400 mg/dL, 17 rows × 20 mg/dL)
  - Grid lines: major every hour, minor every 15 min
  - Zone colors: green (60-140), yellow (140-200), orange (200-300), red (300-400)
  - X axis labels: 8 AM, 11 AM, 2 PM, 5 PM, 8 PM
  - Y axis labels: 60, 100, 200, 300, 400
  - Droppable zone for @dnd-kit

- **Cube Engine** ✅
  - Food → cubes: glucose / 20 = number of cubes
  - Duration → columns: duration / 15 = column count
  - Pyramid distribution: peak at ~40% of duration (realistic absorption curve)
  - Stacking: cubes from different foods stack vertically
  - BG line: red line connecting tops of cube stacks

- **Food Cards** ✅
  - Display: emoji, name, kcal, duration
  - WP cost badge preserved (for future use)
  - Drag from inventory → drop on graph
  - Click on placed cubes → remove food

- **Calorie System** ✅
  - Per-day kcalBudget from level config
  - Header shows used/budget with progress bar
  - Visual warning when over budget (red)

- **Game Settings** ✅
  - Time format toggle: 12h ↔ 24h
  - BG unit toggle: mg/dL ↔ mmol/L
  - Persisted in localStorage

### Food Data Structure
```json
{
  "id": "banana",
  "name": "Banana",
  "emoji": "🍌",
  "glucose": 200,
  "carbs": 20,
  "duration": 60,
  "kcal": 105,
  "wpCost": 1,
  "description": "Natural energy, potassium rich."
}
```

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
      "availableFoods": [
        { "id": "banana", "count": 1 }
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

### Cube Engine Details

#### Pyramid Algorithm
1. `totalCubes = glucose / 20`
2. `columnCount = duration / 15`
3. Weights generated with peak at 40% of duration
4. Cubes distributed proportionally, rounded to preserve total
5. Drop column = left edge (start of food absorption)

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
- WP budget system (spend/refund)
- BG sparkline (replaced by main graph)
- Phase transitions (Planning/Simulation/Results)
- Degradation circles
- Exercise interventions (to be redesigned)
- Metformin, fiber system

### Known Issues
- Preview during drag doesn't show ghost cubes yet (pointer tracking needs refinement)
- Win/loss conditions not yet implemented (to be discussed)
- Interventions not yet redesigned for graph-based system
- No multi-day progression (day navigation UI not yet built)

---

## Project: Glucose TD (branch: `tower-defense`)

**Glucose TD** — tower defense reimagining of the metabolic simulation. Food generates glucose projectiles that fall through organ defense zones. See full documentation in `docs/td-concept/README.md` on the tower-defense branch.

Current version: v0.4.1 — survival mode, circle indicators, explosion VFX.
