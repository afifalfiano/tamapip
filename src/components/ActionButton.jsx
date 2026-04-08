import { px } from '../constants/game'

export function ActionButton({ label, icon, disabled, cooldown, onClick }) {
  const isDisabled = disabled || cooldown > 0
  return (
    <button
      onClick={isDisabled ? undefined : onClick}
      disabled={isDisabled}
      style={{
        fontFamily: px,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '8px 6px 6px', minWidth: '62px',
        border: isDisabled ? '2px solid #374151' : '2px solid #4ade80',
        background: isDisabled ? '#0d0d0d' : '#0a1a0a',
        color: isDisabled ? '#374151' : '#4ade80',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.45 : 1,
        boxShadow: 'none',
        transition: 'background 0.15s',
        position: 'relative',
      }}
      onMouseEnter={e => { if (!isDisabled) e.currentTarget.style.background = '#0f2a0f' }}
      onMouseLeave={e => { if (!isDisabled) e.currentTarget.style.background = '#0a1a0a' }}
    >
      <span style={{ fontSize: '18px', lineHeight: 1 }}>{icon}</span>
      {cooldown > 0 && (
        <span style={{
          position: 'absolute', top: '2px', right: '4px',
          fontSize: '7px', color: '#facc15', fontFamily: px,
        }}>{cooldown}</span>
      )}
      <span style={{ fontSize: '6px', marginTop: '5px', letterSpacing: '0.5px' }}>{label}</span>
    </button>
  )
}
