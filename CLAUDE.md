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

## Project Context

This is "Port Management" — a metabolic simulation game teaching blood glucose management through a port/ship metaphor.

### Tech Stack
- React 19 + TypeScript + Vite
- @dnd-kit for drag-and-drop
- Zustand for state management

### Key Files
- `src/version.ts` — version number
- `src/store/gameStore.ts` — global game state (WP system, eye toggle)
- `src/core/simulation/SimulationEngine.ts` — simulation engine with pancreas tier logic
- `src/core/types.ts` — TypeScript type definitions (Ship, SegmentCarbLimits, PlanValidation, etc.)
- `src/core/utils/levelUtils.ts` — day config resolution (segmentCarbs, wpBudget)
- `src/core/rules/types.ts` — rule system types (includes `ignoresDegradation` modifier)
- `src/config/loader.ts` — loads and transforms JSON configs (foods with wpCost)
- `src/config/organRules.json` — organ behavior rules (pancreas tiers, muscle rates)
- `src/components/simulation/` — simulation UI components
  - `GlucoseParticleSystem.tsx` — sugar cube particles with fiber support
  - `FiberIndicator.tsx` — fiber activity indicator
  - `BodyDiagram.tsx` — organs layout with tier visualization (eye toggle support)
  - `OrganTierCircles.tsx` — unified tier/degradation indicator (v0.15.0)
  - `OrganSprite.tsx` — organ icon with tier circles
  - `BoostButton.tsx` — boost buttons (Liver Boost, Fast Insulin)
- `src/components/planning/` — planning phase UI
  - `PlanningHeader.tsx` — header with BG, WP, Carbs, Simulate
  - `ShipCard.tsx` — draggable ship cards with WP cost/fiber badges
  - `SlotGrid.tsx` — slot grid with segment carb indicators
- `src/components/ui/` — shared UI components
  - `EyeToggle.tsx` — toggle for detailed indicators visibility
- `public/data/` — JSON configs for ships and levels
  - `foods.json` — food items with glucose, carbs, wpCost, fiber
  - `levels/*.json` — level configurations (segmentCarbs, wpBudget)
- `docs/organ-parameters.csv` — organ parameters documentation

### Current State (v0.16.0)
- Planning phase: drag-and-drop ships to time slots ✅
- Simulation phase: glucose flow visualization with particles ✅
- Results phase: basic BG history graph ✅
- Substep simulation: smooth container updates (10 substeps/hour) ✅
- **Willpower Points System (v0.16.0)** ✅
  - WP budget per day (default: 16, configurable per level/day)
  - Each food card has a WP cost (0-9)
  - Free cards (WP=0): Ice Cream, Cookie, Chocolate Muffin (temptation mechanic)
  - Healthy foods cost more WP (Oatmeal: 4, Rice: 4, Chicken: 3)
  - WP spent on placement, refunded on removal
  - Cannot place card if insufficient WP
  - WP indicator in planning header: `WP: X/16`
  - WP cost badge on cards (yellow number, top-right)
- **Segment Carb Limits (v0.16.0)** ✅
  - Carb limits per segment (Morning/Day/Evening) instead of per day
  - Three parameters: min, optimal, max
  - Segment header shows: `MORNING  25 - 35g  [32g]`
  - Color-coded current indicator:
    - Green: close to optimal
    - Yellow: approaching min/max boundary
    - Red: outside min/max range
  - Default values: Morning 25-30-35, Day 30-35-40, Evening 20-25-30
- **Eye Toggle (v0.16.0)** ✅
  - Toggle button (bottom-right corner, eye icon)
  - Default: off (semi-transparent closed eye)
  - Controls visibility of:
    - Ship card hours (1h, 2h, 3h) — hidden by default
    - Simulation numeric organ indicators — hidden by default
  - Always visible: BG numeric value, tier circles
- **Food Parameters Update (v0.16.0)** ✅
  - Strict conversion: glucose = carbs × 10
  - Updated all food carbs and glucose values
  - Removed mood field from all foods
- **Liver System (v0.15.2)** ✅
  - Normal release rate: 150 mg/dL/h
  - Stops release when BG ≥ 200
  - PassThrough mode: when liver ≥95% AND ship unloading → output = input rate
  - Liver Boost: DISABLED (code preserved)
- **Pancreas Tier System (v0.15.0)** ✅
  - Pancreas has its own "insulin secretion" tier
  - BG thresholds trigger pancreas tiers:
    - BG ≤80: Tier 0 (no insulin)
    - BG 80-150: Tier 1 (basal insulin)
    - BG ≥150: Tier 4 (strong insulin)
    - BG ≥200: Tier 5 (maximum insulin)
  - Pancreas tier determines base muscle tier
  - Degradation limits max pancreas tier (not directly muscle tier)
- **Muscle Drain Rates (v0.15.1)** ✅
  - Tier 0: 0, Tier 1: 50, Tier 2: 100, Tier 3: 125
  - Tier 4: 150, Tier 5: 200, Tier 6: 250 mg/dL/h
- **Fast Insulin Boost (v0.15.0)** ✅
  - Orange drop icon, +1 tier bonus when active
  - **Ignores degradation limits**
  - Enables hidden 6th muscle tier (rate: 250 mg/dL/h)
- Configuration-driven rules system ✅
- Carbs vs Glucose separation ✅ (strict: glucose = carbs × 10)
- Tier-based Degradation System (v0.14.0) ✅
  - Unified tiers 1-5, Liver: capacity reduction, Pancreas: max tier reduction
- Unified Tier Circles (v0.15.0) ✅
- Organ UI System ✅ (OrganSprite, substrates, tier circles)
- Layout: 6×6 CSS Grid ✅
- Food Tags System ✅
  - WP cost badge (top-right, yellow number) for foods with wpCost > 0
  - Fiber badge (bottom-right, 🌿) for foods with fiber
- Sugar Cube Particle System (v0.8.0) ✅
- Fiber System (v0.12.0) ✅

### Removed Features (v0.16.0)
- **Mood System**: Fully removed (types, store, components, CSS, food data)
  - Was: MoodLevel 1-5, MoodIndicator, mood badges on cards
  - Replaced by: WP system for strategic resource management

### Disabled Features (v0.15.2)
Features preserved in code but hidden from UI:
- **Liver Boost**: Button hidden in SimulationPhase.tsx (functionality preserved)
- **Metformin**: Not implemented

### Known Issues
- Effect Containers: No threshold-based activation (planned for future)
- Kidneys: Not fully implemented (basic excretion only)
- Pipe connections: Visual connections between organs not yet implemented
