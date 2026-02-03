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

### Current State (v0.2.4)
- Planning phase: drag-and-drop ships to time slots ✅
- Simulation phase: glucose flow visualization with particles ✅
- Results phase: basic BG history graph ✅
- Particle system: streams from ships → liver → BG → muscles/kidneys

### Known Issues
- Particle positions may need fine-tuning
- Kidneys only activate when BG > 180
