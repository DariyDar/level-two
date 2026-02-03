# Changelog

All notable changes to Port Management will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2026-02-03

### Added
- **Configuration-Driven Rules System**
  - Introduced Rule Engine for evaluating organ behavior
  - Created TypeScript interfaces for rules, conditions, and actions
  - Added `src/core/rules/` module with RuleEngine class
  - Added `src/config/organRules.json` configuration file
  - Organ behavior now defined in JSON, not hardcoded

- **Documentation**
  - Created `docs/SPEC_ANALYSIS_v0.6.md` - comprehensive analysis of spec v0.6 vs implementation
  - Added this CHANGELOG.md file

### Changed
- **Refactored SimulationEngine**
  - Replaced hardcoded logic in `processLiverTransfer()` with Rule Engine
  - Replaced hardcoded logic in `processMuscleDrain()` with Rule Engine
  - Added `buildRuleContext()` method to create evaluation context
  - Imported `organRulesConfig` for rule evaluation

### Technical Details

**New Files:**
- `src/core/rules/types.ts` - TypeScript type definitions for rule system
- `src/core/rules/RuleEngine.ts` - Rule evaluation engine
- `src/core/rules/index.ts` - Module exports
- `src/config/organRules.json` - Liver and muscle rule configurations
- `docs/SPEC_ANALYSIS_v0.6.md` - Specification analysis document

**Modified Files:**
- `src/core/simulation/SimulationEngine.ts` - Refactored to use Rule Engine
- `src/version.ts` - Updated to v0.3.0
- `CLAUDE.md` - Updated Current State section

### Benefits
- **Easier Game Balancing:** Adjust organ behavior by editing JSON, no code changes needed
- **Better Maintainability:** Clear separation between game logic and rules
- **Extensibility:** Easy to add new rule types and conditions
- **Debugging:** Rule evaluation results include matched rules and applied modifiers

### Migration Notes
No breaking changes for users. The simulation behavior remains identical, but the implementation is now configuration-driven.

---

## [0.2.4] - 2026-02-03

### Added
- Particle system for glucose flow visualization
- Visual feedback for ships → liver → BG → muscles/kidneys flow

### Fixed
- Particle stream endpoints alignment
- Particle size and color consistency (white particles only)

---

## [0.2.0] - Previous

### Added
- Planning phase with drag-and-drop
- Simulation phase with organ metabolism
- Results phase with BG history graph
- Liver, BG, Pancreas/Muscles simulation
- Boost mechanics (Liver Boost, Pancreas Boost)
- Effect containers (Metformin, Exercise)
- Simple degradation system
- Multi-day progression

---

## Future Plans

### [0.4.0] - Kidneys Implementation (Deferred)
- Renal system for high-BG scenarios
- Kidney container and excretion mechanics
- Threshold-based activation (BG > 180)

### [0.5.0+] - Enhanced Degradation (Pending Spec)
- Multi-tier degradation system
- Dynamic organ capacity based on degradation
- Degradation buffer and accumulation formulas

### [0.6.0+] - Additional Effect Containers (Future)
- GLP-1 (glucose absorption modifier)
- SGLT2 (kidney function modifier)
- Insulin (direct BG modifier)
- Inflammation (degradation protection)

---

[0.3.0]: https://github.com/yourproject/compare/v0.2.4...v0.3.0
[0.2.4]: https://github.com/yourproject/compare/v0.2.0...v0.2.4
[0.2.0]: https://github.com/yourproject/releases/tag/v0.2.0
