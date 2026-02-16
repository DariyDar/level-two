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
| `main` | Port Planner | v0.27.1 | Metabolic simulation (WP system, sugary tags, difficulty progression, SVG pipes) |
| `match3` | Port Planner + Match-3 | v0.28.8 | Match-3 mini-game for food card acquisition, drag-and-drop planning |
| `tower-defense` | Glucose TD | v0.4.1 | Tower defense reimagining (projectiles, organ zones, survival mode) |
| `Dariy` | Port Planner | v0.25.1 | Archived — Mood system branch (superseded by main) |

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

## Project: Port Planner + Match-3 (branch: `match3`)

**Port Planner with Match-3** — a metabolic simulation game teaching blood glucose management. Players play a match-3 mini-game to earn food cards, drag-and-drop them into time slots to plan meals, then watch a glucose simulation with SVG pipe visualizations, and review results with organ degradation tracking.

### Tech Stack
- React 19 + TypeScript + Vite
- @dnd-kit for drag-and-drop
- Zustand for state management

### Game Flow

```
Planning (Match-3 + Drag-and-Drop) → Simulation → Results → (next day) → Planning → ...
                                                   (defeat)   → Restart Level
                                                   (last day) → Victory → Restart
```

Planning phase flow:
```
Match-3 board → food tiles drop to bottom → cards appear in inventory → drag into time slots → Simulate
```

### Key Files

#### Match-3 Engine (`src/core/match3/`)
- `types.ts` — Match-3 types (SimpleTile, FoodTile, Board, Match3Config, CascadeStep, SwapResult)
- `engine.ts` — cascade loop: swap → match → gravity → refill (MAX_CASCADE_DEPTH=10)
- `boardGenerator.ts` — initial board generation avoiding 3-in-a-row
- `matchDetector.ts` — horizontal/vertical scan for 3+ same-shape runs, merges overlapping groups
- `swapValidator.ts` — adjacency check, at least one SimpleTile required, must produce match
- `gravityResolver.ts` — column-wise fall, food collection from bottom row (repeats until clear)
- `boardRefiller.ts` — fills nulls with random tiles, foodSpawnChance for new food (max 20% cap)
- `index.ts` — public API re-exports

#### Match-3 UI (`src/components/planning/match3/`)
- `Match3Board.tsx` — board grid, drag-threshold swap (15px), moves counter, deadlock/disabled states
- `Tile.tsx` — tile rendering: SimpleTile (colored shape ■▲●◆) or FoodTile (ship emoji with border)
- `Match3Board.css` — grid layout, animations (tile-match, tile-fall, tile-spawn, tile-food-drop, moves-pulse)

#### Match-3 Hook
- `src/hooks/useMatch3.ts` — state management, animation sequencing, cascade orchestration
  - Animation timings: match 300ms → gravity 250ms → food-drop 300ms → refill 200ms → pause 100ms
  - Tracks: board, movesRemaining, droppedFoodTiles, isAnimating, animationPhase, noValidMoves

#### Planning Phase
- `src/components/planning/PlanningPhase.tsx` — planning orchestrator, match-3 integration, validation
- `src/components/planning/PlanningHeader.tsx` — sparkline, Fast Insulin, Simulate button with tooltip
- `src/components/planning/ShipCard.tsx` — draggable ship cards with sugary badge (🧊), CSS data-tooltip
- `src/components/planning/ShipInventory.tsx` — inventory fed by match-3 drops + level interventions
- `src/components/planning/SlotGrid.tsx` — slot grid with blocked slots, exercise effect zones
- `src/components/planning/Slot.tsx` — individual slot with ⚡ exercise effect indicator
- `src/components/planning/BgSparkline.tsx` — BG prediction sparkline in header

#### Core Systems
- `src/version.ts` — version number (v0.28.8)
- `src/store/gameStore.ts` — global state (match3Inventory, moveBudget, phase transitions, degradation)
- `src/core/types.ts` — shared types (Ship, PlacedShip, PlanValidation, SegmentValidation, DEFAULT_MOVE_BUDGET=15)
- `src/core/simulation/SimulationEngine.ts` — simulation engine with pancreas tier logic
- `src/core/utils/levelUtils.ts` — day config resolution
- `src/core/results/calculateResults.ts` — excessBG calculation, degradation pipeline, assessment
- `src/config/loader.ts` — loads and transforms JSON configs (foods, interventions, tags)
- `src/config/organRules.json` — organ behavior rules (pancreas tiers, liver thresholds, muscle rates)
- `src/config/degradationConfig.json` — degradation system configuration

#### Simulation & Results UI
- `src/components/simulation/SimulationPhase.tsx` — simulation orchestrator
- `src/components/simulation/PipeSystem.tsx` — SVG pipe overlay with chevron flow indicators
- `src/components/simulation/BodyDiagram.tsx` — absolute-positioned organs layout
- `src/components/simulation/OrganSprite.tsx` — organ icon with tier circles
- `src/components/simulation/BoostButton.tsx` — boost buttons with charge badge
- `src/components/results/ResultsPhase.tsx` — results orchestrator (assessment, victory, defeat)
- `src/components/results/BGGraph.tsx` — SVG BG history graph with zone coloring
- `src/components/results/ExcessBGIndicator.tsx` — excess BG circles/crosses
- `src/components/results/OrganDegradationDisplay.tsx` — liver/pancreas degradation display

#### Shared UI
- `src/components/ui/Tooltip.tsx` — universal tooltip component (hover, position, delay)
- `src/components/ui/EyeToggle.tsx` — toggle for detailed indicators visibility

#### Data Configs
- `public/data/foods.json` — food items with glucose, carbs, WP cost, tags (sugary)
- `public/data/interventions.json` — intervention cards (exercise, metformin)
- `public/data/levels/level-01.json` — 3-day level config with match3Config, moveBudget, segmentCarbs

### Current State (v0.28.8) — Match-3 Planning Phase

- **Match-3 Engine (v0.28.0)** ✅
  - Full match-3 engine: board generation, match detection, cascade resolution
  - 5 tile shapes: square (red ■), triangle (yellow ▲), circle (blue ●), diamond (green ◆), hexagon (unused)
  - FoodTile type: food cards embedded in the board, collected when they fall to the bottom row
  - Cascade system: match → remove → gravity → food collection → refill → repeat (max 10 depth)
  - Swap validation: adjacent only, at least one SimpleTile, must produce a match
  - Board refill: random tiles with configurable foodSpawnChance (max 20% food cap)

- **Match-3 UI (v0.28.0-v0.28.1)** ✅
  - 7x5 board with drag-threshold swap (15px to trigger)
  - 4 tile types per day (configurable via tileTypes)
  - Food tiles show ship emoji with border (white for food, purple for interventions)
  - Move counter with ⏳ icon, turns red when ≤3 moves remaining
  - Animations: match explosion (300ms), gravity fall (250ms), food drop (300ms), spawn (200ms)
  - Board states: animating (disabled input), out of moves (dimmed), deadlock (yellow border)

- **Match-3 → Inventory Integration (v0.28.0)** ✅
  - Food tiles reaching bottom row are harvested into match3Inventory
  - ShipInventory displays dropped food cards for drag-and-drop into slots
  - Interventions bypass match-3, come directly from level config
  - Empty state: "Match tiles to drop food cards!"

- **Drag-and-Drop Swap (v0.28.1)** ✅
  - Simple↔Simple and Simple↔Food tile swaps
  - 4 tile types active per level day

- **Compact Slots & Sparkline (v0.28.2-v0.28.3)** ✅
  - Sparkline panel in header (wide layout)
  - Flexible compact slot grid
  - Moves icon on match-3 board
  - 15 moves budget per day

- **Defeat Threshold (v0.28.4)** ✅
  - Defeat at 3 degradation circles (was 5)
  - Assessment: Excellent (0), Decent (1), Poor (2), Defeat (3)

- **Simulate Button & Validation (v0.28.5)** ✅
  - Simulate button blocked when segment carbs exceed max (was: warning only)
  - Tooltip on disabled Simulate button showing first validation error
  - Text: `Fulfill segment carb requirements: <error>`

- **Hint Text Updates (v0.28.5-v0.28.8)** ✅
  - Slot hint above segments: "Drag food into slots to meet carb goals!"
  - Match-3 board label: "Match tiles to drop food cards, then drag them into time slots!"
  - Empty inventory: "Match tiles to drop food cards!"

### Match-3 System Details

#### Tile Types
| Shape    | Color   | Symbol | Used |
|----------|---------|--------|------|
| square   | #fc8181 | ■      | Yes  |
| triangle | #ecc94b | ▲      | Yes  |
| circle   | #63b3ed | ●      | Yes  |
| diamond  | #48bb78 | ◆      | Yes  |
| hexagon  | —       | —      | No (available but not configured) |

#### Food Tile Flow
1. Board generated with `initialFoodTiles` at specific positions (typically top rows)
2. Player swaps adjacent tiles to make 3+ matches of same shape
3. Matched tiles removed → gravity pulls tiles down → food tiles fall toward bottom
4. Food tiles reaching bottom row are **harvested** → appear in inventory as draggable cards
5. Board refilled from top, new food tiles spawn with `foodSpawnChance` probability
6. Player drags food cards from inventory into time slots on the SlotGrid

#### Level Config (Match-3)
```json
{
  "moveBudget": 15,
  "match3Config": {
    "columns": 7,
    "rows": 5,
    "tileTypes": 4,
    "foodSpawnChance": 0.1,
    "initialFoodTiles": [
      { "shipId": "banana", "col": 1, "row": 0 },
      { "shipId": "apple", "col": 3, "row": 0 }
    ]
  }
}
```

#### Move Budget System
- Each swap costs 1 move (cascades are free)
- `movesRemaining = moveBudget - attemptedSwaps`
- Board disabled when moves exhausted
- Deadlock detection: yellow border when no valid swaps available

#### Validation & Simulate Button
- Per-segment carb validation: min and max limits
- `current < min` → error (blocks Simulate)
- `current > max` → error (blocks Simulate)
- Tooltip on disabled button shows first error message

### Simulation System
- **SVG Pipe System** — animated glucose flow with chevron indicators
- **Body Diagram** — absolute-positioned organs at corners, center BG pill-shape
- **Organs**: Liver (slowdown), Muscles (drain), Pancreas (tier control), Kidneys (disabled)
- **Fast Insulin** — +1 muscle tier boost, ignores degradation limits
- **Substep simulation** — 10 substeps/hour for smooth updates
- **Pancreas Tiers**: BG thresholds → tiers 0-4 → muscle drain rates [0, 25, 50, 65, 100, 130, 155]
- **Ship Queue** — slot-based timing, ships unload at their scheduled slot
- **Sugary modifier** — foods with `tags: ["sugary"]` unload in half the time (2x speed)

### Results System
- **Assessment**: Excellent (0 circles), Decent (1), Poor (2), Defeat (3)
- **BG Graph**: SVG with green/orange/red zone coloring
- **ExcessBG Indicator**: 3 markers (green circles / pink crosses), defeat at 3
- **Organ Degradation**: Liver + Pancreas with circle markers
- **Victory**: "Level Passed!" popup → "Next Challenge" (0-3) / "Max Challenge" (4)
- **Defeat**: "Too much damage!" message with Restart Level button
- **Difficulty Progression**: 5 levels (0-4), each adds +25 degradation points to both organs

### Exercise Interventions
- **Light Exercise**: size S, exerciseEffect, +2 tiers temporary (~3h), decayRate 20
  - ⚡ indicators: 3 slots, capped at segment boundary
- **Intense Exercise**: size S, intenseExerciseEffect, +1 tier permanent
  - `requiresEmptySlotBefore`: slot N-1 must be empty
- **Exercise (M size)**: size M, exerciseEffect, strong boost
- Group limit: max 1 exercise per segment

### Store State (Match-3 additions)
```typescript
// Match-3 state in gameStore
moveBudget: number              // Total moves for day (from level config)
movesUsed: number               // Tracks used moves
match3Inventory: Ship[]         // Food tiles dropped from board

// Actions
setMoveBudget: (budget: number) => void
useMove: () => void
addToMatch3Inventory: (ship: Ship) => void
clearMatch3Inventory: () => void  // Reset on day change/retry
```

### Constants
| Constant | Value | Location |
|----------|-------|----------|
| DEFAULT_MOVE_BUDGET | 15 | `src/core/types.ts` |
| DRAG_THRESHOLD | 15px | `Match3Board.tsx` |
| MAX_CASCADE_DEPTH | 10 | `engine.ts` |
| MATCH_DURATION | 300ms | `useMatch3.ts` |
| GRAVITY_DURATION | 250ms | `useMatch3.ts` |
| REFILL_DURATION | 200ms | `useMatch3.ts` |
| FOOD_DROP_DURATION | 300ms | `useMatch3.ts` |
| CASCADE_PAUSE | 100ms | `useMatch3.ts` |
| Food tile cap | 20% of board | `boardRefiller.ts` |

### Disabled Features
- **Kidneys**: kidneyRate=0, visuals preserved but always inactive
- **Liver Boost**: Button hidden in SimulationPhase
- **Metformin**: Card exists but effect system not implemented
- **Fiber System**: Code preserved (FiberIndicator.tsx), not rendered
- **Glucose Particle System**: Superseded by SVG Pipe System
- **WP System**: Replaced by match-3 move budget in this branch

### Known Issues
- Metformin: Card exists but full effect system not implemented
- GlucoseParticleSystem files still in codebase (unused)
- Fiber system: Code preserved (FiberIndicator.tsx), not rendered
- Hexagon tile shape defined but not used in any level config
