import { useCallback } from 'react'
import { mapBattleStats, addLog } from '../utils/petLogic'
import { getBattleRank, randomCpuName } from '../utils/battle'
import { EXP_PER_LEVEL } from '../constants/game'

export function useBattle({ pet, battleState, setPet, setBattleState, setLogs }) {
  const initBattle = useCallback(() => {
    if (!pet.alive || pet.sleeping || pet.stage < 2 || pet.health <= 0) return
    const battleStats = mapBattleStats(pet)
    const stageIdx = pet.stage
    const cpuHp = 50 + stageIdx * 10
    const newBattleState = {
      cpu: {
        name: randomCpuName(stageIdx),
        hp: cpuHp, maxHp: cpuHp,
        attack: 5 + stageIdx * 2,
        defense: 3 + stageIdx * 2,
        special: 4 + stageIdx * 2,
        healUsed: false,
      },
      player: {
        hp: pet.health, maxHp: pet.health,
        attack: battleStats.attack,
        defense: battleStats.defense,
        special: battleStats.special,
        defending: false,
        specialCooldown: 0,
      },
      isPlayerTurn: true,
      log: [],
    }
    setBattleState(newBattleState)
    setLogs(l => addLog(l, `${pet.name} entered battle against ${newBattleState.cpu.name}!`, 'info'))
  }, [pet])

  const endBattle = useCallback((outcome, finalPlayerHp) => {
    const newHealth = Math.max(0, Math.min(100, finalPlayerHp))
    if (outcome === 'win') {
      setPet(p => {
        const expGain = 5 + p.stage * 2
        const newExp = p.exp + expGain
        const newLevel = Math.floor(newExp / EXP_PER_LEVEL) + 1
        const leveledUp = newLevel > p.level
        const prevRank = getBattleRank(p.level)
        const newRank = getBattleRank(newLevel)
        const rankUp = leveledUp && newRank?.title !== prevRank?.title
        if (rankUp) {
          setTimeout(() => setLogs(l => addLog(l, `${p.name} ranked up to ${newRank.icon} ${newRank.title}!`, 'success')), 50)
        } else if (leveledUp) {
          setTimeout(() => setLogs(l => addLog(l, `${p.name} reached level ${newLevel}!`, 'success')), 50)
        }
        return { ...p, health: newHealth, exp: newExp, level: newLevel }
      })
      setLogs(l => addLog(l, `${pet.name} won the battle! +${5 + pet.stage * 2} EXP`, 'success'))
    } else {
      setPet(p => ({ ...p, health: newHealth }))
      setLogs(l => addLog(l, `${pet.name} lost the battle...`, 'danger'))
    }
    setBattleState(null)
  }, [pet])

  const cpuTurn = useCallback((state) => {
    let { cpu, player } = state
    let logMsg = ''
    const cpuHpRatio = cpu.hp / cpu.maxHp

    if (cpuHpRatio <= 0.3 && !cpu.healUsed) {
      cpu = { ...cpu, hp: Math.min(cpu.maxHp, cpu.hp + 20), healUsed: true }
      logMsg = `${cpu.name} healed for 20 HP!`
    } else if (cpuHpRatio > 0.5) {
      let damage = Math.max(1, cpu.attack - player.defense / 2)
      if (player.defending) damage = Math.max(1, Math.floor(damage * 0.5))
      player = { ...player, hp: Math.max(0, player.hp - damage), defending: false }
      logMsg = `${cpu.name} attacked for ${damage} damage!`
    } else {
      logMsg = `${cpu.name} is defending!`
    }

    const newLog = [...state.log, { message: logMsg, type: 'info' }]
    if (player.hp <= 0) { endBattle('loss', 0); return null }
    return { ...state, cpu, player, isPlayerTurn: true, log: newLog }
  }, [endBattle])

  const handlePlayerAction = useCallback((action) => {
    if (!battleState || !battleState.isPlayerTurn) return
    let { cpu, player, log } = battleState
    let logMsg = ''

    if (player.specialCooldown > 0) {
      player = { ...player, specialCooldown: player.specialCooldown - 1 }
    }

    switch (action) {
      case 'attack': {
        const damage = Math.max(1, player.attack - cpu.defense / 2)
        cpu = { ...cpu, hp: Math.max(0, cpu.hp - damage) }
        logMsg = `${pet.name} attacked for ${damage} damage!`
        break
      }
      case 'defend': {
        player = { ...player, defending: true }
        logMsg = `${pet.name} is defending!`
        break
      }
      case 'special': {
        if (player.specialCooldown > 0) return
        const damage = Math.max(1, Math.floor(player.special * 1.5 - cpu.defense / 2))
        cpu = { ...cpu, hp: Math.max(0, cpu.hp - damage) }
        player = { ...player, specialCooldown: 3 }
        logMsg = `${pet.name} used a special attack for ${damage} damage!`
        break
      }
      case 'heal': {
        player = { ...player, hp: Math.min(player.maxHp, player.hp + 20) }
        logMsg = `${pet.name} healed for 20 HP!`
        break
      }
      default: return
    }

    const newLog = [...log, { message: logMsg, type: 'info' }]
    if (cpu.hp <= 0) { endBattle('win', player.hp); return }

    const stateAfterPlayer = { ...battleState, cpu, player, isPlayerTurn: false, log: newLog }
    const stateAfterCpu = cpuTurn(stateAfterPlayer)
    if (stateAfterCpu !== null) setBattleState(stateAfterCpu)
  }, [battleState, pet, cpuTurn, endBattle])

  return { initBattle, endBattle, handlePlayerAction }
}
