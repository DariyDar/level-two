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

This is "Port Planner" — a metabolic simulation game teaching blood glucose management through a port/ship metaphor.

### Tech Stack
- React 19 + TypeScript + Vite
- @dnd-kit for drag-and-drop
- Zustand for state management

### Key Files
- `src/version.ts` — version number
- `src/store/gameStore.ts` — global game state (Mood system, eye toggle)
- `src/core/simulation/SimulationEngine.ts` — simulation engine with pancreas tier logic + mood tracking
- `src/core/types.ts` — TypeScript type definitions (Ship, BlockedSlotConfig, PlanValidation, Mood constants, etc.)
- `src/core/utils/levelUtils.ts` — day config resolution (pancreasBoostCharges, blockedSlots)
- `src/core/rules/types.ts` — rule system types (includes `ignoresDegradation`, `minBaseTier` modifier)
- `src/core/results/calculateResults.ts` — results phase: excessBG calculation, degradation pipeline, assessment (Excellent/Decent/Poor/Defeat)
- `src/config/loader.ts` — loads and transforms JSON configs (foods, interventions with mood)
- `src/config/organRules.json` — organ behavior rules (pancreas tiers, liver thresholds, muscle rates)
- `src/config/degradationConfig.json` — degradation system configuration
- `src/components/simulation/` — simulation UI components
  - `PipeSystem.tsx` — SVG pipe overlay with chevron flow indicators (v0.21.0+)
  - `PipeSystem.css` — pipe styles (wall/fill/chevron, non-scaling-stroke)
  - `GlucoseParticleSystem.tsx` — sugar cube particles (SUPERSEDED by PipeSystem in v0.21.0, code preserved)
  - `FiberIndicator.tsx` — fiber activity indicator (disabled)
  - `BodyDiagram.tsx` — absolute-positioned organs layout (corner organs, center BG)
  - `OrganTierCircles.tsx` — unified tier/degradation indicator (degradation from right)
  - `OrganSprite.tsx` — organ icon with tier circles, substrate pulse animation
  - `BoostButton.tsx` — boost buttons with numeric charge badge (top-right)
- `src/components/planning/` — planning phase UI
  - `PlanningHeader.tsx` — header with BG, Mood scale, Fast Insulin indicator, Simulate button
  - `ShipCard.tsx` — draggable ship cards with mood badge and mood-tinted backgrounds
  - `ShipInventory.tsx` — unified inventory (all foods globally available, mood-blocked filtering, interventions per-day)
  - `SlotGrid.tsx` — slot grid with blocked slots (narrative), exercise group limits
- `src/components/results/` — results phase UI
  - `ResultsPhase.tsx` — results orchestrator (assessment, pass/fail logic, day counter)
  - `BGGraph.tsx` — SVG BG history graph with zone coloring (buildColoredSegments)
  - `BGGraph.css` — graph styles (zones, lines, points, labels)
  - `ExcessBGIndicator.tsx` — excess BG circles/crosses with subtitle
  - `ExcessBGIndicator.css` — marker styles (green circles, pink crosses, dashed circles)
  - `OrganDegradationDisplay.tsx` — liver/pancreas degradation with icons and markers
  - `OrganDegradationDisplay.css` — organ icon and marker styles
- `src/hooks/` — custom React hooks
- `src/components/ui/` — shared UI components
  - `EyeToggle.tsx` — toggle for detailed indicators visibility
  - `MoodScale.tsx` — horizontal mood scale (-10..+10) with color zones, marker, floating delta VFX
  - `PreGameModal.tsx` — pre-game modal (Day 1 intro, Day 2+ shows remaining days + mood)
  - `PhaseBanner.tsx` — contextual phase banner with hints
  - `Tooltip.tsx` — universal tooltip component (hover, position, delay)
- `public/data/` — JSON configs for ships and levels
  - `foods.json` — 30 food items with glucose, carbs, mood (-5..+5)
  - `interventions.json` — intervention cards with mood, group, requiresEmptySlotBefore
  - `levels/*.json` — level configurations (per-day blockedSlots with narratives, preOccupiedSlots with narratives)
- `docs/organ-parameters.csv` — organ parameters documentation

### Current State (v0.25.1) — Balance, Hunger, VFX, Content
- **Balance: Mood scale narrowed (v0.25.1)** ✅
  - Mood range: -10..+10 (was -50..+50), food mood applied 1:1 (removed ×2 multiplier)
  - Fast Insulin penalty: -2 (was -5)
  - Food blocking thresholds: mood > -2 → all food; -2..-4 → block super-healthy; -5..-7 → block medium-healthy; ≤ -8 → only junk
- **Per-hour hunger (v0.25.1)** ✅ — replaces end-of-day penalty
  - -1 mood per hour without food unloading
  - "Starving!" red blink indicator during simulation
- **Mood VFX (v0.25.1)** ✅
  - Floating +N/-N delta on MoodScale when mood changes
  - MoodScale green/red flash on change
  - Fast Insulin cyan glow (#00BFFF) while active
- **All text in English (v0.25.1)** ✅
  - PhaseBanner, PreGameModal, ResultsPhase, BoostButton, level narratives
- **30 foods (v0.25.1)** ✅ — 10 junk / 10 neutral / 10 healthy
- **5-day level (v0.25.1)** ✅ — Days 4-5 added with narratives, maxDegradationCircles=8
- **Restart Level button (v0.25.1)** ✅ — on defeat, resets mood + degradation to 0
- **Glucose color: red everywhere (v0.25.1)** ✅ — #E85D4A in pipes, containers, progress bars
- **Mood System (v0.25.0)** ✅ — Replaces WP system
  - Mood scale: -10..+10, carries between days, resets to day start on retry
  - SimulationEngine tracks mood: ship.mood × 2 multiplier, Fast Insulin -5 per use, hunger penalty (<3 foods)
  - MoodScale component: horizontal bar with colored zones (red/orange/yellow/green)
  - Cross-day strategy: healthy food lowers mood → next day healthy food blocked → forced variety
- **PreGame Phase (v0.25.0)** ✅
  - Modal window before each day: Day 1 full intro, Day 2+ shows remaining days + current mood
  - Phase flow: PreGame → Planning → Simulation → Results → PreGame (next day)
- **Phase Banners (v0.25.0)** ✅
  - Contextual hint banners for Planning, Simulation, and Results phases
- **Narrative Slots (v0.25.0)** ✅
  - Blocked slots and pre-occupied slots show narrative text ("Дорога на работу", "Угощение от коллеги")
  - BlockedSlotConfig: `{slot, narrative?}` instead of plain numbers
- **22 Foods with Mood Values (v0.25.0)** ✅
  - Junk food (mood +2..+5): burger, pizza, icecream, chocolatemuffin, cookie, chips, cola, chocolatebar
  - Neutral (mood -1..+1): rice, pasta, banana, milk, bread, apple, yogurt
  - Healthy (mood -5..-2): oatmeal, chicken, broccoli, salad, fish, vegetablestew, cottagecheese
  - All foods globally available (no per-day limits), infinite placement count
- **Mood-Tinted Ship Cards (v0.25.0)** ✅
  - Pink for junk food (mood > 0), green for healthy (mood < 0), yellow for neutral
  - Mood badge (+N/-N) on each card
- **Simulation: Default Speed 0.25x (v0.25.0)** ✅
  - Simulation starts at 0.25x speed for better observation
  - Glucose pipe color changed to red (#E85D4A)
  - Fast Insulin + MoodScale in simulation header
- **Results: Mood Summary (v0.25.0)** ✅
  - Mood explanation for next day impact
  - "Идеальная победа возможна!" hint
- **Kidneys Disabled (v0.23.1)** ✅
  - kidneyRate=0, bgToKidneysRate=0, kidneyFlowDir=undefined
  - All visual assets preserved (pipe, container, icon, tier circles) — just always inactive
- Planning phase: drag-and-drop ships to time slots ✅
- **SVG Pipe System (v0.21.0-v0.21.23)** ✅
  - SVG overlay with pipes connecting organs (Ship→Liver, Liver→BG, BG→Muscles, BG→Kidneys, Pancreas→Muscles)
  - Pipe wall (#4a5568) + inner fill (blue for glucose, orange for insulin)
  - `vector-effect: non-scaling-stroke` for uniform pixel-width pipes in stretched SVG
  - Chevron flow indicators (v0.21.17): V-shaped `>` polylines animated via CSS `offset-path`
  - 3 chevrons per active pipe, speed proportional to flow rate
  - Rounded pipe bends with quadratic Bézier curves (v0.21.23)
  - Flattened chevron angle: ±0.7 SVG units (v0.21.24)
  - Passthrough pipe: wider (wall 20px, fill 16px) vs normal (wall 12px, fill 8px)
  - Z-index layering: pipe-system(1) < containers(2) < organ backdrops(3) < BG(10)
  - Ship slot pipes: 3 routes from ship queue to liver, staggered horizontal routing
  - Suction VFX (v0.21.18): funnel particles at active ship pipe intake
  - Replaces GlucoseParticleSystem (sugar cube particles)
- **Container Fill Patterns (v0.21.25-v0.21.30)** ✅
  - CSS `::before` pseudo-element with SVG `background-image` tile overlay
  - 80×120px tile with 7 pseudo-random scattered elements, white stroke, opacity 0.2
  - Three states: flow-up (^ chevrons scrolling up), flow-down (v chevrons scrolling down), flow-static (horizontal dashes, no animation)
  - Flow direction computed from raw engine rates (no interpolation lag, v0.21.30)
  - BG: net rate = liverRate - muscleRate - kidneyRate (±1 threshold)
  - Liver: down when liverRate > 0; Kidneys: up when kidneyRate > 0
  - Animation: 120px/4s scroll via `background-position-y`
- **BG Indicator Redesign (v0.21.22)** ✅
  - Floating value badge on top of BG fill (replaces separate value display)
  - Color-coded: normal (dark), low (<70, yellow), high (200-300, orange), critical (300+, red blink)
  - Green target threshold removed from BG container (v0.21.24)
  - BG label font-size increased to 14px (v0.21.24)
- **Body Diagram Layout (v0.20.0)** ✅
  - Absolute positioning instead of 6×6 CSS Grid
  - 4 organs at corners: K (top-left), M (top-right), L (bottom-left), P (bottom-right)
  - BG container centered, full height, pill-shaped (semicircle ends)
  - KC/LC containers half-hidden behind organ substrates, peeking right
  - Organ substrates: 80×110px, default color #545F73, pulse animation when active
  - Tier circles position: 'top' for all organs
  - BG centered between left containers and right substrates (`left: calc(50% + 20px)`)
- **Tier Circle Colors (v0.20.9-v0.20.10)** ✅
  - Muscles/Pancreas: yellow (#E2BC28) default, red-orange (#FF5900) active
  - Liver/Kidneys: green (#22c55e) default
  - Degradation circles (pink) display from RIGHT side (matching results phase)
- **Fast Insulin Button (v0.20.11)** ✅
  - Numeric usage count badge (top-right corner of button substrate)
  - Replaced charge circles with single count number
  - Orange badge with remaining charges
- **Layout Swap (v0.19.0)** ✅
  - Desktop: Inventory LEFT, SlotGrid RIGHT (swapped)
  - Mobile: SlotGrid on top via CSS order
- Simulation phase: glucose flow visualization with SVG pipes ✅
- **Results Phase (v0.22.0-v0.22.9)** ✅
  - **Assessment System** (replaced star rating):
    - Based on total degradation circles: Excellent (0), Decent (1), Poor (2-3), Defeat (4-5)
    - Defeat = level failed (only Retry), Excellent = no Retry shown
    - Win condition: `maxDegradationCircles` in level config (default 5)
    - Star rating system removed (see BACKLOG.md)
  - **BG History Graph** with zone coloring:
    - Green zone (70-200), orange zone (200-300), red zone (300+)
    - Line and points colored by zone (green/orange/red)
    - Threshold lines at 200 (high) and 300 (critical), labels (#718096)
    - X-axis time labels: 06:00, 12:00, 18:00, 00:00
  - **ExcessBG Indicator** (v0.22.2-v0.22.9):
    - 5 markers: healthy = green circles, damaged = pink crosses (45deg) in dashed pink circle
    - Damaged markers fill from RIGHT side
    - Subtitle: "{N} degradation(s) till defeat" — 19px white, count in bold
    - Title "EXCESS BG" in graph label color (#718096)
  - **Organ Degradation Display** (v0.22.3-v0.22.9):
    - Liver + Pancreas with icons (56×56px in 110px container)
    - 4 markers each: healthy = green circles, degraded = pink crosses in dashed pink circle
    - Title "DEGRADATIONS" in graph label color (#718096)
  - **Layout**: title "Day X/Y Results" with total days from level config
  - **Header**: "Port Planner" (renamed from Port Management in v0.22.7)
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
  - **light_exercise**: size S, mood +3, exerciseEffect, group "exercise"
  - **intense_exercise**: size S, mood -3, intenseExerciseEffect, permanent +1 tier muscles
    - `requiresEmptySlotBefore`: slot N-1 must not contain food
    - Slot 1 forbidden (no previous slot)
    - Red highlight on invalid slot + blocking food slot during drag
  - Group limit: max 1 exercise card per segment
  - Inventory limits: per-day count via `availableInterventions: [{id, count}]`
- **Blocked Slots (v0.17.1, updated v0.25.0)** ✅
  - `blockedSlots: BlockedSlotConfig[]` in DayConfig — slots where cards cannot be placed
  - Each slot has optional narrative text shown in the UI
  - Visual styling: striped background, narrative text, disabled state
- **Per-Day Interventions (v0.17.2)** ✅
  - `availableInterventions` moved from LevelConfig to DayConfig
  - Each day specifies its own intervention inventory `[{id, count}]`
- **Unified Inventory (v0.17.5)** ✅
  - Food and interventions in single list (no tabs)
  - Intervention cards hide load/volume display
- **Pre-placed Cards (v0.16.3)** ✅
  - `preOccupiedSlots` in DayConfig — cards placed at level start with narrative text
  - Cards cannot be removed
- **Eye Toggle (v0.16.0)** ✅
  - Toggle button (bottom-right corner, eye icon)
  - Default: off (semi-transparent closed eye)
  - Controls visibility of:
    - Ship card hours (1h, 2h, 3h) — hidden by default
    - Simulation numeric organ indicators — hidden by default
  - Always visible: BG numeric value, tier circles
- **Liver System (v0.19.5)** ✅
  - BG ≤100: release 100/h (gluconeogenesis)
  - BG 101-150: 0/h (normal range, liver silent)
  - BG >150: release 50/h (elevated BG response)
  - BG ≥250: release 75/h (strong response)
  - BG ≥300: 0/h (critical stop)
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
  - Numeric charge count badge (top-right of button)
- Configuration-driven rules system ✅
- Carbs vs Glucose separation ✅ (strict: glucose = carbs × 10)
- Tier-based Degradation System (v0.14.0) ✅
  - Unified tiers 1-5, Liver: capacity reduction, Pancreas: max tier reduction
- Unified Tier Circles (v0.15.0) ✅
- Organ UI System ✅ (OrganSprite, substrates, tier circles)
- Layout: Absolute positioning with corner organs ✅ (was 6×6 CSS Grid before v0.20.0)
- Food Tags System ✅
  - Mood badge (top-right, +N green / -N red) for foods with mood != 0
- Sugar Cube Particle System (v0.8.0) — SUPERSEDED by SVG Pipe System in v0.21.0

### Removed Features (v0.25.0)
- **WP System**: Fully removed (types, store, components, CSS, food data)
  - Was: WP budget per day, wpCost on cards, WP indicator in header
  - Replaced by: Mood system for cross-day strategic constraint
- **Segment Carb Limits**: Removed (was min/optimal/max per segment)
  - Mood is now the sole strategic constraint
- **BG Prediction Sparkline**: Removed (BgSparkline.tsx, useBgPrediction.ts)
  - Was: SVG preview of BG curve in planning header
- **Per-Day Food Limits**: Removed (availableFoods per DayConfig)
  - All 22 foods globally available, filtered only by mood threshold

### Disabled Features (v0.19.6+)
Features preserved in code but hidden from UI:
- **Kidneys**: Disabled in v0.23.1 — kidneyRate=0, all visuals preserved but always inactive
- **Liver Boost**: Button hidden in SimulationPhase.tsx (functionality preserved)
- **Metformin**: Not implemented
- **Fiber System**: Disabled in v0.19.6 (backlog for future)
  - Was: fiber badge on cards, FiberIndicator component, particle slowdown (0.7x speed)
  - Code preserved: FiberIndicator.tsx/css, Ship.fiber type
  - Data removed: `fiber: true` removed from foods.json
- **Glucose Particle System**: Superseded by SVG Pipe System in v0.21.0
  - Code preserved: GlucoseParticleSystem.tsx/css (not rendered in SimulationPhase)

### Known Issues
- Effect Containers: No threshold-based activation (planned for future)
- Kidneys: Disabled (v0.23.1) — visuals present but all rates zeroed out
- Metformin: Card exists but full effect system not implemented
- GlucoseParticleSystem files still in codebase (unused since v0.21.0, can be cleaned up)
