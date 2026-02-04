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
- `src/store/gameStore.ts` — global game state
- `src/core/simulation.ts` — simulation engine
- `src/components/simulation/` — simulation UI components
- `src/components/planning/` — planning phase UI
- `data/` — JSON configs for ships and levels

### Current State (v0.7.0)
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
- Visual Degradation Indicators ✅
  - Color-coded circles for organ health (green = healthy, pink = degraded)
  - Liver: 5 circles (max 5 degraded)
  - Pancreas: 4 circles (max 4 degraded)
  - Real-time visual feedback during simulation
- **NEW:** Organ Sprite UI System ✅
  - OrganSprite component with icon on substrate (rounded square)
  - Two substrate states: active (light) and inactive (dark)
  - Muscles & Pancreas: sprite-only display (no progress bars)
  - Liver & Kidneys: container + sprite combo
  - Updated layout: Top row (Muscles-BG-Kidneys), Bottom row (Pancreas-Liver)
  - Organ icons: kidney_icon.png, liver_icon.png, muscle_icon.png, pancreas_icon.png

### Known Issues
- Effect Containers: No threshold-based activation (planned for future)
- Kidneys: Not fully implemented (basic excretion only)
- Muscle Rate Tiers: Need update to [0,20,30,50,70,90] from spec
- Metformin degradation blocking: Not implemented
- Pipe connections: Visual connections between organs not yet implemented
