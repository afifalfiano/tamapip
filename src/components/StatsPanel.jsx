import { px, EXP_PER_LEVEL } from '../constants/game'
import { StatBar } from './StatBar'

export function StatsPanel({ pet }) {
  const expInLevel = pet.exp % EXP_PER_LEVEL
  const expPct = (expInLevel / EXP_PER_LEVEL) * 100

  return (
    <div style={{ marginBottom: '12px', background: '#020a02', border: '1px solid #14532d', padding: '10px' }}>
      <StatBar label="Hunger"      icon="🍖" value={pet.hunger}      warning={pet.hunger      < 30} />
      <StatBar label="Happiness"   icon="😊" value={pet.happiness}   warning={pet.happiness   < 30} />
      <StatBar label="Cleanliness" icon="🧼" value={pet.cleanliness} warning={pet.cleanliness < 30} />
      <StatBar label="Energy"      icon="⚡" value={pet.energy}      warning={pet.energy      < 30} />
      <StatBar label="Health"      icon="❤️" value={pet.health}      warning={pet.health      < 30} />
      {pet.stage >= 2 && (
        <div style={{ marginTop: '8px', borderTop: '1px solid #14532d', paddingTop: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontFamily: px, fontSize: '7px', color: '#facc15', letterSpacing: '1px' }}>⚔️ LV {pet.level}</span>
            <span style={{ fontFamily: px, fontSize: '7px', color: '#facc15' }}>{expInLevel}/{EXP_PER_LEVEL} EXP</span>
          </div>
          <div style={{ display: 'flex', gap: '2px' }}>
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} style={{
                flex: 1, height: '5px',
                backgroundColor: i < Math.round(expPct / 10) ? '#facc15' : '#1f2937',
                transition: 'background-color 0.3s',
              }} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
