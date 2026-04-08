// TamTamPip - Tamagotchi-inspired virtual pet
import { useState, useEffect, useCallback } from 'react'

import { DEFAULT_PET, DEFAULT_COOLDOWNS, PET_NAMES, px } from './constants/game'
import { loadSave, writeSave, clearSave } from './utils/storage'
import { addLog } from './utils/petLogic'

import { useGameLoop } from './hooks/useGameLoop'
import { usePetActions } from './hooks/usePetActions'
import { useBattle } from './hooks/useBattle'
import { usePetInteraction } from './hooks/usePetInteraction'

import { NamePrompt } from './components/NamePrompt'
import { GameHeader } from './components/GameHeader'
import { PetViewport } from './components/PetViewport'
import { StatsPanel } from './components/StatsPanel'
import { ActionButton } from './components/ActionButton'
import { BattleScreen } from './components/BattleScreen'
import { EventLog } from './components/EventLog'
import { HelpModal } from './components/HelpModal'

export default function Tamagotchi() {
  const save = loadSave()

  const [pet, setPet] = useState(() => save?.pet ?? null)
  const [cooldowns, setCooldowns] = useState(() => save?.cooldowns ?? DEFAULT_COOLDOWNS)
  const [logs, setLogs] = useState(() => save?.logs ?? [])
  const [battleState, setBattleState] = useState(null)
  const [animation, setAnimation] = useState(null)
  const [gameKey, setGameKey] = useState(0)
  const [showHelp, setShowHelp] = useState(false)

  // ─── Persistence ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (pet) writeSave(pet, cooldowns, logs)
  }, [pet, cooldowns, logs])

  // ─── Game loop ────────────────────────────────────────────────────────────────
  const { setBattleStateRef } = useGameLoop({ pet, gameKey, setPet, setCooldowns, setLogs })
  useEffect(() => { setBattleStateRef(battleState) })

  // ─── Pet actions ──────────────────────────────────────────────────────────────
  const { handleFeed, handlePlay, handleClean, handleMedicine, handleSleep } =
    usePetActions({ pet, cooldowns, setPet, setCooldowns, setLogs, setAnimation })

  // ─── Battle ───────────────────────────────────────────────────────────────────
  const { initBattle, handlePlayerAction } =
    useBattle({ pet, battleState, setPet, setBattleState, setLogs })

  // ─── Interaction ──────────────────────────────────────────────────────────────
  const { petX, clickReaction, isNudging, frame, handlePetClick } =
    usePetInteraction({ pet, setAnimation })

  // ─── Start / Restart ─────────────────────────────────────────────────────────
  const handleStartGame = useCallback((inputName) => {
    const name = inputName.trim() || PET_NAMES[Math.floor(Math.random() * PET_NAMES.length)]
    setPet(DEFAULT_PET(name))
    setCooldowns(DEFAULT_COOLDOWNS)
    setLogs([])
    setGameKey(k => k + 1)
  }, [])

  const handleRestart = useCallback(() => {
    clearSave()
    setPet(null)
    setCooldowns(DEFAULT_COOLDOWNS)
    setBattleState(null)
    setLogs([])
    setGameKey(k => k + 1)
  }, [])

  // ─── Dev skip ─────────────────────────────────────────────────────────────────
  const isDevMode = new URLSearchParams(window.location.search).get('dev') === 'true'
  const handleDevSkip = useCallback(() => {
    setPet(p => ({ ...p, stage: 2, age: 6 }))
    setLogs(l => addLog(l, '[DEV] Skipped to Child stage — battle unlocked!', 'info'))
  }, [])

  // ─── Name prompt ──────────────────────────────────────────────────────────────
  if (!pet) return <NamePrompt onStart={handleStartGame} />

  // ─── Disable logic ────────────────────────────────────────────────────────────
  const sick = pet.health < 30
  const feedDisabled   = !pet.alive || pet.sleeping || sick
  const playDisabled   = !pet.alive || pet.sleeping || pet.energy < 15 || sick
  const cleanDisabled  = !pet.alive || pet.sleeping || sick
  const sleepDisabled  = !pet.alive || pet.sleeping
  const medDisabled    = !pet.alive
  const battleDisabled = !pet.alive || pet.sleeping || pet.stage < 2

  return (
    <div style={{
      height: '100dvh',
      background: '#030a03',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      overflow: 'hidden',
    }}>
      {/* Device shell */}
      <div style={{
        width: '100%', maxWidth: '400px',
        maxHeight: 'calc(100dvh - 32px)',
        background: 'linear-gradient(160deg, #0d1a0d 0%, #050f05 100%)',
        border: '3px solid #166534', borderRadius: '4px',
        boxShadow: 'inset 0 0 30px rgba(0,0,0,0.5)',
        position: 'relative', overflow: 'hidden', fontFamily: px,
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Scanlines */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10,
          background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.12) 3px, rgba(0,0,0,0.12) 4px)',
        }} />
        {/* Corner accents */}
        {[0,1,2,3].map(i => (
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

        <div style={{ position: 'relative', zIndex: 1, padding: '16px', overflowY: 'auto', flex: 1 }}>
          <GameHeader pet={pet} onHelp={() => setShowHelp(true)} />

          <PetViewport
            pet={pet}
            animation={animation}
            frame={frame}
            petX={petX}
            clickReaction={clickReaction}
            isNudging={isNudging}
            onPetClick={handlePetClick}
          />

          {/* Death overlay */}
          {!pet.alive && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 20,
              background: 'rgba(0,0,0,0.92)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px',
            }}>
              <div style={{ fontSize: '22px', color: '#f87171', letterSpacing: '4px' }}>GAME OVER</div>
              <div style={{ fontSize: '7px', color: '#6b7280', letterSpacing: '1px' }}>{pet.name} has passed away</div>
              <button onClick={handleRestart} style={{
                fontFamily: px, fontSize: '8px', letterSpacing: '2px',
                background: 'transparent', color: '#4ade80',
                border: '2px solid #4ade80', padding: '8px 20px', cursor: 'pointer', marginTop: '4px',
              }}>▶ RESTART</button>
            </div>
          )}

          {/* Battle or care UI */}
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
              <StatsPanel pet={pet} />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center', marginBottom: '12px' }}>
                <ActionButton label="Feed"     icon="🍖" disabled={feedDisabled}   cooldown={cooldowns.feed}  onClick={handleFeed} />
                <ActionButton label="Play"     icon="🎮" disabled={playDisabled}   cooldown={cooldowns.play}  onClick={handlePlay} />
                <ActionButton label="Clean"    icon="🧹" disabled={cleanDisabled}  cooldown={cooldowns.clean} onClick={handleClean} />
                <ActionButton label="Sleep"    icon="💤" disabled={sleepDisabled}  cooldown={0}               onClick={handleSleep} />
                <ActionButton label="Medicine" icon="💊" disabled={medDisabled}    cooldown={cooldowns.heal}  onClick={handleMedicine} />
                <ActionButton label="Battle"   icon="⚔️" disabled={battleDisabled} cooldown={0}               onClick={initBattle} />
              </div>
              {isDevMode && pet.stage < 2 && (
                <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                  <button onClick={handleDevSkip} style={{
                    fontFamily: px, fontSize: '6px', color: '#4b5563',
                    background: 'transparent', border: '1px dashed #374151',
                    padding: '3px 8px', cursor: 'pointer', letterSpacing: '1px',
                  }}>DEV: SKIP TO BATTLE</button>
                </div>
              )}
            </>
          )}

          <EventLog logs={logs} />
        </div>
      </div>

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  )
}
