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
- `src/core/rules/types.ts` — rule system types (includes `ignoresDegradation`, `minBaseTier` modifier)
- `src/core/results/calculateResults.ts` — results phase: excessBG calculation, degradation pipeline
- `src/config/loader.ts` — loads and transforms JSON configs (foods, interventions with wpCost)
- `src/config/organRules.json` — organ behavior rules (pancreas tiers, liver thresholds, muscle rates)
- `src/config/degradationConfig.json` — degradation system configuration
- `src/components/simulation/` — simulation UI components
  - `GlucoseParticleSystem.tsx` — sugar cube particles with fiber support
  - `FiberIndicator.tsx` — fiber activity indicator
  - `BodyDiagram.tsx` — organs layout with tier visualization (eye toggle support)
  - `OrganTierCircles.tsx` — unified tier/degradation indicator (v0.15.0)
  - `OrganSprite.tsx` — organ icon with tier circles
  - `BoostButton.tsx` — boost buttons (Liver Boost, Fast Insulin)
- `src/components/planning/` — planning phase UI
  - `PlanningHeader.tsx` — header with BG, WP, BG prediction sparkline, Simulate
  - `BgSparkline.tsx` — compact SVG sparkline for BG prediction in planning header
  - `ShipCard.tsx` — draggable ship cards with WP cost/fiber badges
  - `ShipInventory.tsx` — unified inventory (food + interventions, no tabs)
  - `SlotGrid.tsx` — slot grid with segment carb indicators, blocked slots, exercise group limits
- `src/hooks/` — custom React hooks
  - `useBgPrediction.ts` — debounced BG prediction using SimulationEngine
- `src/components/ui/` — shared UI components
  - `EyeToggle.tsx` — toggle for detailed indicators visibility
- `public/data/` — JSON configs for ships and levels
  - `foods.json` — food items with glucose, carbs, wpCost, fiber
  - `interventions.json` — intervention cards with wpCost, group, requiresEmptySlotBefore
  - `levels/*.json` — level configurations (per-day segmentCarbs, wpBudget, blockedSlots)
- `docs/organ-parameters.csv` — organ parameters documentation

### Current State (v0.19.0)
- Planning phase: drag-and-drop ships to time slots ✅
- **BG Prediction Graph (v0.19.0)** ✅
  - SVG sparkline in planning header, shows predicted BG curve
  - Reuses SimulationEngine synchronously (debounce 300ms)
  - Zone backgrounds: green (70-150), yellow (150-200), red (200-300)
  - Threshold lines at BG 200 and 300, segment dividers at hours 6 and 12
  - Updates on every plan change (card placed/removed)
- **Layout Swap (v0.19.0)** ✅
  - Desktop: Inventory LEFT, SlotGrid RIGHT (swapped)
  - Mobile: SlotGrid on top via CSS order
- Simulation phase: glucose flow visualization with particles ✅
- Results phase: basic BG history graph ✅
- Substep simulation: smooth container updates (10 substeps/hour) ✅
- **Simulation Rebalancing (v0.18.0-v0.18.1)** ✅
  - **Gradual pancreas response** — softer insulin tiers for realistic BG dynamics
    - BG ≤80: Tier 0 (no insulin)
    - BG 80-150: Tier 1 (basal, 50/h drain)
    - BG ≥150: Tier 2 (elevated, 100/h drain)
    - BG ≥200: Tier 3 (moderate, 125/h drain)
    - BG ≥300: Tier 4 (strong, 150/h drain)
  - **Raised liver stop threshold** — liver stops release at BG ≥300 (was 200)
    - BG ≥250: reduced release rate 75 mg/dL/h
    - BG ≥300: full stop (tier 0)
  - **Increased degradation rates** — excessBG coefficients ×3
    - Zone 200-300: coefficient 1.5 (was 0.5)
    - Zone 300+: coefficient 3.0 (was 1.0)
  - **Exercise hypoglycemia fix** — exercise modifiers require `minBaseTier: 1`
    - Exercise only adds +1 tier when muscles already activated by pancreas
    - Prevents BG dropping below 70 due to exercise at low BG
- **Exercise Interventions (v0.17.0)** ✅
  - **light_exercise**: size S, wpCost 2, exerciseEffect, group "exercise"
  - **intense_exercise**: size S, wpCost 4, intenseExerciseEffect, permanent +1 tier muscles
    - `requiresEmptySlotBefore`: slot N-1 must not contain food
    - Slot 1 forbidden (no previous slot)
    - Red highlight on invalid slot + blocking food slot during drag
  - Group limit: max 1 exercise card per segment
  - Inventory limits: per-day count via `availableInterventions: [{id, count}]`
- **Blocked Slots (v0.17.1)** ✅
  - `blockedSlots: number[]` in DayConfig — slots where cards cannot be placed
  - Visual styling: gray background, lock icon, disabled state
  - Metformin card: wpCost 0
- **Per-Day Interventions (v0.17.2)** ✅
  - `availableInterventions` moved from LevelConfig to DayConfig
  - Each day specifies its own intervention inventory `[{id, count}]`
- **Unified Inventory (v0.17.5)** ✅
  - Food and interventions in single list (no tabs)
  - Intervention cards hide load/volume display
- **Pre-placed Cards (v0.16.3)** ✅
  - `preOccupiedSlots` in DayConfig — cards placed at level start
  - WP deducted automatically, cards cannot be removed
- **Willpower Points System (v0.16.0)** ✅
  - WP budget per day (default: 16, configurable per level/day)
  - Each card has a WP cost (0-9), including interventions
  - Free cards (WP=0): Ice Cream, Chocolate Muffin (temptation mechanic)
  - Cookie: WP=2 (changed from 0 in v0.17.3)
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
- **Eye Toggle (v0.16.0)** ✅
  - Toggle button (bottom-right corner, eye icon)
  - Default: off (semi-transparent closed eye)
  - Controls visibility of:
    - Ship card hours (1h, 2h, 3h) — hidden by default
    - Simulation numeric organ indicators — hidden by default
  - Always visible: BG numeric value, tier circles
- **Liver System (v0.18.1)** ✅
  - Normal release rate: 150 mg/dL/h
  - Reduced release at BG ≥250: 75 mg/dL/h
  - Stops release when BG ≥300
  - PassThrough mode: when liver ≥95% AND ship unloading → output = input rate
  - Liver Boost: DISABLED (code preserved)
- **Pancreas Tier System (v0.18.0)** ✅
  - Gradual insulin response (softened from v0.15.0)
  - BG thresholds → pancreas tiers: 0/1/2/3/4 (was 0/1/4/5)
  - Pancreas tier determines base muscle tier
  - Degradation limits max pancreas tier (not directly muscle tier)
- **Muscle Drain Rates (v0.18.3)** ✅
  - Tier 0: 0, Tier 1: 25, Tier 2: 50, Tier 3: 85
  - Tier 4: 120, Tier 5: 150, Tier 6: 175 mg/dL/h
- **Fast Insulin Boost (v0.15.0)** ✅
  - Orange drop icon, +1 tier bonus when active
  - **Ignores degradation limits**
  - Enables hidden 6th muscle tier (rate: 175 mg/dL/h)
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
- Metformin: Card exists but full effect system not implemented
