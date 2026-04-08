import { useState, useEffect, useRef, useCallback } from 'react'

export function usePetInteraction({ pet, setAnimation }) {
  const [petX, setPetX] = useState(50)
  const [clickReaction, setClickReaction] = useState(null)
  const [isNudging, setIsNudging] = useState(false)
  const [frame, setFrame] = useState(0)
  const clickCountRef = useRef(0)
  const clickTimerRef = useRef(null)
  const lastHappyDanceRef = useRef(0)

  // Frame ticker
  useEffect(() => {
    const id = setInterval(() => setFrame(f => f ^ 1), 600)
    return () => clearInterval(id)
  }, [])

  // Wander + poop flee
  useEffect(() => {
    const id = setInterval(() => {
      if (!pet || !pet.alive || pet.sleeping) return
      setPetX(x => {
        if (pet.poops >= 3) return x > 50 ? 20 : 80
        const delta = (Math.random() - 0.5) * 30
        return Math.min(75, Math.max(25, x + delta))
      })
    }, 2500)
    return () => clearInterval(id)
  }, [pet?.alive, pet?.sleeping, pet?.poops])

  // Happy dance when all stats > 80
  useEffect(() => {
    if (!pet || !pet.alive || pet.sleeping) return
    const allHappy = pet.hunger > 80 && pet.happiness > 80 && pet.cleanliness > 80 && pet.energy > 80
    if (!allHappy) return
    const now = Date.now()
    if (now - lastHappyDanceRef.current < 30000) return
    lastHappyDanceRef.current = now
    setAnimation('dance')
    setClickReaction('♪')
    setTimeout(() => { setAnimation(null); setClickReaction(null) }, 2000)
  }, [pet?.hunger, pet?.happiness, pet?.cleanliness, pet?.energy])

  // Random sneeze when sick
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

  const handlePetClick = useCallback(() => {
    if (!pet || !pet.alive || pet.sleeping) return
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

  return { petX, clickReaction, isNudging, frame, handlePetClick }
}
