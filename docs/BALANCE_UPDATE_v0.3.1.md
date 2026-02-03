# Balance Parameters Update v0.3.1

**Date:** 2026-02-03
**Previous Version:** v0.3.0
**Updated Version:** v0.3.1
**Excel Source:** Level 2, Port, Balance v0.6.xlsx

---

## Summary

Updated game balance parameters to match Excel v0.6 specification. This update resolves major discrepancies identified in [BALANCE_COMPARISON_v0.6.md](./BALANCE_COMPARISON_v0.6.md).

---

## Changes Applied

### 1. Naming Standardization

**Approach:** Added comments mapping internal code names to Excel terminology (minimal risk approach).

**Files Updated:**
- [src/core/types.ts](../src/core/types.ts:15-29) - Added naming convention comments
- [src/core/simulation/SimulationEngine.ts](../src/core/simulation/SimulationEngine.ts:103) - Added Excel reference comments

**Mapping:**
```typescript
// Code → Excel v0.6
'bg' → BGContainer
'liver' → LiverContainer
'muscles' → Muscle (organ, not container)
'pancreas' → Pancreas (organ, not container)
```

---

### 2. Liver Transfer Rates

**Updated:** [src/config/organRules.json](../src/config/organRules.json:81)

| Tier | v0.3.0 (Old) | v0.3.1 (New) | Excel v0.6 | Status |
|------|-------------|-------------|------------|--------|
| 0    | 0           | 0           | 0          | ✅ Match |
| 1    | 30          | **50**      | 50         | ✅ Fixed |
| 2    | 50          | **75**      | 75         | ✅ Fixed |

**Impact:** Liver now releases glucose 67% faster at Tier 1, 50% faster at Tier 2.

---

### 3. Muscle Drain Rates

**Updated:** [src/config/organRules.json](../src/config/organRules.json:193)

| Tier | v0.3.0 (Old) | v0.3.1 (New) | Excel v0.6 | Status |
|------|-------------|-------------|------------|--------|
| 0    | 0           | 0           | 0          | ✅ Match |
| 1    | 20          | **30**      | 30         | ✅ Fixed |
| 2    | 30          | **35**      | 35         | ✅ Fixed |
| 3    | 50          | **40**      | 40         | ✅ Fixed |
| 4    | 70          | **45**      | 45         | ✅ Fixed |
| 5    | 90          | **50**      | 50         | ✅ Fixed |

**Impact:**
- Lower tiers (1-2) drain **more** (was too conservative)
- Higher tiers (3-5) drain **less** (was too aggressive)
- Progression now linear 30→50 instead of exponential

---

### 4. Pancreas/Muscle Rules (FIXED)

**Updated:** [src/config/organRules.json](../src/config/organRules.json:88-146)

**Previous (v0.3.0):** 4 rules with multiple BG thresholds

**New (v0.3.1):** 2 simplified rules (Excel corrected)

| Rule | Condition | Action | Rationale |
|------|-----------|--------|-----------|
| **High BG** | BG ≥ 150 | Activate Muscle Tier 3 | High glucose → activate muscles to drain |
| **Low BG** | BG ≤ 70 | Activate Muscle Tier 0 | Low glucose → stop draining (prevent hypo) |
| **Default** | Otherwise | Tier 0 | Safe default: no drain |

**Note:** Excel v0.6 had inverted logic (corrected after expert review).

---

### 5. Exercise Effect

**Updated:** [src/core/simulation/SimulationEngine.ts](../src/core/simulation/SimulationEngine.ts:113)

| Parameter | v0.3.0 (Old) | v0.3.1 (New) | Excel v0.6 |
|-----------|-------------|-------------|------------|
| Decay Rate | 50/hour | **100/hour** | 100/hour |
| Time to Empty | ~2 hours | **1 hour** | 1 hour |

**Impact:** Exercise effect now decays 2x faster (more temporary boost).

---

### 6. Liver Boost Cooldown

**Updated:** [src/core/simulation/SimulationEngine.ts](../src/core/simulation/SimulationEngine.ts:114)

| Parameter | v0.3.0 (Old) | v0.3.1 (New) | Excel v0.6 |
|-----------|-------------|-------------|------------|
| Cooldown | 1 hour | **3 hours** | 3 hours |

**Impact:** Liver Boost now has 3x longer cooldown (less frequent use).

---

## Not Updated (Deferred)

### Metformin Decay Rate

| Parameter | Current | Excel v0.6 | Status |
|-----------|---------|------------|--------|
| Decay Rate | 7/hour | 10/hour | ⏳ Deferred to v0.4.0 |

**Reason:** Metformin degradation-blocking effects not yet implemented. Will update decay rate when full Metformin system is added (v0.4.0+).

---

## Testing Recommendations

### Expected Gameplay Changes

1. **Faster Glucose Release** (Liver)
   - BG will rise more quickly after eating
   - Less time in hypoglycemia range
   - Test: Eat small meal, observe BG climb speed

2. **Smoother Muscle Drain** (Muscle)
   - Less aggressive at high BG (was overwhelming before)
   - More active at moderate BG (better balance)
   - Test: High BG scenario, verify drain isn't too harsh

3. **Clearer Pancreas Logic** (Rules)
   - Only 2 rules now: activate at 150+, stop at 70-
   - Simpler to understand and predict
   - Test: BG transitions between 70-150 range

4. **Exercise More Temporary** (Exercise)
   - Effect lasts 1 hour instead of 2
   - Must be used more strategically
   - Test: Use exercise, observe effect duration

5. **Liver Boost Less Frequent** (Cooldown)
   - Can only use every 3 hours instead of 1
   - Must plan usage more carefully
   - Test: Use boost, verify 3-hour cooldown

---

## Files Modified

```
src/core/types.ts                    # Added naming comments
src/config/organRules.json           # Updated rates & rules
src/core/simulation/SimulationEngine.ts  # Updated default config
docs/BALANCE_UPDATE_v0.3.1.md       # This document
```

---

## Validation

### ✅ Completed Checks

- [x] TypeScript compiles without errors
- [x] All rates match Excel v0.6
- [x] Pancreas rules corrected (2 rules, logical)
- [x] Comments added for naming convention
- [x] Default config values updated

### ⏳ Recommended Testing

- [ ] Play through full day with new balance
- [ ] Verify Liver transfer feels faster
- [ ] Verify Muscle drain feels smoother
- [ ] Test Exercise effect duration (1 hour)
- [ ] Test Liver Boost cooldown (3 hours)
- [ ] Check for any runtime errors

---

## Migration Notes

**Breaking Changes:** None
**Save Compatibility:** Compatible (no state structure changes)
**UI Changes:** None (same interface, different balance)

Users will notice different gameplay feel due to rebalanced rates, but no code changes required in existing saves or UI.

---

## Next Steps (Future)

1. **v0.4.0:** Implement Metformin degradation-blocking effects
2. **v0.5.0:** Implement Kidneys (BG > 180 activation)
3. **v0.6.0:** Add additional interventions (SGLT2, GLP-1, Insulin)

---

**Status:** ✅ Ready for testing
**Version:** v0.3.1
**Branch:** feature/config-driven-rules
