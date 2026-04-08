import { px, STAGES } from '../constants/game'
import SPRITES from '../constants/sprites'

function getSpriteKey(pet, animation) {
  if (!pet) return 'egg'
  if (['eat', 'play', 'sleep', 'dance', 'grumpy', 'sneeze'].includes(animation)) return animation
  if (pet.health < 30) return 'sick'
  if (pet.sleeping) return 'sleep'
  return STAGES[pet.stage].toLowerCase()
}

export function PetViewport({ pet, animation, frame, petX, clickReaction, isNudging, onPetClick }) {
  const spriteKey = getSpriteKey(pet, animation)
  const spriteFrames = SPRITES[spriteKey] ?? SPRITES.egg
  const spriteLines = spriteFrames[frame % spriteFrames.length]

  const moodAvg = pet ? (pet.hunger + pet.happiness + pet.cleanliness) / 3 : 100
  const needsAttention = pet && pet.alive && !pet.sleeping && moodAvg < 35
  const spriteColor = !pet || pet.health < 30 ? '#f87171'
    : pet.sleeping ? '#93c5fd'
    : moodAvg > 70 ? '#4ade80'
    : moodAvg > 40 ? '#facc15'
    : '#f87171'

  return (
    <div style={{
      background: '#020a02', border: '2px solid #14532d', borderRadius: '2px',
      padding: '12px 8px', marginBottom: '12px', textAlign: 'center',
      position: 'relative', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)',
      minHeight: '110px', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    }}>
      {/* Stage badge */}
      <div style={{ position: 'absolute', top: '6px', left: '8px', fontSize: '6px', color: '#4b5563', fontFamily: px }}>
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
          opacity: frame === 0 ? 1 : 0.2, transition: 'opacity 0.3s',
        }}>▲ NEEDS CARE ▲</div>
      )}

      {/* Wandering pet */}
      <div
        onClick={onPetClick}
        style={{
          position: 'relative', display: 'inline-block',
          marginLeft: `${petX - 50}%`,
          cursor: pet.alive && !pet.sleeping ? 'pointer' : 'default',
          transform: isNudging ? 'translateY(-4px)' : 'translateY(0)',
          transition: isNudging
            ? 'transform 0.1s ease-out, margin-left 1.2s ease-in-out'
            : 'transform 0.2s ease-in, margin-left 1.2s ease-in-out',
        }}
      >
        {clickReaction && (
          <div style={{
            position: 'absolute', top: '-18px', left: '50%', transform: 'translateX(-50%)',
            fontFamily: px, fontSize: '10px', color: '#4ade80', pointerEvents: 'none',
          }}>{clickReaction}</div>
        )}
        <pre style={{
          color: spriteColor, fontFamily: 'monospace', fontSize: '12px',
          lineHeight: '1.5', margin: 0, userSelect: 'none',
        }}>
          {spriteLines.join('\n')}
        </pre>
      </div>

      {/* Status row */}
      <div style={{ marginTop: '6px', display: 'flex', gap: '6px', alignItems: 'center', justifyContent: 'center' }}>
        {pet.health < 30 && pet.alive && <span style={{ fontSize: '13px' }}>🤒</span>}
        {!pet.alive && <span style={{ fontSize: '13px' }}>☠️</span>}
        {pet.poops > 0 && <span style={{ fontSize: '11px', letterSpacing: '1px' }}>{'💩'.repeat(pet.poops)}</span>}
      </div>
    </div>
  )
}
