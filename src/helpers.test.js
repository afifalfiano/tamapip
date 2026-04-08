import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  DEFAULT_PET,
  applyDecay,
  applySleepRegen,
  applyHpLogic,
  checkEvolution,
  decrementCooldowns,
  mapBattleStats,
  DECAY_RATES,
  STAGE_THRESHOLDS,
} from './Tamagotchi.jsx'

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
    const pet = {
      hunger: 80,
      happiness: 80,
      cleanliness: 90,
      energy: 100,
      sleeping: false,
    }
    const result = applyDecay(pet)
    expect(result.hunger).toBe(80 - DECAY_RATES.hunger)
    expect(result.happiness).toBe(80 - DECAY_RATES.happiness)
    expect(result.cleanliness).toBe(90 - DECAY_RATES.cleanliness)
    expect(result.energy).toBe(100 - DECAY_RATES.energy)
  })

  it('decreases stats by 0.3x decay rate when sleeping', () => {
    const pet = {
      hunger: 80,
      happiness: 80,
      cleanliness: 90,
      energy: 100,
      sleeping: true,
    }
    const result = applyDecay(pet)
    expect(result.hunger).toBe(80 - DECAY_RATES.hunger * 0.3)
    expect(result.happiness).toBe(80 - DECAY_RATES.happiness * 0.3)
    expect(result.cleanliness).toBe(90 - DECAY_RATES.cleanliness * 0.3)
    expect(result.energy).toBe(100 - DECAY_RATES.energy * 0.3)
  })

  it('clamps stats to [0, 100]', () => {
    const pet = {
      hunger: 0.2,
      happiness: 0.1,
      cleanliness: 0.15,
      energy: 0.1,
      sleeping: false,
    }
    const result = applyDecay(pet)
    expect(result.hunger).toBe(0)
    expect(result.happiness).toBe(0)
    expect(result.cleanliness).toBe(0)
    expect(result.energy).toBe(0)
  })
})

// Feature: tamapip, Property 3: Sleeping stat decay invariant
describe('applyDecay - Property 3: Sleeping stat decay invariant', () => {
  // Validates: Requirements 5.3, 7.2, 7.3
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
          const pet = {
            hunger,
            happiness,
            cleanliness,
            energy,
            sleeping: true,
          }
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

// Feature: tamapip, Property 2: Awake stat decay invariant
describe('applyDecay - Property 2: Awake stat decay invariant', () => {
  // Validates: Requirements 7.1, 7.3
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
          const pet = {
            hunger,
            happiness,
            cleanliness,
            energy,
            alive: true,
            sleeping: false,
          }
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
    const pet = {
      energy: 50,
      sleeping: true,
    }
    const result = applySleepRegen(pet)
    expect(result.energy).toBe(51.5)
    expect(result.sleeping).toBe(true)
  })

  it('auto-wakes when energy >= 95', () => {
    const pet = {
      energy: 94,
      sleeping: true,
    }
    const result = applySleepRegen(pet)
    expect(result.energy).toBe(95.5)
    expect(result.sleeping).toBe(false)
  })

  it('returns pet unchanged when not sleeping', () => {
    const pet = {
      energy: 50,
      sleeping: false,
    }
    const result = applySleepRegen(pet)
    expect(result).toBe(pet)
  })
})

// Feature: tamapip, Property 6: Sleep energy regeneration and auto-wake
describe('applySleepRegen - Property 6: Sleep energy regeneration and auto-wake', () => {
  // Validates: Requirements 5.2, 5.4
  it('energy increases by 1.5 (clamped to 100) and sleeping flips to false when energy >= 95', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 100, noNaN: true }),
        (energy) => {
          const pet = { energy, sleeping: true }
          const result = applySleepRegen(pet)
          const expectedEnergy = Math.min(100, energy + 1.5)
          expect(result.energy).toBeCloseTo(expectedEnergy, 10)
          if (expectedEnergy >= 95) {
            expect(result.sleeping).toBe(false)
          } else {
            expect(result.sleeping).toBe(true)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('returns pet unchanged when not sleeping', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 100, noNaN: true }),
        (energy) => {
          const pet = { energy, sleeping: false }
          const result = applySleepRegen(pet)
          expect(result).toBe(pet)
        }
      ),
      { numRuns: 100 }
    )
  })
})

describe('applyHpLogic', () => {
  it('decreases health by 0.5 when avg < 25', () => {
    const pet = {
      hunger: 20,
      happiness: 20,
      cleanliness: 20,
      health: 50,
    }
    const result = applyHpLogic(pet)
    expect(result.health).toBe(49.5)
  })

  it('increases health by 0.3 when avg > 70', () => {
    const pet = {
      hunger: 80,
      happiness: 80,
      cleanliness: 80,
      health: 50,
    }
    const result = applyHpLogic(pet)
    expect(result.health).toBe(50.3)
  })

  it('does not change health when avg is between 25 and 70', () => {
    const pet = {
      hunger: 50,
      happiness: 50,
      cleanliness: 50,
      health: 50,
    }
    const result = applyHpLogic(pet)
    expect(result.health).toBe(50)
  })
})

describe('checkEvolution', () => {
  it('does not evolve at age=4 (still Egg)', () => {
    const pet = {
      age: 4,
      stage: 0,
    }
    const result = checkEvolution(pet)
    expect(result.stage).toBe(0)
  })

  it('evolves to Baby (stage=1) at age=5', () => {
    const pet = {
      age: 5,
      stage: 0,
    }
    const result = checkEvolution(pet)
    expect(result.stage).toBe(1)
  })

  it('evolves to Adult (stage=4) at age=50', () => {
    const pet = {
      age: 50,
      stage: 0,
    }
    const result = checkEvolution(pet)
    expect(result.stage).toBe(4)
  })

  it('does not evolve beyond Adult (stage=4)', () => {
    const pet = {
      age: 100,
      stage: 4,
    }
    const result = checkEvolution(pet)
    expect(result.stage).toBe(4)
  })
})

describe('decrementCooldowns', () => {
  it('decrements each cooldown by 1', () => {
    const cooldowns = {
      feed: 3,
      play: 2,
      clean: 1,
      heal: 5,
    }
    const result = decrementCooldowns(cooldowns)
    expect(result.feed).toBe(2)
    expect(result.play).toBe(1)
    expect(result.clean).toBe(0)
    expect(result.heal).toBe(4)
  })

  it('clamps cooldowns to 0', () => {
    const cooldowns = {
      feed: 0,
      play: 0,
      clean: 0,
      heal: 0,
    }
    const result = decrementCooldowns(cooldowns)
    expect(result.feed).toBe(0)
    expect(result.play).toBe(0)
    expect(result.clean).toBe(0)
    expect(result.heal).toBe(0)
  })
})

describe('mapBattleStats', () => {
  it('produces expected battle stats with specific values', () => {
    const pet = {
      hunger: 85,
      happiness: 75,
      cleanliness: 90,
    }
    const result = mapBattleStats(pet)
    // attack = floor(85/10) + 5 = 8 + 5 = 13
    // defense = floor(90/10) + 5 = 9 + 5 = 14
    // special = floor(75/10) + 5 = 7 + 5 = 12
    expect(result.attack).toBe(13)
    expect(result.defense).toBe(14)
    expect(result.special).toBe(12)
  })

  it('handles minimum values correctly', () => {
    const pet = {
      hunger: 0,
      happiness: 0,
      cleanliness: 0,
    }
    const result = mapBattleStats(pet)
    // attack = floor(0/10) + 5 = 0 + 5 = 5
    // defense = floor(0/10) + 5 = 0 + 5 = 5
    // special = floor(0/10) + 5 = 0 + 5 = 5
    expect(result.attack).toBe(5)
    expect(result.defense).toBe(5)
    expect(result.special).toBe(5)
  })

  it('handles maximum values correctly', () => {
    const pet = {
      hunger: 100,
      happiness: 100,
      cleanliness: 100,
    }
    const result = mapBattleStats(pet)
    // attack = floor(100/10) + 5 = 10 + 5 = 15
    // defense = floor(100/10) + 5 = 10 + 5 = 15
    // special = floor(100/10) + 5 = 10 + 5 = 15
    expect(result.attack).toBe(15)
    expect(result.defense).toBe(15)
    expect(result.special).toBe(15)
  })
})

// Feature: tamapip, Property 7: Sickness HP decay
describe('applyHpLogic - Property 7: Sickness HP decay', () => {
  // Validates: Requirements 9.1
  it('health = max(health - 0.5, 0) when avg care stats < 25', () => {
    fc.assert(
      fc.property(
        fc.record({
          // Generate care stats whose average is < 25.
          // Simplest approach: each stat in [0, 24] guarantees avg < 25.
          hunger:      fc.float({ min: 0, max: 24.99, noNaN: true }),
          happiness:   fc.float({ min: 0, max: 24.99, noNaN: true }),
          cleanliness: fc.float({ min: 0, max: 24.99, noNaN: true }),
          health:      fc.float({ min: 0, max: 100, noNaN: true }),
        }),
        ({ hunger, happiness, cleanliness, health }) => {
          const pet = { hunger, happiness, cleanliness, health }
          const avg = (hunger + happiness + cleanliness) / 3
          // Only test cases where avg is strictly < 25
          fc.pre(avg < 25)
          const result = applyHpLogic(pet)
          expect(result.health).toBeCloseTo(Math.max(health - 0.5, 0), 10)
        }
      ),
      { numRuns: 100 }
    )
  })
})
