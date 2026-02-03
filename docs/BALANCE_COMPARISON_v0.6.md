# Balance Parameters Comparison: Excel v0.6 vs Implementation v0.3.0

**Date:** 2026-02-03
**Excel Source:** `Level 2, Port, Balance v0.6.xlsx`
**Implementation:** v0.3.0 (feature/config-driven-rules)

---

## Executive Summary

This document compares balance parameters from the Excel specification (v0.6) with the current code implementation (v0.3.0). Analysis covers naming conventions, value discrepancies, and missing parameters.

**Overall Status:** ⚠️ **Moderate Discrepancies** - Some values differ significantly between spec and implementation

---

## 1. System Parameters Analysis

### 1.1 BG Container (Blood Glucose)

| Parameter | Excel v0.6 | Implementation v0.3.0 | Status |
|-----------|------------|----------------------|--------|
| **Capacity** | 400 mg/dL | 400 mg/dL | ✅ Match |
| **Naming** | BGContainer | `bg` (code), `bgCapacity` (config) | ⚠️ Inconsistent naming |

**Notes:**
- Excel uses "BGContainer", code uses "bg" internally
- Consider standardizing naming for clarity

---

### 1.2 Liver Container

#### Capacity & Base Parameters

| Parameter | Excel v0.6 | Implementation v0.3.0 | Status |
|-----------|------------|----------------------|--------|
| **Capacity** | 100 mg/dL | 100 mg/dL | ✅ Match |
| **Transfer Rates** | | | |
| - Tier 0 | 0 mg/dL/hour | 0 mg/dL/hour | ✅ Match |
| - Tier 1 | 50 mg/dL/hour | 30 mg/dL/hour | ❌ **MISMATCH** |
| - Tier 2 | 75 mg/dL/hour | 50 mg/dL/hour | ❌ **MISMATCH** |

**Critical Issue:** Transfer rates in code are significantly lower than spec!

#### Liver Rules Comparison

| Rule | Excel v0.6 | Implementation v0.3.0 | Status |
|------|------------|----------------------|--------|
| **Rule 1: Default Function** | | | |
| - Threshold | BG ≤ 70 | BG ≤ 100 | ❌ **Different threshold** |
| - Action | Transfer at Tier 1 | Transfer at Tier 1 | ✅ Match |
| | | | |
| **Rule 2: Overflow** | | | |
| - Threshold | Liver = 100 (full) | Liver ≥ 90% capacity | ⚠️ Similar concept |
| - Action | Transfer at Tier 2 | Transfer at Tier 2 | ✅ Match |
| | | | |
| **Rule 3: Player Action** | | | |
| - Trigger | Player Activated | Liver Boost active | ✅ Match |
| - Action | Transfer at Tier 2 | Transfer at Tier 2 | ✅ Match |
| - Cooldown | 3 hours | 1 hour | ❌ **MISMATCH** |

**Missing in Implementation:**
- Excel Rule 1 uses BG threshold of 70, code uses 100
- No explicit rule for "BG high stop" in Excel (exists in code at BG ≥ 200)

---

### 1.3 Pancreas

#### Rules Comparison

| Rule | Excel v0.6 Description | Implementation Status |
|------|----------------------|----------------------|
| **Rule 1** | Very Low BG (≤50) → Activate Muscle Tier 4 | ❌ **Not implemented** (code stops at BG ≤100) |
| **Rule 2** | Low BG (≤80) → Activate Muscle Tier 3 | ❌ **Not implemented** |
| **Rule 3** | High BG (≥150) → Activate Muscle Tier 0 | ⚠️ **Inverted logic** (code activates high tiers at high BG) |

**Critical Issue:** Pancreas rules in Excel appear **inverted** or based on different logic than implementation!

**Excel Logic (appears incorrect?):**
- Low BG → High muscle tier (more drain) ❌ This would worsen hypoglycemia!
- High BG → Low muscle tier (less drain) ❌ This would worsen hyperglycemia!

**Implementation Logic (makes physiological sense):**
- Low BG → Tier 0 (stop drain) ✅
- Normal-High BG → Tier 2-3 (moderate drain) ✅
- High/Critical BG → Tier 4-5 (maximum drain) ✅

**Recommendation:** ⚠️ **Excel spec may have errors** - verify with domain expert before implementing

#### Degradation Effects

| Tier | Excel v0.6 Effect | Implementation v0.3.0 | Status |
|------|-------------------|----------------------|--------|
| Tier 0 | None | None | ✅ Match |
| Tier 1 | Disable Muscle Tier 5 | Subtract 1 from max tier (floor formula) | ⚠️ Different approach |
| Tier 2 | Disable Muscle Tier 4 | Same as Tier 1 | ⚠️ Simplified |
| Tier 3 | Disable Muscle Tier 3 | Same as Tier 1 | ⚠️ Simplified |

**Note:** Implementation uses simplified formula: `floor(degradation / 25)` to reduce max tier, rather than specific tier disabling.

---

### 1.4 Muscle Container

#### Transfer Rates

| Tier | Excel v0.6 | Implementation v0.3.0 | Status |
|------|------------|----------------------|--------|
| **Tier 0** | 0 mg/dL/hour | 0 mg/dL/hour | ✅ Match |
| **Tier 1** | 30 mg/dL/hour | 20 mg/dL/hour | ❌ **MISMATCH (-10)** |
| **Tier 2** | 35 mg/dL/hour | 30 mg/dL/hour | ❌ **MISMATCH (-5)** |
| **Tier 3** | 40 mg/dL/hour | 50 mg/dL/hour | ❌ **MISMATCH (+10)** |
| **Tier 4** | 45 mg/dL/hour | 70 mg/dL/hour | ❌ **MISMATCH (+25)** |
| **Tier 5** | 50 mg/dL/hour | 90 mg/dL/hour | ❌ **MISMATCH (+40)** |

**Critical Issue:** Major discrepancies in muscle drain rates!

**Pattern:**
- Excel: Linear progression (30 → 35 → 40 → 45 → 50)
- Code: Exponential-ish (20 → 30 → 50 → 70 → 90)

**Impact:** Code has much more aggressive glucose drain at high tiers, which may affect game balance significantly.

---

## 2. Intervention Parameters Analysis

### 2.1 Exercise Effect

| Parameter | Excel v0.6 | Implementation v0.3.0 | Status |
|-----------|------------|----------------------|--------|
| **Container Capacity** | 100 | Not explicitly set | ⚠️ Implicit capacity |
| **Decay Rate** | 100 per hour | 50 per hour | ❌ **MISMATCH** |
| **Decay Time** | 1 hour (full decay) | ~2 hours | ❌ **MISMATCH** |
| **Threshold #1** | 10 mg/dL | 50 mg/dL | ❌ **MISMATCH** |
| **Effect** | +1 Muscle Tier | +1 Muscle Tier | ✅ Match |

**Notes:**
- Excel decay rate would empty container in 1 hour (100/100)
- Code decay rate takes ~2 hours (100/50)
- Threshold difference (10 vs 50) significantly affects when bonus activates

---

### 2.2 Metformin Effect

| Parameter | Excel v0.6 | Implementation v0.3.0 | Status |
|-----------|------------|----------------------|--------|
| **Container Capacity** | 100 | Not explicitly set | ⚠️ Implicit capacity |
| **Decay Rate** | 10 per hour | 7 per hour | ❌ **MISMATCH** |
| **Decay Time** | 10 hours | ~14 hours | ❌ **MISMATCH** |
| **Thresholds** | | | |
| - Threshold #1 | 40 → Disable Degradation Tier 1 | Not implemented | ❌ **Missing** |
| - Threshold #2 | 60 → Disable Degradation Tier 2 | Not implemented | ❌ **Missing** |
| - Threshold #3 | 80 → Disable Degradation Tier 3 | Not implemented | ❌ **Missing** |

**Critical Issue:** Metformin degradation-blocking effects not implemented!

---

### 2.3 Other Interventions (Missing)

| Intervention | Excel v0.6 | Implementation v0.3.0 | Status |
|--------------|------------|----------------------|--------|
| **SGLT2** | Mentioned (no details) | Not implemented | ❌ **Missing** |
| **GLP-1** | Mentioned (no details) | Not implemented | ❌ **Missing** |
| **Insulin Bolus** | Mentioned (no details) | Not implemented | ❌ **Missing** |
| **Insulin Basal** | Mentioned (no details) | Not implemented | ❌ **Missing** |

**Note:** Sheet "Intervention Parameters (old)" contains detailed specs for these - may be outdated or future-planned features.

---

## 3. Food Parameters Analysis

### 3.1 Food Items - Sample Comparison

| Food | Excel v0.6 | Code Implementation | Status |
|------|------------|-------------------|--------|
| **Banana** | | | |
| - Net Carbs | 25g | (Need to check data files) | ⚠️ Not verified |
| - Glucose Equivalent | 250 mg/dL | | |
| - Ship Size | S | | |
| - Unload Time | 1 hour | | |
| - Unload Speed | 250 mg/dL/hour | | |

**Note:** Food parameters need to be compared against `data/` JSON files in the repository. This requires separate analysis.

---

## 4. Naming Convention Issues

### 4.1 Inconsistent Terminology

| Concept | Excel v0.6 Term | Code Term | Recommended |
|---------|----------------|-----------|-------------|
| Blood glucose container | BGContainer | `bg` / `bgCapacity` | BGContainer |
| Liver container | LiverContainer | `liver` / `liverCapacity` | LiverContainer |
| Transfer rate tier | GlucoseTransferRateTiers | `tier` / `rateTier` | RateTier |
| Degradation level | Degradation Tiers | `degradation` | DegradationTier |

### 4.2 Parameter Naming

**Excel uses verbose names:**
- "Glucose Transfer RateTiers"
- "Glucose Transfer Rate (mg/dL/hour)"

**Code uses concise names:**
- `rates: [0, 30, 50]`
- `tier: 2`

**Recommendation:** Add mapping/documentation to clarify equivalence

---

## 5. Critical Discrepancies Summary

### 🔴 High Priority (Major Impact)

1. **Liver Transfer Rates** - Code rates 40% lower than spec
   - Spec Tier 1: 50 → Code: 30 (-40%)
   - Spec Tier 2: 75 → Code: 50 (-33%)

2. **Muscle Drain Rates** - Code rates significantly different
   - Lower at low tiers, much higher at high tiers
   - Pattern: Linear (spec) vs Exponential (code)

3. **Pancreas Rules** - Logic appears inverted in Excel spec
   - **Requires domain expert verification!**
   - Implementation logic makes physiological sense
   - Excel spec may be incorrect

4. **Metformin Degradation Effects** - Not implemented
   - Multi-threshold degradation blocking missing

### 🟡 Medium Priority (Moderate Impact)

5. **Exercise Decay Rate** - Code 50% slower than spec
   - Spec: 100/hour → Code: 50/hour

6. **Liver Boost Cooldown** - Code 3x faster than spec
   - Spec: 3 hours → Code: 1 hour

7. **Liver Rule Thresholds** - Different BG trigger points
   - Default function: Spec uses 70, Code uses 100

### 🟢 Low Priority (Minor Impact)

8. **Naming Conventions** - Inconsistent terminology
9. **Missing Interventions** - SGLT2, GLP-1, Insulin (future features)

---

## 6. Recommendations

### Immediate Actions

1. **🔴 Verify Pancreas Rules** with domain expert
   - Excel logic appears inverted (may be spec error)
   - Do NOT implement without verification

2. **🔴 Decide on Transfer Rates**
   - Update code to match Excel? OR
   - Update Excel to reflect tested/balanced code values?
   - Document which is authoritative

3. **🟡 Update Configuration Files**
   - If Excel is authoritative: Update `organRules.json` with correct values
   - Add comments documenting source (Excel v0.6)

### Future Work

4. **Implement Missing Metformin Effects**
   - Add threshold-based degradation blocking
   - Requires enhanced Rule Engine conditions

5. **Standardize Naming**
   - Choose consistent terminology (prefer Excel verbose names for clarity)
   - Update code comments and documentation

6. **Food Parameters Validation**
   - Compare Excel food data with `data/` JSON files
   - Ensure ships load correct glucose amounts

---

## 7. Excel Specification Concerns

### Potential Issues in Excel v0.6

1. **Pancreas Rules Logic**
   - Rules appear physiologically backwards
   - High BG should activate high muscle tiers (drain more), not low tiers
   - **Recommendation:** Flag for expert review

2. **Missing Details**
   - No explicit rules for "BG high stop transfer" (exists in code)
   - Degradation tier effects not fully specified for Liver

3. **Incomplete Sections**
   - SGLT2, GLP-1, Insulin have placeholders but no values
   - Old parameters sheet suggests these were planned but deferred

---

## 8. Proposed Action Plan

### Phase 1: Clarification (Before Any Changes)

1. ✅ Review this comparison document
2. ⏳ Verify Pancreas rules with domain expert
3. ⏳ Decide authoritative source for conflicting values
4. ⏳ Document decisions in project wiki/docs

### Phase 2: Implementation Updates

5. ⏳ Update `organRules.json` with agreed values
6. ⏳ Implement Metformin degradation effects
7. ⏳ Standardize naming conventions
8. ⏳ Add unit tests for balance parameters

### Phase 3: Validation

9. ⏳ Playtest with updated balance
10. ⏳ Iterate based on feedback
11. ⏳ Update Excel spec with final tested values

---

## Appendix: Raw Data

### A1. Excel "System Parameters" Sheet (Raw)

```
BG Container: Capacity = 400 mg/dL

Liver:
  Capacity: 100 mg/dL
  Transfer Rates:
    - Tier 0: 0 mg/dL/hour
    - Tier 1: 50 mg/dL/hour
    - Tier 2: 75 mg/dL/hour
  Rules:
    1. Default (BG≤70) → Transfer at Tier 1
    2. Overflow (Liver=100) → Transfer at Tier 2
    3. Player Action → Transfer at Tier 2 (Cooldown: 3h)

Pancreas Rules:
  1. Very Low BG (≤50) → Activate Muscle Tier 4
  2. Low BG (≤80) → Activate Muscle Tier 3
  3. High BG (≥150) → Activate Muscle Tier 0

Muscle:
  Transfer Rates:
    - Tier 0: 0 mg/dL/hour
    - Tier 1: 30 mg/dL/hour
    - Tier 2: 35 mg/dL/hour
    - Tier 3: 40 mg/dL/hour
    - Tier 4: 45 mg/dL/hour
    - Tier 5: 50 mg/dL/hour
```

### A2. Current Implementation Values (v0.3.0)

```typescript
// SimulationEngine.ts
liverCapacity: 100,
bgCapacity: 400,
liverTransferRates: [0, 30, 50],  // Tier 0, 1, 2
muscleDrainRates: [0, 20, 30, 50, 70, 90],  // Tier 0-5
metforminDecayRate: 7,
exerciseDecayRate: 50,
liverBoostCooldown: 1,

// organRules.json
liver.rates: [0, 30, 50]
muscles.rates: [0, 20, 30, 50, 70, 90]
```

---

**End of Report**

**Next Steps:** Review findings with team, verify Pancreas rules logic, and decide on authoritative balance values before proceeding with updates.
