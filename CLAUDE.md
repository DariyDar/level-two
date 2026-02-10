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

## Project: Glucose TD (branch: `tower-defense`)

**Glucose TD** — a tower defense game teaching blood glucose management. Food generates glucose "projectiles" that fall from top to bottom. Body organs act as defensive towers: liver slows projectiles, muscles and kidneys destroy them. Glucose that reaches the base counts as "excess" and causes organ degradation.

### Tech Stack
- React 19 + TypeScript + Vite 7
- @dnd-kit for drag-and-drop (meal slot placement)
- Zustand for state management (with persist middleware)

### Game Flow

```
Planning → Simulation → Results → (Continue) → Planning → ...
                                  (Defeat)   → Restart
```

**Survival Mode** — endless progression, segments (meals) increase in difficulty.

### Key Files
- `src/version.ts` — version number (v0.4.1)
- `src/types.ts` — all TypeScript types and simulation constants
- `src/App.tsx` — app shell, phase routing
- `src/store/gameStore.ts` — Zustand store (game state, offer flow, degradation, actions)
- `src/config/loader.ts` — JSON data loading
- `src/core/simulation/TDSimulation.ts` — simulation engine (projectile tick loop, organ zones, targeting)
- `src/core/offerAlgorithm.ts` — offer generation with tier/tag constraints
- `src/hooks/useSimulationLoop.ts` — requestAnimationFrame loop
- `src/components/planning/` — planning phase UI
  - `PlanningPhase.tsx` — planning orchestrator with DnD context
  - `FoodCardComponent.tsx` — food card display (emoji, carbs, glucose, speed, tier badge)
  - `MealSlots.tsx` — 3 drag-and-drop meal slots
  - `MealSummary.tsx` — summary of placed cards
  - `OfferCards.tsx` — current offer (3 cards to choose from)
  - `Inventory.tsx` — saved cards from previous segments
  - `VersusBar.tsx` — attack vs defense comparison labels
  - `OrganTierCircles.tsx` — circle indicators for organ health
  - `OrganOverview.tsx` — organ overview with defense calculation (disabled)
- `src/components/simulation/` — simulation phase UI
  - `SimulationPhase.tsx` — simulation orchestrator (speed controls, pause)
  - `Battlefield.tsx` — SVG battlefield (colored organ zones, animated projectiles, targeting lines, impact VFX)
  - `OrganStatus.tsx` — 2×2 organ status grid with tier circles
- `src/components/results/` — results phase UI
  - `ResultsPhase.tsx` — assessment, stats, continue/restart actions
- `src/components/shared/` — shared components
  - `OrganDamageGrid.tsx` — organ damage visualization (emoji + circles)
- `public/data/foods.json` — 13 food cards (5 healthy + 5 neutral + 3 junk)
- `public/data/levels/level-01.json` — level config (degradation thresholds)
- `docs/td-concept/README.md` — comprehensive concept documentation

### Current State (v0.4.1)

- **Organ Circle Indicators (v0.4.1)** ✅
  - Circle indicators in results and planning phases
  - Green circles = healthy, pink circles = degraded

- **Simulation VFX (v0.4.0)** ✅
  - Circle indicators in simulation phase (OrganStatus)
  - Explosion VFX (💥) at base when projectiles impact
  - Versus bar repositioned

- **Survival Mode (v0.3.0)** ✅
  - Endless segment progression (Meal 1, 2, 3, ...)
  - Slot 0 pre-placed with random fast/junk food each segment
  - Random food card reward after each segment
  - Progressive difficulty: offer tiers increase with segment count
  - Defeat at 12 total degradation circles
  - Attack/Defense labels on versus bar
  - Green circle indicators for healthy organs

- **Circle Indicators (v0.2.1)** ✅
  - Replaced organ bars with circle indicators
  - Kidneys nerfed 25% (DPS: 8 → base)

- **Compact Defense Panel (v0.2.0)** ✅
  - 2×2 organ layout with bars
  - Combined versus bar (attack vs defense)

- **Organ Health & Comparison (v0.1.9)** ✅
  - Organ health percentages
  - Attack vs Defense numerical comparison

### Organ System

**Battlefield Layout:**
```
Position 0.0 ─── TOP (projectiles spawn)
  │
  ├── 0.15 ─ Liver zone start
  ├── 0.30 ─ Muscle zone start
  ├── 0.35 ─ Liver zone end
  │
  ├── 0.75 ─ Muscle zone end
  ├── 0.80 ─ Kidney zone start
  ├── 0.95 ─ Kidney zone end
  │
Position 1.0 ─── BASE (excess glucose → damage)
```

| Organ | Role | Zone | Key Stat |
|-------|------|------|----------|
| Liver | Slowdown tower | 0.15–0.35 | Slow factor 0.6, capacity 4 |
| Pancreas | Command center | — | Tier from projectile count (0/1/3/5/8 → tier 0-4) |
| Muscles | Primary DPS | 0.30–0.75 | 7 DPS/tier, max 2 targets |
| Kidneys | Last defense | 0.80–0.95 | 8 DPS base, max 1 target |

### Food System

| Tier | Type | Speed | Cards | Modifiers |
|------|------|-------|-------|-----------|
| 1 | Healthy | 1 (slow) | oatmeal, chicken, broccoli, salmon, yogurt | fiber, protein, fat |
| 2 | Neutral | 2 (medium) | rice, pasta, banana, bread, apple | fiber |
| 3 | Junk | 3-4 (fast) | cola, chocolate_bar, ice_cream | sugar, fat |

**Modifiers:** fiber (×0.7 speed), sugar (×1.4 speed), protein (×1.5 duration), fat (×0.85 speed)
**Tag boost:** protein tag → muscle DPS ×1.25

### Degradation System

- **Thresholds:** 100, 250, 500, 800, 1200 mg excess → 1-5 circles
- **Distribution cycle:** Liver → Pancreas → Kidneys → repeat
- **Penalties:** Liver +0.1 slow factor, Pancreas -1 max tier, Kidneys -5 DPS per circle
- **Defeat:** 12 total circles
- **Assessment:** Excellent (0) / Decent (1) / Poor (2-3) / Defeat (4+)

### Offer System

3 sequential offers per segment, each with 3 cards:
- Pick 1 card → place in meal slot or send to inventory
- Remaining 2 cards discarded
- Progressive templates: segments 1-3 (easy) → 4-6 (medium) → 7+ (hard)
- Constraints: no repeat cards, max 3 same tag per segment

### Key Constants

```
SPEED_SCALE = 0.04          PROJECTILE_SIZE = 10 mg
SEGMENT_DELAY = 3 sec       MAX_DEGRADATION_CIRCLES = 12
LIVER_SLOW_FACTOR = 0.6     LIVER_CAPACITY = 4
MUSCLE_DPS_PER_TIER = 7     MUSCLE_MAX_TARGETS = 2
KIDNEY_DPS = 8              KIDNEY_MAX_TARGETS = 1
PANCREAS_THRESHOLDS = [0, 1, 3, 5, 8]
```

### Known Issues
- OrganOverview component disabled (code preserved)
- No metformin/exercise interventions (Port Planner features, not ported)
- Framer-motion available but not utilized yet
- No level selection — single level with survival mode

---

## Project: Port Planner (branch: `main`)

**Port Planner** — a metabolic simulation game teaching blood glucose management through a port/ship metaphor. Drag-and-drop food cards into time slots, simulate a day of glucose dynamics with SVG pipe visualizations, review results.

### Tech Stack
- React 19 + TypeScript + Vite
- @dnd-kit for drag-and-drop
- Zustand for state management

### Current State (v0.24.11) — WP System, Tooltips, Hints

- **Victory Popup (v0.24.10-v0.24.11)** ✅
  - "Level Passed!" popup after completing all days without defeat
  - "Restart Level" button on defeat, "Restart" on victory
- **Tooltips & Hints (v0.24.4-v0.24.8)** ✅
  - CSS `data-tooltip` tooltips on food/intervention cards (133ms delay)
  - Tooltip component wrappers for BG, WP, Fast Insulin indicators
  - Planning hint text: "Drag & drop food cards into time slots..."
  - Simulation hint text: "Watch the glucose flow — use Fast Insulin if blood sugar spikes"
  - Tooltips on carb range indicators
- **WP Badge Enhancement (v0.24.4)** ✅
  - ☀️ emoji (24px) as WP icon in header
  - WP badge on cards: 1.5x bigger with ☀️
- **Exercise Effect Zones (v0.24.7)** ✅
  - ⚡ indicators on slots affected by exercise duration
  - Orange for light exercise, green for intense
- **WP System** ✅ — Willpower budget per day, wpCost on cards
- **SVG Pipe System** ✅ — animated glucose flow with chevrons
- **Body Diagram** ✅ — absolute-positioned organs at corners, center BG
- **Results Phase** ✅ — BG graph, excess BG circles, organ degradation display
- **3-day level** with per-day WP budgets, blocked slots, narratives

### Key Files (main branch)
- `src/store/gameStore.ts` — global game state (WP system)
- `src/core/simulation/SimulationEngine.ts` — simulation engine
- `src/core/types.ts` — TypeScript types
- `src/components/planning/` — PlanningHeader, ShipCard, SlotGrid, ShipInventory
- `src/components/simulation/` — BodyDiagram, PipeSystem, OrganSprite
- `src/components/results/` — ResultsPhase, BGGraph, ExcessBGIndicator, OrganDegradationDisplay
- `src/components/ui/` — Tooltip, EyeToggle
- `public/data/foods.json` — food cards with WP costs
- `public/data/interventions.json` — exercise interventions
- `public/data/levels/level-01.json` — 3-day level config
