import { useCallback } from 'react'
import { COOLDOWN_TICKS } from '../constants/game'
import { addLog } from '../utils/petLogic'

export function usePetActions({ pet, cooldowns, setPet, setCooldowns, setLogs, setAnimation }) {
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
    setPet(p => ({ ...p, happiness: Math.min(100, p.happiness + 30), energy: Math.max(0, p.energy - 15) }))
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

  return { handleFeed, handlePlay, handleClean, handleMedicine, handleSleep }
}
