/** localStorage key used to persist game state. */
const STORAGE_KEY = 'tamtampip_save'

/**
 * Loads saved game state from localStorage.
 * @returns {{ pet: Object, cooldowns: Object, logs: Array } | null} Saved state or null if none exists.
 */
export function loadSave() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

/**
 * Persists current game state to localStorage.
 * Silently ignores errors (e.g. private browsing, storage full).
 * @param {Object} pet - Current pet state.
 * @param {Object} cooldowns - Current cooldown state.
 * @param {Array} logs - Current event log entries.
 */
export function writeSave(pet, cooldowns, logs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ pet, cooldowns, logs }))
  } catch { /* storage unavailable */ }
}

/**
 * Removes saved game state from localStorage.
 * Called on restart so the name prompt is shown again.
 */
export function clearSave() {
  localStorage.removeItem(STORAGE_KEY)
}
