import { useState } from 'react'
import { px } from '../constants/game'

export function NamePrompt({ onStart }) {
  const [name, setName] = useState('')
  return (
    <div style={{ minHeight: '100vh', background: '#030a03', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{
        width: '100%', maxWidth: '360px',
        background: 'linear-gradient(160deg, #0d1a0d 0%, #050f05 100%)',
        border: '3px solid #166534', borderRadius: '4px',
        padding: '32px 24px', fontFamily: px, textAlign: 'center',
      }}>
        <div style={{ fontSize: '16px', letterSpacing: '6px', color: '#4ade80', marginBottom: '8px' }}>TAMTAMPIP</div>
        <div style={{ fontSize: '7px', color: '#86efac', letterSpacing: '2px', marginBottom: '32px' }}>VIRTUAL PET</div>
        <div style={{ fontSize: '7px', color: '#4ade80', letterSpacing: '2px', marginBottom: '16px' }}>NAME YOUR PET</div>
        <input
          type="text"
          maxLength={12}
          placeholder="leave blank for random"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onStart(name)}
          style={{
            width: '100%', fontFamily: px, fontSize: '8px',
            background: '#020a02', border: '1px solid #166534',
            color: '#4ade80', padding: '8px', textAlign: 'center',
            letterSpacing: '2px', outline: 'none', boxSizing: 'border-box', marginBottom: '16px',
          }}
          autoFocus
        />
        <button
          onClick={() => onStart(name)}
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
