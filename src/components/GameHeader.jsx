import { px, STAGES } from '../constants/game'
import { getBattleRank } from '../utils/battle'

export function GameHeader({ pet, onHelp }) {
  const rank = pet.stage >= 2 ? getBattleRank(pet.level) : null
  return (
    <div style={{ textAlign: 'center', marginBottom: '12px', borderBottom: '1px solid #14532d', paddingBottom: '10px', position: 'relative' }}>
      <div style={{ fontSize: '16px', letterSpacing: '6px', color: '#4ade80' }}>TAMTAMPIP</div>
      <div style={{ fontSize: '7px', color: '#86efac', marginTop: '5px', letterSpacing: '2px' }}>
        {pet.name}
        <span style={{ color: '#4b5563', margin: '0 6px' }}>·</span>
        <span style={{ color: '#4ade80' }}>{STAGES[pet.stage].toUpperCase()}</span>
        <span style={{ color: '#4b5563', margin: '0 6px' }}>·</span>
        <span style={{ color: '#6b7280' }}>AGE {pet.age}</span>
        {pet.stage >= 2 && (
          <>
            <span style={{ color: '#4b5563', margin: '0 6px' }}>·</span>
            <span style={{ color: '#facc15' }}>LV {pet.level}</span>
            {rank && <span style={{ color: '#facc15', marginLeft: '4px' }}>{rank.icon} {rank.title}</span>}
          </>
        )}
      </div>
      <button
        onClick={onHelp}
        style={{
          position: 'absolute', top: 0, right: 0,
          fontFamily: px, fontSize: '8px', color: '#4ade80',
          background: 'transparent', border: '1px solid #166534',
          padding: '3px 6px', cursor: 'pointer', letterSpacing: '1px',
        }}
      >?</button>
    </div>
  )
}
