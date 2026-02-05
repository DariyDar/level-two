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
- `src/store/gameStore.ts` — global game state (includes mood system)
- `src/core/simulation.ts` — simulation engine
- `src/core/types.ts` — TypeScript type definitions (Ship, MoodLevel, MoodEffect, etc.)
- `src/config/loader.ts` — loads and transforms JSON configs
- `src/components/simulation/` — simulation UI components
  - `GlucoseParticleSystem.tsx` — sugar cube particles with fiber support
  - `FiberIndicator.tsx` — fiber activity indicator
  - `BodyDiagram.tsx` — organs layout
- `src/components/planning/` — planning phase UI
  - `PlanningHeader.tsx` — header with BG, Mood, Carbs, Simulate
  - `MoodIndicator.tsx` — 5-level mood display
  - `ShipCard.tsx` — draggable ship cards with mood/fiber badges
- `public/data/` — JSON configs for ships and levels
  - `foods.json` — food items with glucose, carbs, mood, fiber
  - `levels/*.json` — level configurations
  - `organRules.json` — organ behavior rules

### Current State (v0.9.2)
- Planning phase: drag-and-drop ships to time slots ✅
- Simulation phase: glucose flow visualization with particles ✅
- Results phase: basic BG history graph ✅
- Substep simulation: smooth container updates (10 substeps/hour) ✅
- Pancreas as separate organ ✅
  - Pancreas monitors BG and regulates muscle activation
  - Muscles receive tier assignment from pancreas
  - Proper organ separation (Pancreas → Muscles)
- Configuration-driven rules system ✅
  - Organ behavior defined in JSON config files (`organRules.json`)
  - Rule Engine evaluates conditions and actions
  - Modifiers for degradation, effects, boosts
- Carbs vs Glucose separation ✅
  - Ships display carbs (grams) on UI
  - Simulation uses glucose (mg/dL)
- Tier-based Degradation System ✅
  - Degradation Buffer: accumulates degradation points
  - Degradation Tiers: 6 tiers for liver (0-5), 5 tiers for pancreas (0-4)
  - Tier Effects:
    - Liver: capacity reduction (100→80→70→60→50→40)
    - Pancreas: max muscle tier reduction
  - Configuration-driven tier thresholds and effects (`degradationConfig.json`)
  - Real-time tier calculation and effect application
- Visual Indicators ✅
  - Degradation circles: green (healthy) to pink (degraded)
    - Liver: 5 circles, Pancreas: 4 circles
  - Muscle tier circles: orange circles above muscle icon (0-5 tiers)
  - Tier calculation: `getMuscleTierFromRate()` utility function
- Organ UI System ✅
  - OrganSprite: icon + label on substrate (rounded square background)
  - Two substrate states: active (light #4a5568) / inactive (dark #2d3748)
  - TierCircles component: orange filled/empty circles for muscle tiers
  - DegradationCircles component: green/pink circles for organ health
  - Labels moved inside substrates (below icons)
- Layout: 6×6 CSS Grid ✅
  - Top row: Muscles (B1-C2) | BG (B3-C4) | Kidneys (B5-C6)
  - Bottom row: Pancreas (E1-E2) | Liver (E3-F5)
  - External numeric indicators beside organs (not below)
  - Wider BG container (80px) with floating value indicator
  - Compact containers for Liver/Kidneys (60px wide, 90px tall)
- Food Tags System ✅
  - Mood tags: +1 (😊) for positive mood, -1 (😔) for negative mood
  - Fiber tags: 🌿 for foods with fiber content
  - Visual badges on ship cards (top-right for mood, bottom-right for fiber)
- Sugar Cube Particle System (v0.8.0) ✅
  - Visual representation: 🧊 instead of dots
  - Ratio: 15g glucose = 1 sugar cube
  - Partial cubes show remainder amount (<15g) as label
  - Fiber particles: green-tinted cubes with 30% slower speed (0.7x)
  - Performance: ~20x fewer particles than dot system
- Fiber System (v0.8.1 / v0.12.0) ✅
  - Fiber Indicator: Shows 🌿 "Glucose Income Slowed" when fiber is active
  - Pulsing animation (opacity 50%→100% over 2s)
  - Appears for entire segment if any food with fiber is present
  - Segment-wide effect: if any ship in segment has fiber, ALL ships in that segment move glucose slower (0.7x speed)
  - Only affects ship→liver flow, not other glucose flows
  - Positioned bottom-right of simulation view
- Mood System (v0.9.0) ✅
  - MoodLevel: 1-5 scale (1=worst, 5=best)
  - Starts at 3 (neutral), persists between days
  - Foods affect mood: +1 or -1 when placed in planning phase
  - MoodIndicator: 5 emoji faces (😟😐🙂😊😄) in planning header
  - Active mood level highlighted with scale and glow
  - Pre-simulation risk check for negative events
  - Probability table: Mood 1→100%, 2→75%, 3→50%, 4→25%, 5→0%
  - Max 1 negative event per day (console logging placeholder)
  - Mood state saved in localStorage alongside degradation
- Planning UI Layout (v0.9.1-v0.9.2) ✅
  - Header elements: BG | MoodIndicator | Carbs | Simulate button
  - Carbs indicator: max-width 500px with flex-grow enabled
  - Balanced spacing between all header elements

### Known Issues
- Effect Containers: No threshold-based activation (planned for future)
- Kidneys: Not fully implemented (basic excretion only)
- Metformin degradation blocking: Not implemented
- Pipe connections: Visual connections between organs not yet implemented
- Negative Events: Console logging only (actual event implementation pending)
