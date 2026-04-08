// TamTamPip - Tamagotchi-inspired virtual pet
// Single-file React component with all game state managed via hooks

import { useState, useEffect, useRef, useCallback } from 'react'

// ─── Constants ───────────────────────────────────────────────────────────────

export const STAGES = ['Egg', 'Baby', 'Child', 'Teen', 'Adult']
export const STAGE_THRESHOLDS = [0, 1, 6, 24, 72]

export const PET_NAMES = [
  'Pippin', 'Mochi', 'Biscuit', 'Noodle', 'Pudding',
  'Waffles', 'Sprout', 'Dango', 'Pebble', 'Tofu',
  'Boba', 'Dumpling',
]

export const DECAY_RATES = {
  hunger: 0.05,
  happiness: 0.04,
  cleanliness: 0.03,
  energy: 0.025,
}

export const COOLDOWN_TICKS = {
  feed: 3,
  play: 3,
  clean: 3,
  heal: 5,
}

export const DEFAULT_COOLDOWNS = {
  feed: 0,
  play: 0,
  clean: 0,
  heal: 0,
}

// Base battle stats added on top of care-stat-derived values
export const BASE_ATTACK = 5
export const BASE_DEFENSE = 5
export const BASE_SPECIAL = 5

// EXP needed to reach each level (level 1 = 0 exp, level 2 = 10, etc.)
export const EXP_PER_LEVEL = 10

// Battle rank titles unlocked at level milestones
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

/** Returns a fresh PetState object with all default values. */
export function DEFAULT_PET() {
  const name = PET_NAMES[Math.floor(Math.random() * PET_NAMES.length)]
  return {
    name,
    age: 0,
    hunger: 80,
    happiness: 80,
    cleanliness: 90,
    energy: 100,
    health: 100,
    alive: true,
    poops: 0,
    sleeping: false,
    birthTime: Date.now(),
    stage: 0,
    level: 1,
    exp: 0,
  }
}

// ─── Pure Helper Functions ────────────────────────────────────────────────────

/**
 * Applies per-tick stat decay to a pet.
 * If sleeping, each decay rate is multiplied by 0.3.
 * All stats are clamped to [0, 100].
 * Returns a new pet object (pure function).
 */
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

/**
 * Applies sleep energy regeneration to a pet.
 * If sleeping: energy += 1.5, clamped to 100.
 * If energy >= 95 after regen, set sleeping=false (auto-wake).
 * If not sleeping, returns pet unchanged.
 * Returns a new pet object (pure function).
 */
export function applySleepRegen(pet) {
  if (!pet.sleeping) return pet
  const newEnergy = Math.min(100, pet.energy + 1.5)
  return {
    ...pet,
    energy: newEnergy,
    sleeping: newEnergy >= 95 ? false : true,
  }
}

/**
 * Applies HP logic based on average care stats.
 * avg = (hunger + happiness + cleanliness) / 3
 * If avg < 25: health -= 0.5, clamped to 0 (sickness decay)
 * If avg > 70: health += 0.3, clamped to 100 (regen when well-cared)
 * Otherwise: no change to health.
 * Returns a new pet object (pure function).
 */
export function applyHpLogic(pet) {
  const avg = (pet.hunger + pet.happiness + pet.cleanliness) / 3
  if (avg < 25) {
    return { ...pet, health: Math.max(0, pet.health - 0.5) }
  }
  if (avg > 70) {
    return { ...pet, health: Math.min(100, pet.health + 0.3) }
  }
  return pet
}

/**
 * Checks whether the pet should evolve based on its age.
 * Finds the highest stage index where pet.age >= STAGE_THRESHOLDS[stageIndex].
 * If that index > pet.stage, returns a new pet with stage updated.
 * No-op if pet is already Adult (stage index 4) or no threshold is crossed.
 * Returns a new pet object (pure function).
 */
export function checkEvolution(pet) {
  if (pet.stage >= 4) return pet
  let newStage = pet.stage
  for (let i = STAGE_THRESHOLDS.length - 1; i >= 0; i--) {
    if (pet.age >= STAGE_THRESHOLDS[i]) {
      newStage = i
      break
    }
  }
  if (newStage > pet.stage) {
    return { ...pet, stage: newStage }
  }
  return pet
}

/**
 * Decrements each cooldown by 1, clamped to a minimum of 0.
 * Returns a new cooldowns object (pure function).
 */
export function decrementCooldowns(cooldowns) {
  return {
    feed:  Math.max(0, cooldowns.feed  - 1),
    play:  Math.max(0, cooldowns.play  - 1),
    clean: Math.max(0, cooldowns.clean - 1),
    heal:  Math.max(0, cooldowns.heal  - 1),
  }
}

/**
 * Maps a pet's care stats to battle stats.
 * attack  = Math.floor(hunger / 10)      + BASE_ATTACK
 * defense = Math.floor(cleanliness / 10) + BASE_DEFENSE
 * special = Math.floor(happiness / 10)   + BASE_SPECIAL
 */
export function mapBattleStats(pet) {
  const lvBonus = Math.floor((pet.level ?? 1) / 2)
  return {
    attack:  Math.floor(pet.hunger      / 10) + BASE_ATTACK  + lvBonus,
    defense: Math.floor(pet.cleanliness / 10) + BASE_DEFENSE + lvBonus,
    special: Math.floor(pet.happiness   / 10) + BASE_SPECIAL + lvBonus,
  }
}

// ─── Event Log Helper ─────────────────────────────────────────────────────────

/**
 * Pure function. Prepends a new log entry to the logs array and slices to 30.
 * @param {Array} logs - existing log entries
 * @param {string} message - log message
 * @param {string} type - 'info' | 'warning' | 'danger' | 'success'
 * @returns {Array} new logs array with entry prepended, max 30 entries
 */
export function addLog(logs, message, type = 'info') {
  const entry = {
    id: Date.now() + Math.random(),
    timestamp: new Date().toLocaleTimeString(),
    message,
    type,
  }
  return [entry, ...logs].slice(0, 30)
}

// ─── Presentational Sub-Components ──────────────────────────────────────────

const px = "'Press Start 2P', monospace"

/**
 * StatBar — segmented retro stat bar with glow on warning.
 */
export function StatBar({ label, icon, value, warning }) {
  const pct = Math.max(0, Math.min(100, value))
  const fillColor = pct > 60 ? '#4ade80' : pct > 30 ? '#facc15' : '#f87171'
  const segments = 20
  const filled = Math.round((pct / 100) * segments)
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <span style={{ fontFamily: px, fontSize: '7px', color: warning ? fillColor : '#86efac', letterSpacing: '1px' }}>
          {icon} {label}
        </span>
        <span style={{ fontFamily: px, fontSize: '7px', color: fillColor }}>
          {Math.floor(pct)}
        </span>
      </div>
      <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: '7px',
              backgroundColor: i < filled ? fillColor : '#1f2937',
              boxShadow: 'none',
              transition: 'background-color 0.3s',
            }}
          />
        ))}
      </div>
    </div>
  )
}

/**
 * ActionButton — chunky retro button with glow on hover and cooldown badge.
 */
export function ActionButton({ label, icon, disabled, cooldown, onClick }) {
  const isDisabled = disabled || cooldown > 0
  return (
    <button
      onClick={isDisabled ? undefined : onClick}
      disabled={isDisabled}
      style={{
        fontFamily: px,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px 6px 6px',
        minWidth: '62px',
        border: isDisabled ? '2px solid #374151' : '2px solid #4ade80',
        background: isDisabled ? '#0d0d0d' : '#0a1a0a',
        color: isDisabled ? '#374151' : '#4ade80',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.45 : 1,
        boxShadow: 'none',
        transition: 'background 0.15s',
        position: 'relative',
      }}
      onMouseEnter={e => { if (!isDisabled) e.currentTarget.style.background = '#0f2a0f' }}
      onMouseLeave={e => { if (!isDisabled) e.currentTarget.style.background = '#0a1a0a' }}
    >
      <span style={{ fontSize: '18px', lineHeight: 1 }}>{icon}</span>
      {cooldown > 0 && (
        <span style={{
          position: 'absolute', top: '2px', right: '4px',
          fontSize: '7px', color: '#facc15',
        }}>{cooldown}</span>
      )}
      <span style={{ fontSize: '6px', marginTop: '5px', letterSpacing: '0.5px' }}>{label}</span>
    </button>
  )
}

/**
 * LogEntry — compact log line with type glow.
 */
export function LogEntry({ timestamp, message, type }) {
  const colors = { info: '#4ade80', warning: '#facc15', danger: '#f87171', success: '#34d399' }
  const color = colors[type] ?? '#4ade80'
  return (
    <div style={{ display: 'flex', gap: '8px', lineHeight: '1.6', fontSize: '9px' }}>
      <span style={{ color: '#4b5563', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>{timestamp}</span>
      <span style={{ color, fontFamily: 'monospace' }}>{message}</span>
    </div>
  )
}

function battleHpColor(hp, max) {
  const r = hp / max
  return r > 0.5 ? '#4ade80' : r > 0.25 ? '#facc15' : '#f87171'
}

function PetPanel({ name, battle, side }) {
  const hpColor = battleHpColor(battle.hp, battle.maxHp)
  const hpPct = Math.max(0, (battle.hp / battle.maxHp) * 100)
  return (
    <div style={{
      flex: 1,
      border: `2px solid ${side === 'player' ? '#4ade80' : '#f87171'}`,
      background: '#050f05',
      padding: '10px',
      boxShadow: 'none',
    }}>
      <div style={{ fontFamily: px, fontSize: '7px', color: side === 'player' ? '#4ade80' : '#f87171', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {side === 'player' ? '▶ ' : '◀ '}{name}
      </div>
      <div style={{ marginBottom: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: px, fontSize: '6px', color: hpColor, marginBottom: '3px' }}>
          <span>HP</span><span>{Math.floor(battle.hp)}/{battle.maxHp}</span>
        </div>
        <div style={{ background: '#1f2937', height: '6px', border: '1px solid #374151' }}>
          <div style={{ width: `${hpPct}%`, height: '100%', background: hpColor, transition: 'width 0.3s' }} />
        </div>
      </div>
      <div style={{ fontFamily: px, fontSize: '6px', color: '#6b7280', letterSpacing: '1px' }}>
        ATK {battle.attack} · DEF {battle.defense} · SPC {battle.special}
      </div>
    </div>
  )
}

/**
 * BattleScreen — polished retro battle UI.
 */
export function BattleScreen({ playerPet, playerBattle, cpuBattle, isPlayerTurn, battleLog, onAction }) {
  const actions = [
    { key: 'attack',  icon: '⚔️', label: 'Attack',  cooldown: 0 },
    { key: 'defend',  icon: '🛡️', label: 'Defend',  cooldown: 0 },
    { key: 'special', icon: '✨', label: 'Special', cooldown: playerBattle?.specialCooldown ?? 0 },
    { key: 'heal',    icon: '💊', label: 'Heal',    cooldown: 0 },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', gap: '8px' }}>
        <PetPanel name={playerPet?.name ?? 'You'} battle={playerBattle} side="player" />
        <PetPanel name={cpuBattle?.name ?? 'CPU'} battle={cpuBattle} side="cpu" />
      </div>
      <div style={{ textAlign: 'center', fontFamily: px, fontSize: '7px', color: isPlayerTurn ? '#4ade80' : '#facc15', letterSpacing: '2px' }}>
        {isPlayerTurn ? '▶ YOUR TURN' : '⏳ ENEMY TURN...'}
      </div>
      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
        {actions.map(({ key, icon, label, cooldown }) => (
          <ActionButton key={key} icon={icon} label={label} disabled={!isPlayerTurn} cooldown={cooldown} onClick={() => onAction(key)} />
        ))}
      </div>
      <div style={{ border: '1px solid #14532d', background: '#020a02', padding: '8px', maxHeight: '110px', overflowY: 'auto' }}>
        {battleLog.length === 0
          ? <span style={{ fontFamily: 'monospace', fontSize: '9px', color: '#374151' }}>— battle started —</span>
          : battleLog.map((e, i) => <LogEntry key={i} timestamp="" message={e.message} type={e.type ?? 'info'} />)
        }
      </div>
    </div>
  )
}

// CPU opponent pool per stage (Child, Teen, Adult)
const CPU_NAMES = {
  2: ['Glitchmon', 'Bugbyte', 'Pixelpup', 'Dataling', 'Nullkit'],
  3: ['Bytebeast', 'Hexfiend', 'Corruptor', 'Virusoid', 'Crasher'],
  4: ['Datademon', 'Nullspawn', 'Voidcore', 'Malwrath', 'Executer'],
}
function randomCpuName(stageIdx) {
  const pool = CPU_NAMES[stageIdx] ?? CPU_NAMES[2]
  return pool[Math.floor(Math.random() * pool.length)]
}

// ─── Sprite Map ───────────────────────────────────────────────────────────────

// Each sprite key has an array of frames (each frame = array of lines)
const SPRITES = {
  egg: [
    [
      '   _____   ',
      '  /     \\  ',
      ' | o   o | ',
      ' |   ^   | ',
      '  \\_____/  ',
    ],
    [
      '   _____   ',
      '  /     \\  ',
      ' | o   o | ',
      ' |  ~~~  | ',
      '  \\_____/  ',
    ],
  ],
  baby: [
    [
      '  (^‿^)  ',
      ' ╔═╧═╧═╗ ',
      ' ║ ╰╯  ║ ',
      ' ╚══╧══╝ ',
      '   ╙ ╙   ',
    ],
    [
      '  (^‿^)  ',
      ' ╔═╧═╧═╗ ',
      ' ║ ╰╯  ║ ',
      ' ╚══╧══╝ ',
      '  ╙   ╙  ',
    ],
  ],
  child: [
    [
      '  ╭─────╮  ',
      '  │ ◕ ◕ │  ',
      '  │  ▽  │  ',
      '  ╰──┬──╯  ',
      ' ╱╲  │  ╱╲ ',
    ],
    [
      '  ╭─────╮  ',
      '  │ ◕ ◕ │  ',
      '  │  ▽  │  ',
      '  ╰──┬──╯  ',
      '  ╱  │  ╲  ',
    ],
  ],
  teen: [
    [
      '  ╭─────╮  ',
      '  │ ◑ ◑ │  ',
      '  │  ω  │  ',
      '  ╰──┬──╯  ',
      ' ╱╲  │  ╱╲ ',
    ],
    [
      '  ╭─────╮  ',
      '  │ ◑ ◑ │  ',
      '  │  ω  │  ',
      '  ╰──┬──╯  ',
      '  ╱  │  ╲  ',
    ],
  ],
  adult: [
    [
      '  ╭─────╮  ',
      '  │ ★ ★ │  ',
      '  │  ◡  │  ',
      '  ╰──┬──╯  ',
      ' ╱╲  │  ╱╲ ',
    ],
    [
      '  ╭─────╮  ',
      '  │ ★ ★ │  ',
      '  │  ◡  │  ',
      '  ╰──┬──╯  ',
      '  ╱  │  ╲  ',
    ],
  ],
  eat: [
    [
      '  ╭─────╮  ',
      '  │ ^‿^ │  ',
      '  │ nom! │  ',
      '  ╰──┬──╯  ',
      '     │     ',
    ],
    [
      '  ╭─────╮  ',
      '  │ ^▿^ │  ',
      '  │ nom! │  ',
      '  ╰──┬──╯  ',
      '     │     ',
    ],
  ],
  play: [
    [
      '  ╭─────╮  ',
      '  │ ◕‿◕ │  ',
      ' ╱╰──┬──╯╲ ',
      '╱    │    ╲',
      '     │     ',
    ],
    [
      '  ╭─────╮  ',
      '  │ ◕‿◕ │  ',
      ' ╱╰──┬──╯  ',
      '╱    │     ',
      '     │     ',
    ],
  ],
  sleep: [
    [
      '  ╭─────╮  ',
      '  │ -‿- │  ',
      '  ╰──┬──╯  ',
      '     │  ᶻ  ',
      '     │     ',
    ],
    [
      '  ╭─────╮  ',
      '  │ -‿- │  ',
      '  ╰──┬──╯  ',
      '     │   ᶻ ',
      '     │  ᶻ  ',
    ],
  ],
  sick: [
    [
      '  ╭─────╮  ',
      '  │ x‿x │  ',
      '  │ ~~~  │  ',
      '  ╰──┬──╯  ',
      '     │     ',
    ],
    [
      '  ╭─────╮  ',
      '  │ x_x │  ',
      '  │ ~~~  │  ',
      '  ╰──┬──╯  ',
      '     │     ',
    ],
  ],
  grumpy: [
    [
      '  ╭─────╮  ',
      '  │ >︿< │  ',
      '  │  ¬  │  ',
      '  ╰──┬──╯  ',
      ' ╱╲  │  ╱╲ ',
    ],
    [
      '  ╭─────╮  ',
      '  │ >_< │  ',
      '  │  ¬  │  ',
      '  ╰──┬──╯  ',
      '  ╱  │  ╲  ',
    ],
  ],
  dance: [
    [
      '  ╭─────╮  ',
      '  │ ★‿★ │  ',
      ' ╱╰──┬──╯╲ ',
      '     │    ╲',
      '  ╱  │     ',
    ],
    [
      '  ╭─────╮  ',
      '  │ ★‿★ │  ',
      ' ╱╰──┬──╯╲ ',
      '╱    │     ',
      '     │  ╲  ',
    ],
  ],
  sneeze: [
    [
      '  ╭─────╮  ',
      '  │ x‿x │  ',
      '  │ achoo│  ',
      '  ╰──┬──╯  ',
      '     │     ',
    ],
    [
      '  ╭─────╮  ',
      '  │ ^‿^ │  ',
      '  │ ~~~  │  ',
      '  ╰──┬──╯  ',
      '     │     ',
    ],
  ],
}

// ─── Component ───────────────────────────────────────────────────────────────

const STORAGE_KEY = 'tamapip_save'

function loadSave() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch { return null }
}

function writeSave(pet, cooldowns, logs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ pet, cooldowns, logs }))
  } catch { /* storage unavailable */ }
}

function clearSave() {
  localStorage.removeItem(STORAGE_KEY)
}

export default function Tamagotchi() {
  const save = loadSave()

  const [pet, setPet] = useState(() => save?.pet ?? null)
  const [cooldowns, setCooldowns] = useState(() => save?.cooldowns ?? DEFAULT_COOLDOWNS)
  const [logs, setLogs] = useState(() => save?.logs ?? [])
  const [battleState, setBattleState] = useState(null)
  const [animation, setAnimation] = useState(null)
  const [gameKey, setGameKey] = useState(0)
  const [showHelp, setShowHelp] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [frame, setFrame] = useState(0)
  const [petX, setPetX] = useState(50)         // % horizontal position in viewport
  const [clickReaction, setClickReaction] = useState(null) // '!' bubble text
  const [isNudging, setIsNudging] = useState(false)        // bounce on click
  const clickCountRef = useRef(0)
  const clickTimerRef = useRef(null)
  const lastHappyDanceRef = useRef(0)

  const handleFeed = useCallback(() => {
    if (!pet.alive || pet.sleeping || cooldowns.feed !== 0 || pet.health < 30) return
    setPet(p => ({ ...p, hunger: Math.min(100, p.hunger + 25) }))
    setCooldowns(c => ({ ...c, feed: COOLDOWN_TICKS.feed }))
    setLogs(l => addLog(l, `${pet.name} was fed!`, 'success'))
    setAnimation('eat')
    setTimeout(() => setAnimation(null), 1000)
  }, [pet, cooldowns.feed])

  const handlePlay = useCallback(() => {
    if (!pet.alive || pet.sleeping || cooldowns.play !== 0 || pet.energy < 15 || pet.health < 30) return
    setPet(p => ({
      ...p,
      happiness: Math.min(100, p.happiness + 30),
      energy: Math.max(0, p.energy - 15),
    }))
    setCooldowns(c => ({ ...c, play: COOLDOWN_TICKS.play }))
    setLogs(l => addLog(l, `${pet.name} played!`, 'success'))
    setAnimation('play')
    setTimeout(() => setAnimation(null), 1000)
  }, [pet, cooldowns.play])

  const handleClean = useCallback(() => {
    if (!pet.alive || pet.sleeping || cooldowns.clean !== 0 || pet.health < 30) return
    setPet(p => ({ ...p, cleanliness: Math.min(100, p.cleanliness + 35), poops: 0 }))
    setCooldowns(c => ({ ...c, clean: COOLDOWN_TICKS.clean }))
    setLogs(l => addLog(l, `${pet.name} was cleaned!`, 'success'))
  }, [pet, cooldowns.clean])

  const handleMedicine = useCallback(() => {
    if (!pet.alive || cooldowns.heal !== 0) return
    setPet(p => ({ ...p, health: Math.min(100, p.health + 30) }))
    setCooldowns(c => ({ ...c, heal: COOLDOWN_TICKS.heal }))
    setLogs(l => addLog(l, `${pet.name} took medicine!`, 'info'))
  }, [pet, cooldowns.heal])

  const handleSleep = useCallback(() => {
    if (!pet.alive || pet.sleeping) return
    setPet(p => ({ ...p, sleeping: true }))
    setLogs(l => addLog(l, `${pet.name} went to sleep.`, 'info'))
    setAnimation('sleep')
    setTimeout(() => setAnimation(null), 1000)
  }, [pet])

  // ─── Restart Handler ─────────────────────────────────────────────────────────

  /**
   * Resets all game state to defaults and restarts the game loop.
   * Increments gameKey to trigger the game loop useEffect to re-run.
   */
  const handleRestart = useCallback(() => {
    clearSave()
    setPet(null)
    setCooldowns(DEFAULT_COOLDOWNS)
    setBattleState(null)
    setLogs([])
    setNameInput('')
    tickCountRef.current = 0
    setGameKey(k => k + 1)
  }, [])

  // ─── Battle Handlers ─────────────────────────────────────────────────────────

  /**
   * Initializes a battle against a CPU opponent scaled to the pet's stage.
   * Guards: pet alive, not sleeping, stage >= 2 (Child), health > 0.
   */
  const initBattle = useCallback(() => {
    if (!pet.alive || pet.sleeping || pet.stage < 2 || pet.health <= 0) return
    const battleStats = mapBattleStats(pet)
    const stageIdx = pet.stage // 2=Child, 3=Teen, 4=Adult
    const cpuHp = 50 + stageIdx * 10
    const newBattleState = {
      cpu: {
        name: randomCpuName(stageIdx),
        hp: cpuHp,
        maxHp: cpuHp,
        attack: 5 + stageIdx * 2,
        defense: 3 + stageIdx * 2,
        special: 4 + stageIdx * 2,
        healUsed: false,
      },
      player: {
        hp: pet.health,
        maxHp: pet.health,
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

  /**
   * Ends the current battle with the given outcome ('win' | 'loss').
   * Updates pet.health to reflect final battle HP, logs the result, clears battleState.
   */
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

  /**
   * Executes the CPU's turn using a simple AI strategy.
   * - hp > 50% maxHp → attack
   * - hp <= 30% maxHp and heal not used → heal
   * - else → defend
   * Applies damage to player (with defend reduction), checks for player death.
   */
  const cpuTurn = useCallback((state) => {
    let { cpu, player } = state
    let logMsg = ''

    const cpuHpRatio = cpu.hp / cpu.maxHp

    if (cpuHpRatio <= 0.3 && !cpu.healUsed) {
      // CPU heals
      const healAmount = 20
      cpu = { ...cpu, hp: Math.min(cpu.maxHp, cpu.hp + healAmount), healUsed: true }
      logMsg = `${cpu.name} healed for ${healAmount} HP!`
    } else if (cpuHpRatio > 0.5) {
      // CPU attacks
      let damage = Math.max(1, cpu.attack - player.defense / 2)
      if (player.defending) {
        damage = Math.max(1, Math.floor(damage * 0.5))
      }
      player = { ...player, hp: Math.max(0, player.hp - damage), defending: false }
      logMsg = `${cpu.name} attacked for ${damage} damage!`
    } else {
      // CPU defends
      logMsg = `${cpu.name} is defending!`
    }

    const newLog = [...state.log, { message: logMsg, type: 'info' }]

    if (player.hp <= 0) {
      // Player loses — end battle immediately
      endBattle('loss', 0)
      return null
    }

    return {
      ...state,
      cpu,
      player,
      isPlayerTurn: true,
      log: newLog,
    }
  }, [endBattle])

  /**
   * Handles a player battle action: 'attack' | 'defend' | 'special' | 'heal'.
   * Guards: battleState exists, isPlayerTurn=true.
   */
  const handlePlayerAction = useCallback((action) => {
    if (!battleState || !battleState.isPlayerTurn) return

    let { cpu, player, log } = battleState
    let logMsg = ''

    // Decrement special cooldown each player turn
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
      default:
        return
    }

    const newLog = [...log, { message: logMsg, type: 'info' }]

    // Check if CPU is defeated
    if (cpu.hp <= 0) {
      endBattle('win', player.hp)
      return
    }

    // Trigger CPU turn
    const stateAfterPlayer = { ...battleState, cpu, player, isPlayerTurn: false, log: newLog }
    const stateAfterCpu = cpuTurn(stateAfterPlayer)
    if (stateAfterCpu !== null) {
      setBattleState(stateAfterCpu)
    }
  }, [battleState, pet, cpuTurn, endBattle])

  // ─── Frame ticker for idle animation ─────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => setFrame(f => f ^ 1), 600)
    return () => clearInterval(id)
  }, [])

  // ─── Wander: pet moves left/right, flees poop ────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      if (!pet || !pet.alive || pet.sleeping) return
      setPetX(x => {
        // flee to opposite side if 3+ poops
        if (pet.poops >= 3) return x > 50 ? 20 : 80
        const delta = (Math.random() - 0.5) * 30
        return Math.min(75, Math.max(25, x + delta))
      })
    }, 2500)
    return () => clearInterval(id)
  }, [pet?.alive, pet?.sleeping, pet?.poops])

  // ─── Spontaneous happy dance when all stats > 80 ─────────────────────────────
  useEffect(() => {
    if (!pet || !pet.alive || pet.sleeping) return
    const allHappy = pet.hunger > 80 && pet.happiness > 80 && pet.cleanliness > 80 && pet.energy > 80
    if (!allHappy) return
    const now = Date.now()
    if (now - lastHappyDanceRef.current < 30000) return // max once per 30s
    lastHappyDanceRef.current = now
    setAnimation('dance')
    setClickReaction('♪')
    setTimeout(() => { setAnimation(null); setClickReaction(null) }, 2000)
  }, [pet?.hunger, pet?.happiness, pet?.cleanliness, pet?.energy])

  // ─── Random sneeze when sick ──────────────────────────────────────────────────
  useEffect(() => {
    if (!pet || !pet.alive || pet.health >= 30) return
    const id = setInterval(() => {
      if (Math.random() < 0.15) {
        setAnimation('sneeze')
        setClickReaction('achoo!')
        setTimeout(() => { setAnimation(null); setClickReaction(null) }, 1200)
      }
    }, 8000)
    return () => clearInterval(id)
  }, [pet?.health, pet?.alive])

  // ─── Click reaction ───────────────────────────────────────────────────────────
  const handlePetClick = useCallback(() => {
    if (!pet || !pet.alive || pet.sleeping) return

    // track rapid clicks for grumpy reaction
    clickCountRef.current += 1
    clearTimeout(clickTimerRef.current)
    clickTimerRef.current = setTimeout(() => { clickCountRef.current = 0 }, 1000)

    if (clickCountRef.current >= 4) {
      clickCountRef.current = 0
      setAnimation('grumpy')
      setClickReaction('(╯°□°）╯')
      setIsNudging(false)
      setTimeout(() => { setAnimation(null); setClickReaction(null) }, 1500)
      return
    }

    const avg = (pet.hunger + pet.happiness + pet.cleanliness) / 3
    const msg = avg > 70 ? '♥' : avg > 40 ? '!' : '...'
    setClickReaction(msg)
    setIsNudging(true)
    setTimeout(() => { setClickReaction(null); setIsNudging(false) }, 800)
  }, [pet])

  // ─── Persist to localStorage ─────────────────────────────────────────────────
  useEffect(() => {
    if (pet) writeSave(pet, cooldowns, logs)
  }, [pet, cooldowns, logs])

  // ─── Start new game with name ─────────────────────────────────────────────────
  const handleStartGame = useCallback((inputName) => {
    const name = inputName.trim() || PET_NAMES[Math.floor(Math.random() * PET_NAMES.length)]
    const newPet = { ...DEFAULT_PET(), name }
    setPet(newPet)
    setCooldowns(DEFAULT_COOLDOWNS)
    setLogs([])
    setGameKey(k => k + 1)
  }, [])

  // ─── Refs for stale closure prevention ──────────────────────────────────────
  const petRef = useRef(pet)
  const cooldownsRef = useRef(cooldowns)
  const battleStateRef = useRef(battleState)
  const intervalRef = useRef(null)
  const tickCountRef = useRef(0)

  // Keep refs in sync with latest state on every render
  useEffect(() => { petRef.current = pet }, [pet])
  useEffect(() => { cooldownsRef.current = cooldowns }, [cooldowns])
  useEffect(() => { battleStateRef.current = battleState }, [battleState])

  // ─── Game loop: register once on mount ──────────────────────────────────────
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      // Pause during battle
      if (battleStateRef.current !== null) return

      const currentPet = petRef.current
      if (!currentPet.alive) return

      // 1. Increment age every 300 ticks (~10 minutes)
      tickCountRef.current += 1
      let p = { ...currentPet, age: tickCountRef.current % 300 === 0 ? currentPet.age + 1 : currentPet.age }

      // 2. Apply stat decay
      p = applyDecay(p)

      // 3. Apply sleep regen / check wake
      const wasSleeping = p.sleeping
      p = applySleepRegen(p)
      if (wasSleeping && !p.sleeping) {
        setLogs(l => addLog(l, `${p.name} woke up!`, 'info'))
      }

      // 4. Poop spawn (2% chance if awake, max 5)
      if (!p.sleeping && p.poops < 5 && Math.random() < 0.02) {
        p = { ...p, poops: p.poops + 1 }
      }

      // 5. Apply HP logic (sickness decay / regen)
      p = applyHpLogic(p)

      // 6. Check death
      if (p.health <= 0) {
        p = { ...p, alive: false }
        setPet(p)
        setLogs(l => addLog(l, `${p.name} has died...`, 'danger'))
        clearInterval(intervalRef.current)
        return
      }

      // 7. Check evolution
      const prevStage = p.stage
      p = checkEvolution(p)
      if (p.stage > prevStage) {
        setLogs(l => addLog(l, `${p.name} evolved into ${STAGES[p.stage]}!`, 'info'))
      }

      // 8. Decrement cooldowns
      setCooldowns(c => decrementCooldowns(c))

      setPet(p)
    }, 2000)

    return () => clearInterval(intervalRef.current)
  }, [gameKey])

  // Clear interval when pet dies
  useEffect(() => {
    if (pet && !pet.alive) {
      clearInterval(intervalRef.current)
    }
  }, [pet?.alive])

  // ─── Sprite selection ────────────────────────────────────────────────────────
  const spriteKey = (() => {
    if (!pet) return 'egg'
    if (animation === 'eat' || animation === 'play' || animation === 'sleep'
      || animation === 'dance' || animation === 'grumpy' || animation === 'sneeze') return animation
    if (pet.health < 30) return 'sick'
    if (pet.sleeping) return 'sleep'
    return STAGES[pet.stage].toLowerCase()
  })()
  const spriteFrames = SPRITES[spriteKey] ?? SPRITES.egg
  const spriteLines = spriteFrames[frame % spriteFrames.length]

  const moodAvg = pet ? (pet.hunger + pet.happiness + pet.cleanliness) / 3 : 100
  const needsAttention = pet && pet.alive && !pet.sleeping && moodAvg < 35
  const spriteColor = !pet || pet.health < 30 ? '#f87171'
    : pet.sleeping ? '#93c5fd'
    : moodAvg > 70 ? '#4ade80'
    : moodAvg > 40 ? '#facc15'
    : '#f87171'

  // DEV: skip to Child stage for testing — only when ?dev=true in URL
  const isDevMode = new URLSearchParams(window.location.search).get('dev') === 'true'
  const handleDevSkip = useCallback(() => {
    setPet(p => ({ ...p, stage: 2, age: 6 }))
    setLogs(l => addLog(l, '[DEV] Skipped to Child stage — battle unlocked!', 'info'))
  }, [])

  // ─── Name prompt screen ──────────────────────────────────────────────────────
  if (!pet) {
    return (
      <div style={{ minHeight: '100vh', background: '#030a03', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
        <div style={{
          width: '100%', maxWidth: '360px',
          background: 'linear-gradient(160deg, #0d1a0d 0%, #050f05 100%)',
          border: '3px solid #166534',
          borderRadius: '4px',
          padding: '32px 24px',
          fontFamily: px,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '16px', letterSpacing: '6px', color: '#4ade80', marginBottom: '8px' }}>TAMTAMPIP</div>
          <div style={{ fontSize: '7px', color: '#86efac', letterSpacing: '2px', marginBottom: '32px' }}>VIRTUAL PET</div>
          <div style={{ fontSize: '7px', color: '#4ade80', letterSpacing: '2px', marginBottom: '16px' }}>NAME YOUR PET</div>
          <input
            type="text"
            maxLength={12}
            placeholder="leave blank for random"
            value={nameInput}
            onChange={e => setNameInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleStartGame(nameInput)}
            style={{
              width: '100%',
              fontFamily: px,
              fontSize: '8px',
              background: '#020a02',
              border: '1px solid #166534',
              color: '#4ade80',
              padding: '8px',
              textAlign: 'center',
              letterSpacing: '2px',
              outline: 'none',
              boxSizing: 'border-box',
              marginBottom: '16px',
            }}
            autoFocus
          />
          <button
            onClick={() => handleStartGame(nameInput)}
            style={{
              fontFamily: px, fontSize: '8px', letterSpacing: '2px',
              background: 'transparent', color: '#4ade80',
              border: '2px solid #4ade80', padding: '10px 24px',
              cursor: 'pointer', width: '100%',
            }}
          >▶ START</button>
          <div style={{ fontSize: '6px', color: '#4b5563', marginTop: '16px', letterSpacing: '1px' }}>
            your pet is saved automatically in your browser
          </div>
        </div>
      </div>
    )
  }

  // ─── Disable logic ────────────────────────────────────────────────────────────
  const sick = pet.health < 30
  const feedDisabled   = !pet.alive || pet.sleeping || sick
  const playDisabled   = !pet.alive || pet.sleeping || pet.energy < 15 || sick
  const cleanDisabled  = !pet.alive || pet.sleeping || sick
  const sleepDisabled  = !pet.alive || pet.sleeping
  const medDisabled    = !pet.alive
  const battleDisabled = !pet.alive || pet.sleeping || pet.stage < 2

  return (
    <div style={{ minHeight: '100vh', background: '#030a03', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      {/* ── Device shell ── */}
      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: 'linear-gradient(160deg, #0d1a0d 0%, #050f05 100%)',
        border: '3px solid #166534',
        borderRadius: '4px',
        boxShadow: 'inset 0 0 30px rgba(0,0,0,0.5)',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: px,
      }}>
        {/* Scanlines */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10,
          background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.12) 3px, rgba(0,0,0,0.12) 4px)',
        }} />
        {/* Corner accents */}
        {['top:0;left:0', 'top:0;right:0', 'bottom:0;left:0', 'bottom:0;right:0'].map((pos, i) => (
          <div key={i} style={{
            position: 'absolute', width: '12px', height: '12px',
            borderColor: '#4ade80', borderStyle: 'solid', borderWidth: 0,
            ...(i === 0 ? { top: 0, left: 0, borderTopWidth: 2, borderLeftWidth: 2 } :
               i === 1 ? { top: 0, right: 0, borderTopWidth: 2, borderRightWidth: 2 } :
               i === 2 ? { bottom: 0, left: 0, borderBottomWidth: 2, borderLeftWidth: 2 } :
                         { bottom: 0, right: 0, borderBottomWidth: 2, borderRightWidth: 2 }),
            zIndex: 11, pointerEvents: 'none',
          }} />
        ))}

        <div style={{ position: 'relative', zIndex: 1, padding: '16px' }}>

          {/* ── Header ── */}
          <div style={{ textAlign: 'center', marginBottom: '12px', borderBottom: '1px solid #14532d', paddingBottom: '10px', position: 'relative' }}>
            <div style={{ fontSize: '16px', letterSpacing: '6px', color: '#4ade80' }}>
              TAMTAMPIP
            </div>
            <div style={{ fontSize: '7px', color: '#86efac', marginTop: '5px', letterSpacing: '2px' }}>
              {pet.name}
              <span style={{ color: '#4b5563', margin: '0 6px' }}>·</span>
              <span style={{ color: '#4ade80' }}>{STAGES[pet.stage].toUpperCase()}</span>
              <span style={{ color: '#4b5563', margin: '0 6px' }}>·</span>
              <span style={{ color: '#6b7280' }}>AGE {pet.age}</span>
              {pet.stage >= 2 && (() => {
                const rank = getBattleRank(pet.level)
                return (
                  <>
                    <span style={{ color: '#4b5563', margin: '0 6px' }}>·</span>
                    <span style={{ color: '#facc15' }}>LV {pet.level}</span>
                    {rank && <span style={{ color: '#facc15', marginLeft: '4px' }}>{rank.icon} {rank.title}</span>}
                  </>
                )
              })()}
            </div>
            {/* Help button */}
            <button
              onClick={() => setShowHelp(true)}
              style={{
                position: 'absolute', top: 0, right: 0,
                fontFamily: px, fontSize: '8px', color: '#4ade80',
                background: 'transparent', border: '1px solid #166534',
                padding: '3px 6px', cursor: 'pointer', letterSpacing: '1px',
              }}
            >?</button>
          </div>

          {/* ── Pet viewport ── */}
          <div style={{
            background: '#020a02',
            border: '2px solid #14532d',
            borderRadius: '2px',
            padding: '12px 8px',
            marginBottom: '12px',
            textAlign: 'center',
            position: 'relative',
            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)',
            minHeight: '110px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}>
            {/* Stage badge */}
            <div style={{
              position: 'absolute', top: '6px', left: '8px',
              fontSize: '6px', color: '#4b5563', fontFamily: px, letterSpacing: '1px',
            }}>
              {['🥚','🐣','🐥','🐦','🦅'][pet.stage]}
            </div>
            {/* Sleeping badge */}
            {pet.sleeping && (
              <div style={{ position: 'absolute', top: '6px', right: '8px', fontSize: '10px' }}>💤</div>
            )}
            {/* Attention alert */}
            {needsAttention && (
              <div style={{
                position: 'absolute', top: '6px', left: '50%', transform: 'translateX(-50%)',
                fontFamily: px, fontSize: '7px', color: '#f87171', letterSpacing: '2px',
                animation: 'none',
                opacity: frame === 0 ? 1 : 0.2,
                transition: 'opacity 0.3s',
              }}>▲ NEEDS CARE ▲</div>
            )}
            {/* Wandering pet */}
            <div
              onClick={handlePetClick}
              style={{
                position: 'relative',
                display: 'inline-block',
                marginLeft: `${petX - 50}%`,
                cursor: pet.alive && !pet.sleeping ? 'pointer' : 'default',
                transform: isNudging ? 'translateY(-4px)' : 'translateY(0)',
                transition: isNudging
                  ? 'transform 0.1s ease-out, margin-left 1.2s ease-in-out'
                  : 'transform 0.2s ease-in, margin-left 1.2s ease-in-out',
              }}
            >
              {/* Click reaction bubble */}
              {clickReaction && (
                <div style={{
                  position: 'absolute', top: '-18px', left: '50%', transform: 'translateX(-50%)',
                  fontFamily: px, fontSize: '10px', color: '#4ade80',
                  pointerEvents: 'none',
                }}>{clickReaction}</div>
              )}
              <pre style={{
                color: spriteColor,
                fontFamily: 'monospace',
                fontSize: '12px',
                lineHeight: '1.5',
                margin: 0,
                userSelect: 'none',
              }}>
                {spriteLines.join('\n')}
              </pre>
            </div>
            {/* Status row */}
            <div style={{ marginTop: '6px', display: 'flex', gap: '6px', alignItems: 'center', justifyContent: 'center' }}>
              {pet.health < 30 && pet.alive && <span style={{ fontSize: '13px' }}>🤒</span>}
              {!pet.alive && <span style={{ fontSize: '13px' }}>☠️</span>}
              {pet.poops > 0 && (
                <span style={{ fontSize: '11px', letterSpacing: '1px' }}>{'💩'.repeat(pet.poops)}</span>
              )}
            </div>
          </div>

          {/* ── Death overlay ── */}
          {!pet.alive && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 20,
              background: 'rgba(0,0,0,0.92)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: '12px',
            }}>
              <div style={{ fontSize: '22px', color: '#f87171', letterSpacing: '4px' }}>GAME OVER</div>
              <div style={{ fontSize: '7px', color: '#6b7280', letterSpacing: '1px' }}>{pet.name} has passed away</div>
              <button
                onClick={handleRestart}
                style={{
                  fontFamily: px, fontSize: '8px', letterSpacing: '2px',
                  background: 'transparent', color: '#4ade80',
                  border: '2px solid #4ade80', padding: '8px 20px',
                  cursor: 'pointer', marginTop: '4px',
                }}
              >
                ▶ RESTART
              </button>
            </div>
          )}

          {/* ── Battle OR care UI ── */}
          {battleState !== null ? (
            <BattleScreen
              playerPet={pet}
              playerBattle={battleState.player}
              cpuBattle={battleState.cpu}
              isPlayerTurn={battleState.isPlayerTurn}
              battleLog={battleState.log}
              onAction={handlePlayerAction}
            />
          ) : (
            <>
              {/* ── Stats ── */}
              <div style={{ marginBottom: '12px', background: '#020a02', border: '1px solid #14532d', padding: '10px' }}>
                <StatBar label="Hunger"      icon="🍖" value={pet.hunger}      warning={pet.hunger      < 30} />
                <StatBar label="Happiness"   icon="😊" value={pet.happiness}   warning={pet.happiness   < 30} />
                <StatBar label="Cleanliness" icon="🧼" value={pet.cleanliness} warning={pet.cleanliness < 30} />
                <StatBar label="Energy"      icon="⚡" value={pet.energy}      warning={pet.energy      < 30} />
                <StatBar label="Health"      icon="❤️" value={pet.health}      warning={pet.health      < 30} />
                {pet.stage >= 2 && (() => {
                  const expInLevel = pet.exp % EXP_PER_LEVEL
                  const expPct = (expInLevel / EXP_PER_LEVEL) * 100
                  return (
                    <div style={{ marginTop: '8px', borderTop: '1px solid #14532d', paddingTop: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontFamily: px, fontSize: '7px', color: '#facc15', letterSpacing: '1px' }}>⚔️ LV {pet.level}</span>
                        <span style={{ fontFamily: px, fontSize: '7px', color: '#facc15' }}>{pet.exp % EXP_PER_LEVEL}/{EXP_PER_LEVEL} EXP</span>
                      </div>
                      <div style={{ display: 'flex', gap: '2px' }}>
                        {Array.from({ length: 10 }).map((_, i) => (
                          <div key={i} style={{ flex: 1, height: '5px', backgroundColor: i < Math.round(expPct / 10) ? '#facc15' : '#1f2937', transition: 'background-color 0.3s' }} />
                        ))}
                      </div>
                    </div>
                  )
                })()}
              </div>

              {/* ── Actions ── */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center', marginBottom: '12px' }}>
                <ActionButton label="Feed"     icon="🍖" disabled={feedDisabled}   cooldown={cooldowns.feed}  onClick={handleFeed} />
                <ActionButton label="Play"     icon="🎮" disabled={playDisabled}   cooldown={cooldowns.play}  onClick={handlePlay} />
                <ActionButton label="Clean"    icon="🧹" disabled={cleanDisabled}  cooldown={cooldowns.clean} onClick={handleClean} />
                <ActionButton label="Sleep"    icon="💤" disabled={sleepDisabled}  cooldown={0}               onClick={handleSleep} />
                <ActionButton label="Medicine" icon="💊" disabled={medDisabled}    cooldown={cooldowns.heal}  onClick={handleMedicine} />
                <ActionButton label="Battle"   icon="⚔️" disabled={battleDisabled} cooldown={0}               onClick={initBattle} />
              </div>
              {/* DEV shortcut — only visible with ?dev=true */}
              {isDevMode && pet.stage < 2 && (
                <div style={{ textAlign: 'center', marginTop: '6px' }}>
                  <button
                    onClick={handleDevSkip}
                    style={{
                      fontFamily: px, fontSize: '6px', color: '#4b5563',
                      background: 'transparent', border: '1px dashed #374151',
                      padding: '3px 8px', cursor: 'pointer', letterSpacing: '1px',
                    }}
                  >DEV: SKIP TO BATTLE</button>
                </div>
              )}
            </>
          )}

          {/* ── Event log ── */}
          <div style={{
            background: '#020a02',
            border: '1px solid #14532d',
            padding: '8px',
            maxHeight: '130px',
            overflowY: 'auto',
          }}>
            <div style={{ fontFamily: px, fontSize: '6px', color: '#166534', letterSpacing: '2px', marginBottom: '6px' }}>
              ── EVENT LOG ──
            </div>
            {logs.length === 0
              ? <span style={{ fontFamily: 'monospace', fontSize: '9px', color: '#1f2937' }}>no events yet...</span>
              : logs.map(entry => (
                  <LogEntry key={entry.id} timestamp={entry.timestamp} message={entry.message} type={entry.type} />
                ))
            }
          </div>

        </div>
      </div>

      {/* ── Help Modal ── */}
      {showHelp && (
        <div
          onClick={() => setShowHelp(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: '380px',
              background: '#050f05',
              border: '2px solid #166534',
              padding: '16px',
              fontFamily: px,
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #14532d', paddingBottom: '8px' }}>
              <span style={{ fontSize: '9px', color: '#4ade80', letterSpacing: '3px' }}>MANUAL</span>
              <button onClick={() => setShowHelp(false)} style={{ fontFamily: px, fontSize: '8px', color: '#4ade80', background: 'transparent', border: '1px solid #166534', padding: '2px 6px', cursor: 'pointer' }}>✕</button>
            </div>

            {[
              { title: '🐣 RAISING YOUR PET', lines: [
                'Your pet hatches from an egg and grows through 5 stages: Egg, Baby, Child, Teen, Adult.',
                'Growth takes real time — check back every few hours to care for it.',
              ]},
              { title: '📊 STATS', lines: [
                '🍖 Hunger — feed your pet before it starves.',
                '😊 Happiness — play to keep spirits up.',
                '🧼 Cleanliness — clean up poop and dirt.',
                '⚡ Energy — let it sleep when tired.',
                '❤️ Health — drops when stats are neglected. Use medicine to heal.',
              ]},
              { title: '🎮 ACTIONS', lines: [
                'Feed — restores hunger (+25). Cooldown: 3 ticks.',
                'Play — boosts happiness (+30), costs energy (-15). Cooldown: 3 ticks.',
                'Clean — restores cleanliness (+35), removes poop. Cooldown: 3 ticks.',
                'Sleep — pet rests and regens energy. Wakes automatically.',
                'Medicine — restores health (+30). Cooldown: 5 ticks.',
                'Battle — unlocks at Child stage. Fight CPU opponents!',
              ]},
              { title: '⚔️ BATTLE', lines: [
                'Unlocks at Child stage. Fight CPU opponents to earn EXP.',
                'Attack — deal damage based on your attack stat.',
                'Defend — reduce incoming damage by 50% next turn.',
                'Special — powerful attack (1.5x), costs more.',
                'Heal — restore 20 HP mid-battle.',
                'Win to gain EXP and level up. Higher level = stronger stats.',
              ]},
              { title: '🏆 LEVELS & RANKS', lines: [
                'Win battles to earn EXP. Every 10 EXP = 1 level.',
                'Each level boosts your battle stats.',
                'Reach rank milestones for titles:',
                'Lv 1 🥉 ROOKIE → Lv 5 🥈 FIGHTER → Lv 10 🥇 VETERAN',
                'Lv 20 🏆 CHAMPION → Lv 35 👑 LEGEND',
              ]},
              { title: '💀 GAME OVER', lines: [
                'If health reaches 0, your pet dies.',
                'Keep all stats above 25 to avoid health decay.',
                'Press RESTART to begin again.',
              ]},
              { title: '💩 TIPS', lines: [
                'Poop appears randomly — clean it or cleanliness drops fast.',
                'Sleeping pets decay slower — put them to sleep overnight.',
                'Stats below 30 flash as a warning. Act fast!',
              ]},
            ].map(({ title, lines }) => (
              <div key={title} style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '7px', color: '#4ade80', letterSpacing: '2px', marginBottom: '6px' }}>{title}</div>
                {lines.map((line, i) => (
                  <div key={i} style={{ fontSize: '6px', color: '#86efac', lineHeight: '2', letterSpacing: '0.5px' }}>› {line}</div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
