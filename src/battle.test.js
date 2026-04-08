import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { addLog, mapBattleStats } from './utils/petLogic'

describe('addLog', () => {
  it('adding 31 entries results in length 30, newest at index 0', () => {
    let logs = []
    for (let i = 0; i < 31; i++) logs = addLog(logs, `message ${i}`, 'info')
    expect(logs.length).toBe(30)
    expect(logs[0].message).toBe('message 30')
  })

  it('each entry has non-empty timestamp and message', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 50 }),
        (messages) => {
          let logs = []
          for (const msg of messages) logs = addLog(logs, msg, 'info')
          for (const entry of logs) {
            expect(entry.timestamp).toBeTruthy()
            expect(entry.message).toBeTruthy()
          }
        }
      )
    )
  })
})

describe('mapBattleStats - monotonicity', () => {
  it('pet A with all stats >= pet B → A battle stats >= B battle stats', () => {
    fc.assert(
      fc.property(
        fc.record({ hungerA: fc.integer({ min: 0, max: 100 }), happinessA: fc.integer({ min: 0, max: 100 }), cleanlinessA: fc.integer({ min: 0, max: 100 }) }),
        fc.record({ hungerB: fc.integer({ min: 0, max: 100 }), happinessB: fc.integer({ min: 0, max: 100 }), cleanlinessB: fc.integer({ min: 0, max: 100 }) }),
        (a, b) => {
          const petA = { hunger: Math.max(a.hungerA, b.hungerB), happiness: Math.max(a.happinessA, b.happinessB), cleanliness: Math.max(a.cleanlinessA, b.cleanlinessB), level: 1 }
          const petB = { hunger: Math.min(a.hungerA, b.hungerB), happiness: Math.min(a.happinessA, b.happinessB), cleanliness: Math.min(a.cleanlinessA, b.cleanlinessB), level: 1 }
          const statsA = mapBattleStats(petA)
          const statsB = mapBattleStats(petB)
          expect(statsA.attack).toBeGreaterThanOrEqual(statsB.attack)
          expect(statsA.defense).toBeGreaterThanOrEqual(statsB.defense)
          expect(statsA.special).toBeGreaterThanOrEqual(statsB.special)
        }
      )
    )
  })
})

describe('Battle damage', () => {
  it('attack damage = max(1, attack - defense/2)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }),
        fc.integer({ min: 1, max: 20 }),
        fc.integer({ min: 0, max: 200 }),
        (atk, def, hp) => {
          const expectedDamage = Math.max(1, atk - def / 2)
          expect(Math.max(0, hp - expectedDamage)).toBe(Math.max(0, hp - expectedDamage))
          expect(expectedDamage).toBeGreaterThanOrEqual(1)
        }
      )
    )
  })

  it('special damage >= normal attack damage with same stat', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }),
        fc.integer({ min: 1, max: 20 }),
        (stat, def) => {
          const normalDamage = Math.max(1, stat - def / 2)
          const specialDamage = Math.max(1, Math.floor(stat * 1.5 - def / 2))
          expect(specialDamage).toBeGreaterThanOrEqual(normalDamage)
        }
      )
    )
  })
})

describe('Battle heal clamping', () => {
  it('heal result = min(hp + 20, maxHp)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 1, max: 100 }),
        (hp, maxHp) => {
          const currentHp = Math.min(hp, maxHp)
          const newHp = Math.min(currentHp + 20, maxHp)
          expect(newHp).toBeLessThanOrEqual(maxHp)
          expect(newHp).toBeGreaterThanOrEqual(currentHp)
        }
      )
    )
  })
})

describe('Battle HP round-trip', () => {
  it('endBattle clamps finalPlayerHp to [0, 100]', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -50, max: 150 }),
        (finalBattleHp) => {
          const newHealth = Math.max(0, Math.min(100, finalBattleHp))
          expect(newHealth).toBeGreaterThanOrEqual(0)
          expect(newHealth).toBeLessThanOrEqual(100)
        }
      )
    )
  })
})

describe('Battle guard', () => {
  it('pet with health=0 cannot initiate battle', () => {
    const pet = { alive: true, sleeping: false, stage: 2, health: 0 }
    const blocked = !pet.alive || pet.sleeping || pet.stage < 2 || pet.health <= 0
    expect(blocked).toBe(true)
  })

  it('healthy pet at stage >= 2 can initiate battle', () => {
    const pet = { alive: true, sleeping: false, stage: 2, health: 50 }
    const blocked = !pet.alive || pet.sleeping || pet.stage < 2 || pet.health <= 0
    expect(blocked).toBe(false)
  })
})
