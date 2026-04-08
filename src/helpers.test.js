import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  applyDecay,
  applySleepRegen,
  applyHpLogic,
  checkEvolution,
  decrementCooldowns,
  mapBattleStats,
} from './utils/petLogic'
import {
  DECAY_RATES,
  DEFAULT_PET,
} from './constants/game'

describe('DEFAULT_PET', () => {
  it('returns exact default values', () => {
    const pet = DEFAULT_PET()
    expect(pet.hunger).toBe(80)
    expect(pet.happiness).toBe(80)
    expect(pet.cleanliness).toBe(90)
    expect(pet.energy).toBe(100)
    expect(pet.health).toBe(100)
    expect(pet.alive).toBe(true)
    expect(pet.sleeping).toBe(false)
    expect(pet.poops).toBe(0)
    expect(pet.age).toBe(0)
    expect(pet.stage).toBe(0)
  })
})

describe('applyDecay', () => {
  it('decreases stats by correct decay rate when awake', () => {
    const pet = { hunger: 80, happiness: 80, cleanliness: 90, energy: 100, sleeping: false }
    const result = applyDecay(pet)
    expect(result.hunger).toBe(80 - DECAY_RATES.hunger)
    expect(result.happiness).toBe(80 - DECAY_RATES.happiness)
    expect(result.cleanliness).toBe(90 - DECAY_RATES.cleanliness)
    expect(result.energy).toBe(100 - DECAY_RATES.energy)
  })

  it('decreases stats by 0.3x decay rate when sleeping', () => {
    const pet = { hunger: 80, happiness: 80, cleanliness: 90, energy: 100, sleeping: true }
    const result = applyDecay(pet)
    expect(result.hunger).toBe(80 - DECAY_RATES.hunger * 0.3)
    expect(result.happiness).toBe(80 - DECAY_RATES.happiness * 0.3)
    expect(result.cleanliness).toBe(90 - DECAY_RATES.cleanliness * 0.3)
    expect(result.energy).toBe(100 - DECAY_RATES.energy * 0.3)
  })

  it('clamps stats to [0, 100]', () => {
    // values smaller than decay rates so result clamps to 0
    const pet = { hunger: 0.01, happiness: 0.01, cleanliness: 0.01, energy: 0.01, sleeping: false }
    const result = applyDecay(pet)
    expect(result.hunger).toBe(0)
    expect(result.happiness).toBe(0)
    expect(result.cleanliness).toBe(0)
    expect(result.energy).toBe(0)
  })
})

describe('applyDecay - Property: Sleeping stat decay invariant', () => {
  it('each stat equals max(stat - 0.3 * decayRate, 0) for sleeping pets', () => {
    fc.assert(
      fc.property(
        fc.record({
          hunger:      fc.float({ min: 0, max: 100, noNaN: true }),
          happiness:   fc.float({ min: 0, max: 100, noNaN: true }),
          cleanliness: fc.float({ min: 0, max: 100, noNaN: true }),
          energy:      fc.float({ min: 0, max: 100, noNaN: true }),
        }),
        ({ hunger, happiness, cleanliness, energy }) => {
          const pet = { hunger, happiness, cleanliness, energy, sleeping: true }
          const result = applyDecay(pet)
          expect(result.hunger).toBeCloseTo(Math.max(hunger - DECAY_RATES.hunger * 0.3, 0), 10)
          expect(result.happiness).toBeCloseTo(Math.max(happiness - DECAY_RATES.happiness * 0.3, 0), 10)
          expect(result.cleanliness).toBeCloseTo(Math.max(cleanliness - DECAY_RATES.cleanliness * 0.3, 0), 10)
          expect(result.energy).toBeCloseTo(Math.max(energy - DECAY_RATES.energy * 0.3, 0), 10)
        }
      ),
      { numRuns: 100 }
    )
  })
})

describe('applyDecay - Property: Awake stat decay invariant', () => {
  it('each stat equals max(stat - decayRate, 0) for alive awake pets', () => {
    fc.assert(
      fc.property(
        fc.record({
          hunger:      fc.float({ min: 0, max: 100, noNaN: true }),
          happiness:   fc.float({ min: 0, max: 100, noNaN: true }),
          cleanliness: fc.float({ min: 0, max: 100, noNaN: true }),
          energy:      fc.float({ min: 0, max: 100, noNaN: true }),
        }),
        ({ hunger, happiness, cleanliness, energy }) => {
          const pet = { hunger, happiness, cleanliness, energy, alive: true, sleeping: false }
          const result = applyDecay(pet)
          expect(result.hunger).toBeCloseTo(Math.max(hunger - DECAY_RATES.hunger, 0), 10)
          expect(result.happiness).toBeCloseTo(Math.max(happiness - DECAY_RATES.happiness, 0), 10)
          expect(result.cleanliness).toBeCloseTo(Math.max(cleanliness - DECAY_RATES.cleanliness, 0), 10)
          expect(result.energy).toBeCloseTo(Math.max(energy - DECAY_RATES.energy, 0), 10)
        }
      ),
      { numRuns: 100 }
    )
  })
})

describe('applySleepRegen', () => {
  it('increases energy by 1.5 when sleeping', () => {
    const pet = { energy: 50, sleeping: true }
    const result = applySleepRegen(pet)
    expect(result.energy).toBe(51.5)
    expect(result.sleeping).toBe(true)
  })

  it('auto-wakes when energy >= 95', () => {
    const pet = { energy: 94, sleeping: true }
    const result = applySleepRegen(pet)
    expect(result.energy).toBe(95.5)
    expect(result.sleeping).toBe(false)
  })

  it('returns pet unchanged when not sleeping', () => {
    const pet = { energy: 50, sleeping: false }
    expect(applySleepRegen(pet)).toBe(pet)
  })
})

describe('applySleepRegen - Property: Sleep energy regeneration and auto-wake', () => {
  it('energy increases by 1.5 (clamped to 100) and sleeping flips to false when energy >= 95', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 100, noNaN: true }),
        (energy) => {
          const pet = { energy, sleeping: true }
          const result = applySleepRegen(pet)
          const expectedEnergy = Math.min(100, energy + 1.5)
          expect(result.energy).toBeCloseTo(expectedEnergy, 10)
          expect(result.sleeping).toBe(expectedEnergy >= 95 ? false : true)
        }
      ),
      { numRuns: 100 }
    )
  })
})

describe('applyHpLogic', () => {
  it('decreases health by 0.5 when avg < 25', () => {
    const pet = { hunger: 20, happiness: 20, cleanliness: 20, health: 50 }
    expect(applyHpLogic(pet).health).toBe(49.5)
  })

  it('increases health by 0.3 when avg > 70', () => {
    const pet = { hunger: 80, happiness: 80, cleanliness: 80, health: 50 }
    expect(applyHpLogic(pet).health).toBe(50.3)
  })

  it('does not change health when avg is between 25 and 70', () => {
    const pet = { hunger: 50, happiness: 50, cleanliness: 50, health: 50 }
    expect(applyHpLogic(pet).health).toBe(50)
  })
})

describe('applyHpLogic - Property: Sickness HP decay', () => {
  it('health = max(health - 0.5, 0) when avg care stats < 25', () => {
    fc.assert(
      fc.property(
        fc.record({
          hunger:      fc.float({ min: 0, max: Math.fround(24.99), noNaN: true }),
          happiness:   fc.float({ min: 0, max: Math.fround(24.99), noNaN: true }),
          cleanliness: fc.float({ min: 0, max: Math.fround(24.99), noNaN: true }),
          health:      fc.float({ min: 0, max: 100, noNaN: true }),
        }),
        ({ hunger, happiness, cleanliness, health }) => {
          const avg = (hunger + happiness + cleanliness) / 3
          fc.pre(avg < 25)
          const result = applyHpLogic({ hunger, happiness, cleanliness, health })
          expect(result.health).toBeCloseTo(Math.max(health - 0.5, 0), 10)
        }
      ),
      { numRuns: 100 }
    )
  })
})

describe('checkEvolution', () => {
  it('does not evolve at age below first threshold', () => {
    expect(checkEvolution({ age: 0, stage: 0 }).stage).toBe(0)
  })

  it('evolves to Baby (stage=1) at age=1', () => {
    expect(checkEvolution({ age: 1, stage: 0 }).stage).toBe(1)
  })

  it('evolves to Adult (stage=4) at age=72', () => {
    expect(checkEvolution({ age: 72, stage: 0 }).stage).toBe(4)
  })

  it('does not evolve beyond Adult (stage=4)', () => {
    expect(checkEvolution({ age: 100, stage: 4 }).stage).toBe(4)
  })
})

describe('decrementCooldowns', () => {
  it('decrements each cooldown by 1', () => {
    const result = decrementCooldowns({ feed: 3, play: 2, clean: 1, heal: 5 })
    expect(result).toEqual({ feed: 2, play: 1, clean: 0, heal: 4 })
  })

  it('clamps cooldowns to 0', () => {
    const result = decrementCooldowns({ feed: 0, play: 0, clean: 0, heal: 0 })
    expect(result).toEqual({ feed: 0, play: 0, clean: 0, heal: 0 })
  })
})

describe('mapBattleStats', () => {
  it('produces expected battle stats', () => {
    const result = mapBattleStats({ hunger: 85, happiness: 75, cleanliness: 90, level: 1 })
    expect(result.attack).toBe(13)
    expect(result.defense).toBe(14)
    expect(result.special).toBe(12)
  })

  it('handles minimum values', () => {
    const result = mapBattleStats({ hunger: 0, happiness: 0, cleanliness: 0, level: 1 })
    expect(result.attack).toBe(5)
    expect(result.defense).toBe(5)
    expect(result.special).toBe(5)
  })

  it('handles maximum values', () => {
    const result = mapBattleStats({ hunger: 100, happiness: 100, cleanliness: 100, level: 1 })
    expect(result.attack).toBe(15)
    expect(result.defense).toBe(15)
    expect(result.special).toBe(15)
  })
})
