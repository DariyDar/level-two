# Project Rules for Claude

## Git Workflow

**Always push after commits** — User tests online, so every commit must be pushed immediately after creation. Don't wait for explicit push request.

```
git add ... && git commit ... && git push
```

## Version Number

**Always increment version after changes** — Update `src/version.ts` after every change and tell user which version to test.

Format: `v0.X.Y` where X is feature number, Y is fix number within feature.

## Language

- Communicate in Russian
- Code and comments in English

## Project Context

This is "Port Management" — a metabolic simulation game teaching blood glucose management through a port/ship metaphor.

- React 19 + TypeScript + Vite
- @dnd-kit for drag-and-drop
- Zustand for state management
