/** Growth stage names indexed by stage number (0–4). */
export const STAGES = ['Egg', 'Baby', 'Child', 'Teen', 'Adult']

/** Minimum age required to reach each stage (index matches STAGES). */
export const STAGE_THRESHOLDS = [0, 1, 6, 24, 72]

/** Pool of random pet names used when no name is provided. */
export const PET_NAMES = [
  'Pippin', 'Mochi', 'Biscuit', 'Noodle', 'Pudding',
  'Waffles', 'Sprout', 'Dango', 'Pebble', 'Tofu',
  'Boba', 'Dumpling',
]

/**
 * Per-tick stat decay rates applied every 2 seconds.
 * Multiplied by 0.3 when the pet is sleeping.
 */
export const DECAY_RATES = {
  hunger: 0.05,
  happiness: 0.04,
  cleanliness: 0.03,
  energy: 0.025,
}

/** Number of game ticks each action is locked after use. */
export const COOLDOWN_TICKS = { feed: 3, play: 3, clean: 3, heal: 5 }

/** Default cooldown state — all actions immediately available. */
export const DEFAULT_COOLDOWNS = { feed: 0, play: 0, clean: 0, heal: 0 }

/** Base battle stat values added on top of care-stat-derived bonuses. */
export const BASE_ATTACK = 5
export const BASE_DEFENSE = 5
export const BASE_SPECIAL = 5

/** Amount of EXP required to advance one battle level. */
export const EXP_PER_LEVEL = 10

/** Pixel font family string used throughout the UI. */
export const px = "'Press Start 2P', monospace"

/**
 * Returns a fresh pet state object with all default values.
 * @param {string} [name] - Optional pet name. Randomly chosen from PET_NAMES if omitted.
 * @returns {Object} Initial pet state.
 */
export function DEFAULT_PET(name) {
  const petName = name || PET_NAMES[Math.floor(Math.random() * PET_NAMES.length)]
  return {
    name: petName,
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
