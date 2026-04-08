import {
  DECAY_RATES, STAGE_THRESHOLDS,
  BASE_ATTACK, BASE_DEFENSE, BASE_SPECIAL, EXP_PER_LEVEL,
} from '../constants/game'

export function applyDecay(pet) {
  const multiplier = pet.sleeping ? 0.3 : 1
  const clamp = (v) => Math.min(100, Math.max(0, v))
  return {
    ...pet,
    hunger:      clamp(pet.hunger      - DECAY_RATES.hunger      * multiplier),
    happiness:   clamp(pet.happiness   - DECAY_RATES.happiness   * multiplier),
    cleanliness: clamp(pet.cleanliness - DECAY_RATES.cleanliness * multiplier),
    energy:      clamp(pet.energy      - DECAY_RATES.energy      * multiplier),
  }
}

export function applySleepRegen(pet) {
  if (!pet.sleeping) return pet
  const newEnergy = Math.min(100, pet.energy + 1.5)
  return { ...pet, energy: newEnergy, sleeping: newEnergy >= 95 ? false : true }
}

export function applyHpLogic(pet) {
  const avg = (pet.hunger + pet.happiness + pet.cleanliness) / 3
  if (avg < 25) return { ...pet, health: Math.max(0, pet.health - 0.5) }
  if (avg > 70) return { ...pet, health: Math.min(100, pet.health + 0.3) }
  return pet
}

export function checkEvolution(pet) {
  if (pet.stage >= 4) return pet
  let newStage = pet.stage
  for (let i = STAGE_THRESHOLDS.length - 1; i >= 0; i--) {
    if (pet.age >= STAGE_THRESHOLDS[i]) { newStage = i; break }
  }
  return newStage > pet.stage ? { ...pet, stage: newStage } : pet
}

export function decrementCooldowns(cooldowns) {
  return {
    feed:  Math.max(0, cooldowns.feed  - 1),
    play:  Math.max(0, cooldowns.play  - 1),
    clean: Math.max(0, cooldowns.clean - 1),
    heal:  Math.max(0, cooldowns.heal  - 1),
  }
}

export function mapBattleStats(pet) {
  const lvBonus = Math.floor((pet.level ?? 1) / 2)
  return {
    attack:  Math.floor(pet.hunger      / 10) + BASE_ATTACK  + lvBonus,
    defense: Math.floor(pet.cleanliness / 10) + BASE_DEFENSE + lvBonus,
    special: Math.floor(pet.happiness   / 10) + BASE_SPECIAL + lvBonus,
  }
}

export function addLog(logs, message, type = 'info') {
  const entry = {
    id: Date.now() + Math.random(),
    timestamp: new Date().toLocaleTimeString(),
    message,
    type,
  }
  return [entry, ...logs].slice(0, 30)
}

export function applyExpGain(pet, stageIdx) {
  const expGain = 5 + stageIdx * 2
  const newExp = pet.exp + expGain
  const newLevel = Math.floor(newExp / EXP_PER_LEVEL) + 1
  return { ...pet, exp: newExp, level: newLevel, expGain, leveledUp: newLevel > pet.level }
}
