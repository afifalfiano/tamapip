import { useEffect, useRef } from 'react'
import { STAGES } from '../constants/game'
import {
  applyDecay, applySleepRegen, applyHpLogic,
  checkEvolution, decrementCooldowns, addLog,
} from '../utils/petLogic'

export function useGameLoop({ pet, gameKey, setPet, setCooldowns, setLogs }) {
  const petRef = useRef(pet)
  const battleStateRef = useRef(null)
  const intervalRef = useRef(null)
  const tickCountRef = useRef(0)

  useEffect(() => { petRef.current = pet }, [pet])

  // expose battleStateRef setter so Tamagotchi can sync it
  const setBattleStateRef = (val) => { battleStateRef.current = val }

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      if (battleStateRef.current !== null) return
      const currentPet = petRef.current
      if (!currentPet || !currentPet.alive) return

      tickCountRef.current += 1
      let p = {
        ...currentPet,
        age: tickCountRef.current % 300 === 0 ? currentPet.age + 1 : currentPet.age,
      }

      p = applyDecay(p)

      const wasSleeping = p.sleeping
      p = applySleepRegen(p)
      if (wasSleeping && !p.sleeping) {
        setLogs(l => addLog(l, `${p.name} woke up!`, 'info'))
      }

      if (!p.sleeping && p.poops < 5 && Math.random() < 0.02) {
        p = { ...p, poops: p.poops + 1 }
      }

      p = applyHpLogic(p)

      if (p.health <= 0) {
        p = { ...p, alive: false }
        setPet(p)
        setLogs(l => addLog(l, `${p.name} has died...`, 'danger'))
        clearInterval(intervalRef.current)
        return
      }

      const prevStage = p.stage
      p = checkEvolution(p)
      if (p.stage > prevStage) {
        setLogs(l => addLog(l, `${p.name} evolved into ${STAGES[p.stage]}!`, 'info'))
      }

      setCooldowns(c => decrementCooldowns(c))
      setPet(p)
    }, 2000)

    return () => clearInterval(intervalRef.current)
  }, [gameKey])

  useEffect(() => {
    if (pet && !pet.alive) clearInterval(intervalRef.current)
  }, [pet?.alive])

  useEffect(() => {
    tickCountRef.current = 0
  }, [gameKey])

  return { setBattleStateRef }
}
