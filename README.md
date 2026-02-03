# Port Management 🚢

A metabolic simulation game about managing blood glucose levels through meal planning.

## Concept

You are a port manager responsible for planning the arrival of food "ships" throughout the day. Each ship carries glucose cargo that must be processed by your body's organs. Plan wisely to keep blood glucose levels stable!

## Game Phases

1. **Planning** - Drag food ships to time slots
2. **Simulation** - Watch your body process the food
3. **Results** - See your score and organ health

## Tech Stack

- React 19 + TypeScript
- Vite
- Zustand (state management)
- @dnd-kit (drag and drop)

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Documentation

See the [docs](./docs) folder for detailed design documentation:

- [00-overview.md](./docs/00-overview.md) - Project overview
- [01-architecture.md](./docs/01-architecture.md) - Technical architecture
- [02-planning-phase.md](./docs/02-planning-phase.md) - Planning UI
- [03-simulation-phase.md](./docs/03-simulation-phase.md) - Simulation engine
- [04-results-phase.md](./docs/04-results-phase.md) - Results calculation
- [05-configuration.md](./docs/05-configuration.md) - JSON configs
- [06-data-models.md](./docs/06-data-models.md) - TypeScript types

## License

MIT
