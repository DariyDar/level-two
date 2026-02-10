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

This repository contains **two independent projects** on separate branches:

| Branch | Project | Version | Description |
|--------|---------|---------|-------------|
| `main` | Port Planner | v0.24.11 | Metabolic simulation (WP system, drag-and-drop meal planning, SVG pipes) |
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

## Project: Port Planner (branch: `main`)

**Port Planner** — a metabolic simulation game teaching blood glucose management through a port/ship metaphor. Players drag-and-drop food cards into time slots to plan meals, then watch a glucose simulation with SVG pipe visualizations, and review results with organ degradation tracking.

### Tech Stack
- React 19 + TypeScript + Vite
- @dnd-kit for drag-and-drop
- Zustand for state management

### Game Flow

```
Planning → Simulation → Results → (next day) → Planning → ...
                                  (defeat)   → Restart Level
                                  (last day) → Victory → Restart
```

### Key Files
- `src/version.ts` — version number (v0.24.11)
- `src/store/gameStore.ts` — global game state (WP system, phase transitions, degradation)
- `src/core/simulation/SimulationEngine.ts` — simulation engine with pancreas tier logic
- `src/core/types.ts` — TypeScript type definitions (Ship, BlockedSlotConfig, PlanValidation, etc.)
- `src/core/utils/levelUtils.ts` — day config resolution (pancreasBoostCharges, blockedSlots)
- `src/core/rules/types.ts` — rule system types (ignoresDegradation, minBaseTier modifier)
- `src/core/results/calculateResults.ts` — results: excessBG calculation, degradation pipeline, assessment
- `src/config/loader.ts` — loads and transforms JSON configs (foods, interventions)
- `src/config/organRules.json` — organ behavior rules (pancreas tiers, liver thresholds, muscle rates)
- `src/config/degradationConfig.json` — degradation system configuration
- `src/components/simulation/` — simulation UI
  - `PipeSystem.tsx` — SVG pipe overlay with chevron flow indicators
  - `PipeSystem.css` — pipe styles (wall/fill/chevron, non-scaling-stroke)
  - `BodyDiagram.tsx` — absolute-positioned organs layout (corner organs, center BG)
  - `OrganTierCircles.tsx` — unified tier/degradation indicator
  - `OrganSprite.tsx` — organ icon with tier circles, substrate pulse animation
  - `BoostButton.tsx` — boost buttons with numeric charge badge
  - `SimulationPhase.tsx` — simulation orchestrator with hint text
- `src/components/planning/` — planning phase UI
  - `PlanningHeader.tsx` — header with BG, ☀️ WP indicator, Fast Insulin, Simulate button, tooltips
  - `ShipCard.tsx` — draggable ship cards with WP badge (☀️), CSS data-tooltip
  - `ShipInventory.tsx` — unified inventory (foods + interventions)
  - `SlotGrid.tsx` — slot grid with blocked slots, exercise effect zones
  - `Slot.tsx` — individual slot with ⚡ exercise effect indicator
  - `PlanningPhase.tsx` — planning orchestrator with hint text above day title
- `src/components/results/` — results phase UI
  - `ResultsPhase.tsx` — results orchestrator (assessment, victory popup, defeat/restart)
  - `BGGraph.tsx` — SVG BG history graph with zone coloring
  - `ExcessBGIndicator.tsx` — excess BG circles/crosses with subtitle
  - `OrganDegradationDisplay.tsx` — liver/pancreas degradation with icons and markers
- `src/components/ui/` — shared UI components
  - `EyeToggle.tsx` — toggle for detailed indicators visibility
  - `Tooltip.tsx` — universal tooltip component (hover, position, delay)
- `public/data/` — JSON configs
  - `foods.json` — food items with glucose, carbs, WP cost
  - `interventions.json` — intervention cards (exercise, metformin)
  - `levels/level-01.json` — 3-day level config with per-day WP budgets, blocked slots
- `docs/organ-parameters.csv` — organ parameters documentation

### Current State (v0.24.11) — WP System, Tooltips, Victory

- **Victory Popup (v0.24.10-v0.24.11)** ✅
  - "Level Passed!" popup after completing all 3 days without defeat
  - "Restart Level" button on defeat, "Restart" on victory
  - Animated overlay with scaleIn/fadeIn animations

- **Tooltips & Hints (v0.24.4-v0.24.8)** ✅
  - CSS `data-tooltip` + `::after` on food/intervention cards (133ms delay)
  - Food tooltips: "Fast · Cost 3☀️ to place" / "Free to place"
  - Intervention tooltips: show description text
  - Tooltip wrappers for BG, WP, Fast Insulin indicators in header
  - Tooltips for carb range + current in segment headers
  - Simulation: tooltips on organs and Fast Insulin button
  - Results: tooltips on organ degradation and excess BG markers
  - Planning hint: "Drag & drop food cards into time slots to plan your meals..."
  - Simulation hint: "Watch the glucose flow — use Fast Insulin if blood sugar spikes"

- **WP Badge Enhancement (v0.24.4-v0.24.6)** ✅
  - ☀️ emoji (24px) as WP icon in header
  - WP badge on cards: font-size 13px with ☀️
  - BG and WP indicators aligned horizontally

- **Exercise Effect Zones (v0.24.7)** ✅
  - ⚡ indicators on slots affected by exercise duration
  - Orange for light exercise (temporary, ~1h), green for intense (permanent, rest of day)
  - Computed from ship targetContainer and decay rates

- **WP System** ✅
  - Willpower budget per day (configurable in level JSON)
  - wpCost on food cards (shown as ☀️ badge)
  - WP indicator in header: remaining/total
  - Day 1: 12 WP budget

- **Level Structure** ✅
  - 3-day level with per-day configurations
  - Per-day: WP budget, carb requirements, blocked slots, pre-occupied slots
  - Blocked slots with narrative text
  - Pre-occupied slots (cannot be removed)
  - Win condition: maxDegradationCircles (default 3)

### Simulation System
- **SVG Pipe System** — animated glucose flow with chevron indicators
- **Body Diagram** — absolute-positioned organs at corners, center BG pill-shape
- **Organs**: Liver (slowdown), Muscles (drain), Pancreas (tier control), Kidneys (disabled)
- **Fast Insulin** — +1 muscle tier boost, ignores degradation limits
- **Substep simulation** — 10 substeps/hour for smooth updates
- **Pancreas Tiers**: BG thresholds → tiers 0-4 → muscle drain rates

### Results System
- **Assessment**: Excellent (0 circles), Decent (1), Poor (2-3), Defeat (4-5+)
- **BG Graph**: SVG with green/orange/red zone coloring
- **ExcessBG Indicator**: 5 markers (green circles / pink crosses)
- **Organ Degradation**: Liver + Pancreas with circle markers
- **Victory**: "Level Passed!" popup on completing all days
- **Defeat**: "Too much damage!" message with Restart Level button

### Exercise Interventions
- **Light Exercise**: size S, exerciseEffect, +1 tier temporary (~1h)
- **Intense Exercise**: size S, intenseExerciseEffect, +1 tier permanent
  - `requiresEmptySlotBefore`: slot N-1 must be empty
- **Exercise (M size)**: size M, exerciseEffect, strong boost
- Group limit: max 1 exercise per segment

### Disabled Features
- **Kidneys**: kidneyRate=0, visuals preserved but always inactive
- **Liver Boost**: Button hidden in SimulationPhase
- **Metformin**: Card exists but effect system not implemented
- **Fiber System**: Code preserved (FiberIndicator.tsx), not rendered
- **Glucose Particle System**: Superseded by SVG Pipe System

### Known Issues
- Effect Containers: No threshold-based activation
- Metformin: Card exists but full effect system not implemented
- GlucoseParticleSystem files still in codebase (unused)

---

## Project: Glucose TD (branch: `tower-defense`)

**Glucose TD** — tower defense reimagining of the metabolic simulation. Food generates glucose projectiles that fall through organ defense zones. See full documentation in `docs/td-concept/README.md` on the tower-defense branch.

Current version: v0.4.1 — survival mode, circle indicators, explosion VFX.
