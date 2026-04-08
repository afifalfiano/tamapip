import { describe, it, expect, beforeEach } from 'vitest'
import { loadSave, writeSave, clearSave } from './storage'

// jsdom provides localStorage — clear it before each test
beforeEach(() => localStorage.clear())

describe('loadSave', () => {
  it('returns null when nothing is saved', () => {
    expect(loadSave()).toBeNull()
  })

  it('returns parsed save data after writeSave', () => {
    const pet = { name: 'Mochi', health: 100 }
    const cooldowns = { feed: 0, play: 0, clean: 0, heal: 0 }
    const logs = [{ id: 1, message: 'hello', type: 'info' }]
    writeSave(pet, cooldowns, logs)
    const result = loadSave()
    expect(result.pet).toEqual(pet)
    expect(result.cooldowns).toEqual(cooldowns)
    expect(result.logs).toEqual(logs)
  })

  it('returns null when localStorage contains invalid JSON', () => {
    localStorage.setItem('tamtampip_save', 'not-json{{{')
    expect(loadSave()).toBeNull()
  })
})

describe('writeSave', () => {
  it('persists data that can be retrieved by loadSave', () => {
    const pet = { name: 'Boba', stage: 2, level: 3 }
    writeSave(pet, {}, [])
    expect(loadSave().pet).toEqual(pet)
  })

  it('overwrites previous save', () => {
    writeSave({ name: 'Old' }, {}, [])
    writeSave({ name: 'New' }, {}, [])
    expect(loadSave().pet.name).toBe('New')
  })
})

describe('clearSave', () => {
  it('removes saved data so loadSave returns null', () => {
    writeSave({ name: 'Pippin' }, {}, [])
    clearSave()
    expect(loadSave()).toBeNull()
  })

  it('does not throw when nothing is saved', () => {
    expect(() => clearSave()).not.toThrow()
  })
})
