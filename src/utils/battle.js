export const BATTLE_RANKS = [
  { minLevel: 1,  title: 'ROOKIE',   icon: '🥉' },
  { minLevel: 5,  title: 'FIGHTER',  icon: '🥈' },
  { minLevel: 10, title: 'VETERAN',  icon: '🥇' },
  { minLevel: 20, title: 'CHAMPION', icon: '🏆' },
  { minLevel: 35, title: 'LEGEND',   icon: '👑' },
]

export function getBattleRank(level) {
  for (let i = BATTLE_RANKS.length - 1; i >= 0; i--) {
    if (level >= BATTLE_RANKS[i].minLevel) return BATTLE_RANKS[i]
  }
  return null
}

const CPU_NAMES = {
  2: ['Glitchmon', 'Bugbyte', 'Pixelpup', 'Dataling', 'Nullkit'],
  3: ['Bytebeast', 'Hexfiend', 'Corruptor', 'Virusoid', 'Crasher'],
  4: ['Datademon', 'Nullspawn', 'Voidcore', 'Malwrath', 'Executer'],
}

export function randomCpuName(stageIdx) {
  const pool = CPU_NAMES[stageIdx] ?? CPU_NAMES[2]
  return pool[Math.floor(Math.random() * pool.length)]
}
