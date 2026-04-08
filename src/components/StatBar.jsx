import { px } from '../constants/game'

export function StatBar({ label, icon, value, warning }) {
  const pct = Math.max(0, Math.min(100, value))
  const fillColor = pct > 60 ? '#4ade80' : pct > 30 ? '#facc15' : '#f87171'
  const segments = 20
  const filled = Math.round((pct / 100) * segments)

  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <span style={{ fontFamily: px, fontSize: '7px', color: warning ? fillColor : '#86efac', letterSpacing: '1px' }}>
          {icon} {label}
        </span>
        <span style={{ fontFamily: px, fontSize: '7px', color: fillColor }}>
          {Math.floor(pct)}
        </span>
      </div>
      <div style={{ display: 'flex', gap: '2px' }}>
        {Array.from({ length: segments }).map((_, i) => (
          <div key={i} style={{
            flex: 1, height: '7px',
            backgroundColor: i < filled ? fillColor : '#1f2937',
            transition: 'background-color 0.3s',
          }} />
        ))}
      </div>
    </div>
  )
}
