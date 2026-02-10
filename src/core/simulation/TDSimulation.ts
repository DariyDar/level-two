import type {
  FoodCard,
  Projectile,
  OrganState,
  SimulationState,
  DegradationState,
} from '../../types'
import { SIM_CONSTANTS } from '../../types'

let nextProjectileId = 0

function makeProjectileId(): string {
  return `p${nextProjectileId++}`
}

function computeMealModifiers(cards: FoodCard[]): { speedMultiplier: number } {
  let speedMultiplier = 1.0

  // Whole-meal modifiers (don't stack with themselves)
  const hasFiber = cards.some(c => c.modifiers.fiber)
  const hasSugar = cards.some(c => c.modifiers.sugar)

  if (hasFiber) speedMultiplier *= SIM_CONSTANTS.FIBER_SPEED_MULTIPLIER
  if (hasSugar) speedMultiplier *= SIM_CONSTANTS.SUGAR_SPEED_MULTIPLIER

  return { speedMultiplier }
}

function computeCardModifiers(card: FoodCard): {
  speedMultiplier: number
  durationMultiplier: number
} {
  let speedMultiplier = 1.0
  let durationMultiplier = 1.0

  if (card.modifiers.protein) {
    durationMultiplier *= SIM_CONSTANTS.PROTEIN_DURATION_MULTIPLIER
  }
  if (card.modifiers.fat) {
    speedMultiplier *= SIM_CONSTANTS.FAT_SPEED_MULTIPLIER
    durationMultiplier *= SIM_CONSTANTS.FAT_DURATION_MULTIPLIER
  }

  return { speedMultiplier, durationMultiplier }
}

function computePancreasTier(activeProjectileCount: number, maxTier: number): number {
  const thresholds = SIM_CONSTANTS.PANCREAS_TIER_THRESHOLDS
  let tier = 0
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (activeProjectileCount >= thresholds[i]) {
      tier = i
      break
    }
  }
  return Math.min(tier, maxTier)
}

function createInitialOrganState(degradation: DegradationState): OrganState {
  return {
    liver: {
      slowFactor: SIM_CONSTANTS.LIVER_SLOW_FACTOR + degradation.liverCircles * SIM_CONSTANTS.LIVER_SLOW_PENALTY,
      zoneStart: SIM_CONSTANTS.LIVER_ZONE_START,
      zoneEnd: SIM_CONSTANTS.LIVER_ZONE_END,
      capacity: SIM_CONSTANTS.LIVER_CAPACITY,
      activeCount: 0,
    },
    pancreas: {
      currentTier: 0,
      maxTier: Math.max(0, SIM_CONSTANTS.PANCREAS_MAX_TIER - degradation.pancreasCircles * SIM_CONSTANTS.PANCREAS_TIER_PENALTY),
    },
    muscles: {
      dps: 0,
      rangeStart: SIM_CONSTANTS.MUSCLE_RANGE_START,
      rangeEnd: SIM_CONSTANTS.MUSCLE_RANGE_END,
      maxTargets: SIM_CONSTANTS.MUSCLE_MAX_TARGETS,
      targets: [],
    },
    kidneys: {
      dps: Math.max(0, SIM_CONSTANTS.KIDNEY_DPS - degradation.kidneysCircles * SIM_CONSTANTS.KIDNEYS_DPS_PENALTY),
      rangeStart: SIM_CONSTANTS.KIDNEY_RANGE_START,
      rangeEnd: SIM_CONSTANTS.KIDNEY_RANGE_END,
      maxTargets: SIM_CONSTANTS.KIDNEY_MAX_TARGETS,
      targets: [],
    },
  }
}

export class TDSimulation {
  private state: SimulationState
  private mealCards: FoodCard[]
  private mealSpeedMultiplier: number
  private muscleBoost: number
  private segmentDelay: number

  constructor(
    mealCards: FoodCard[],
    degradation: DegradationState,
    segmentDelay: number = SIM_CONSTANTS.SEGMENT_DELAY,
  ) {
    this.mealCards = mealCards
    this.segmentDelay = segmentDelay

    const { speedMultiplier } = computeMealModifiers(mealCards)
    this.mealSpeedMultiplier = speedMultiplier

    // Protein tag boosts muscles
    this.muscleBoost = mealCards.some(c => c.tag === 'protein')
      ? SIM_CONSTANTS.PROTEIN_TAG_MUSCLE_BOOST
      : 1.0

    nextProjectileId = 0

    this.state = {
      time: 0,
      projectiles: [],
      organs: createInitialOrganState(degradation),
      excessGlucose: 0,
      impacts: [],
      slotSpawnStates: [],
      nextSlotToActivate: 0,
      nextSlotActivationTime: 0,
      isComplete: false,
    }
  }

  tick(dt: number): SimulationState {
    if (this.state.isComplete) return this.state

    this.state.time += dt

    // 1. Activate slots
    this.activateSlots()

    // 2. Spawn projectiles
    this.spawnProjectiles(dt)

    // 3. Move projectiles
    this.moveProjectiles(dt)

    // 4. Update pancreas tier
    this.updatePancreas()

    // 5. Organ targeting & damage
    this.processMuscleFire(dt)
    this.processKidneyFire(dt)

    // 6. Remove dead projectiles & base impacts
    this.processBaseImpacts()

    // 7. Check completion
    this.checkCompletion()

    return this.state
  }

  getState(): SimulationState {
    return this.state
  }

  isComplete(): boolean {
    return this.state.isComplete
  }

  private activateSlots(): void {
    while (
      this.state.nextSlotToActivate < this.mealCards.length &&
      this.state.time >= this.state.nextSlotActivationTime
    ) {
      const slotIndex = this.state.nextSlotToActivate
      const card = this.mealCards[slotIndex]

      const cardMods = computeCardModifiers(card)
      const effectiveDuration = card.releaseDuration * cardMods.durationMultiplier
      const effectiveSpeed = card.glucoseSpeed * this.mealSpeedMultiplier * cardMods.speedMultiplier
      const totalGlucose = card.glucose
      const projectileCount = Math.max(1, Math.ceil(totalGlucose / SIM_CONSTANTS.PROJECTILE_SIZE))
      const spawnInterval = effectiveDuration / projectileCount
      const projectileGlucose = totalGlucose / projectileCount

      this.state.slotSpawnStates.push({
        slotIndex,
        remainingGlucose: totalGlucose,
        spawnTimer: 0, // spawn first immediately
        spawnInterval,
        projectileGlucose,
        baseSpeed: effectiveSpeed,
      })

      this.state.nextSlotToActivate++
      this.state.nextSlotActivationTime = this.state.nextSlotToActivate * this.segmentDelay
    }
  }

  private spawnProjectiles(dt: number): void {
    const toRemove: number[] = []

    for (let i = 0; i < this.state.slotSpawnStates.length; i++) {
      const ss = this.state.slotSpawnStates[i]
      ss.spawnTimer -= dt

      while (ss.spawnTimer <= 0 && ss.remainingGlucose > 0) {
        const glucose = Math.min(ss.projectileGlucose, ss.remainingGlucose)

        this.state.projectiles.push({
          id: makeProjectileId(),
          sourceSlot: ss.slotIndex,
          glucose,
          position: 0,
          speed: ss.baseSpeed * SIM_CONSTANTS.SPEED_SCALE,
          baseSpeed: ss.baseSpeed * SIM_CONSTANTS.SPEED_SCALE,
        })

        ss.remainingGlucose -= glucose
        ss.spawnTimer += ss.spawnInterval
      }

      if (ss.remainingGlucose <= 0) {
        toRemove.push(i)
      }
    }

    // Remove finished spawn states (reverse to preserve indices)
    for (let i = toRemove.length - 1; i >= 0; i--) {
      this.state.slotSpawnStates.splice(toRemove[i], 1)
    }
  }

  private moveProjectiles(dt: number): void {
    const liver = this.state.organs.liver
    let liverActiveCount = 0

    for (const p of this.state.projectiles) {
      let effectiveSpeed = p.baseSpeed

      // Liver slowdown
      if (
        p.position >= liver.zoneStart &&
        p.position <= liver.zoneEnd &&
        liverActiveCount < liver.capacity
      ) {
        effectiveSpeed *= liver.slowFactor
        liverActiveCount++
      }

      p.speed = effectiveSpeed
      p.position += effectiveSpeed * dt
    }

    liver.activeCount = liverActiveCount
  }

  private updatePancreas(): void {
    const activeCount = this.state.projectiles.length
    const pancreas = this.state.organs.pancreas
    pancreas.currentTier = computePancreasTier(activeCount, pancreas.maxTier)

    // Update muscle DPS based on pancreas tier (with protein tag boost)
    this.state.organs.muscles.dps = pancreas.currentTier * SIM_CONSTANTS.MUSCLE_DPS_PER_TIER * this.muscleBoost
  }

  private processMuscleFire(dt: number): void {
    const muscles = this.state.organs.muscles

    // Find targets in range, sorted by closest to base
    const inRange = this.state.projectiles
      .filter(p => p.position >= muscles.rangeStart && p.position <= muscles.rangeEnd)
      .sort((a, b) => b.position - a.position) // closest to base first
      .slice(0, muscles.maxTargets)

    muscles.targets = inRange.map(p => p.id)

    // Apply damage
    for (const target of inRange) {
      target.glucose -= muscles.dps * dt
    }
  }

  private processKidneyFire(dt: number): void {
    const kidneys = this.state.organs.kidneys

    const inRange = this.state.projectiles
      .filter(p => p.position >= kidneys.rangeStart && p.position <= kidneys.rangeEnd)
      .sort((a, b) => b.position - a.position)
      .slice(0, kidneys.maxTargets)

    kidneys.targets = inRange.map(p => p.id)

    for (const target of inRange) {
      target.glucose -= kidneys.dps * dt
    }
  }

  private processBaseImpacts(): void {
    const surviving: Projectile[] = []

    for (const p of this.state.projectiles) {
      if (p.glucose <= 0) {
        // Destroyed by organs
        continue
      }
      if (p.position >= 1.0) {
        // Reached base — damage + VFX
        this.state.excessGlucose += p.glucose
        this.state.impacts.push({
          id: p.id,
          sourceSlot: p.sourceSlot,
          time: this.state.time,
        })
        continue
      }
      surviving.push(p)
    }

    this.state.projectiles = surviving

    // Clean up old impacts (older than 0.6s)
    this.state.impacts = this.state.impacts.filter(
      imp => this.state.time - imp.time < 0.6,
    )
  }

  private checkCompletion(): void {
    const allSlotsActivated = this.state.nextSlotToActivate >= this.mealCards.length
    const allSpawned = this.state.slotSpawnStates.length === 0
    const noProjectiles = this.state.projectiles.length === 0

    if (allSlotsActivated && allSpawned && noProjectiles) {
      this.state.isComplete = true
    }
  }
}
