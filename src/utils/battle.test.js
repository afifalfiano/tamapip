import { describe, it, expect } from 'vitest'
import { getBattleRank, randomCpuName, BATTLE_RANKS } from './battle'

describe('getBattleRank', () => {
  it('returns null for level 0', () => {
    expect(getBattleRank(0)).toBeNull()
  })

  it('returns ROOKIE at level 1', () => {
    expect(getBattleRank(1).title).toBe('ROOKIE')
  })

  it('returns FIGHTER at level 5', () => {
    expect(getBattleRank(5).title).toBe('FIGHTER')
  })

  it('returns VETERAN at level 10', () => {
    expect(getBattleRank(10).title).toBe('VETERAN')
  })

  it('returns CHAMPION at level 20', () => {
    expect(getBattleRank(20).title).toBe('CHAMPION')
  })

  it('returns LEGEND at level 35', () => {
    expect(getBattleRank(35).title).toBe('LEGEND')
  })

  it('returns highest applicable rank for intermediate levels', () => {
    // level 7 is between FIGHTER(5) and VETERAN(10) → FIGHTER
    expect(getBattleRank(7).title).toBe('FIGHTER')
  })

  it('returns LEGEND for very high levels', () => {
    expect(getBattleRank(99).title).toBe('LEGEND')
  })

  it('every rank has icon and title', () => {
    BATTLE_RANKS.forEach(rank => {
      expect(rank.icon).toBeTruthy()
      expect(rank.title).toBeTruthy()
    })
  })
})

describe('randomCpuName', () => {
  const STAGE_POOLS = {
    2: ['Glitchmon', 'Bugbyte', 'Pixelpup', 'Dataling', 'Nullkit'],
    3: ['Bytebeast', 'Hexfiend', 'Corruptor', 'Virusoid', 'Crasher'],
    4: ['Datademon', 'Nullspawn', 'Voidcore', 'Malwrath', 'Executer'],
  }

  it('returns a name from the correct pool for stage 2', () => {
    for (let i = 0; i < 20; i++) {
      expect(STAGE_POOLS[2]).toContain(randomCpuName(2))
    }
  })

  it('returns a name from the correct pool for stage 3', () => {
    for (let i = 0; i < 20; i++) {
      expect(STAGE_POOLS[3]).toContain(randomCpuName(3))
    }
  })

  it('returns a name from the correct pool for stage 4', () => {
    for (let i = 0; i < 20; i++) {
      expect(STAGE_POOLS[4]).toContain(randomCpuName(4))
    }
  })

  it('falls back to stage 2 pool for unknown stage', () => {
    for (let i = 0; i < 20; i++) {
      expect(STAGE_POOLS[2]).toContain(randomCpuName(99))
    }
  })
})
