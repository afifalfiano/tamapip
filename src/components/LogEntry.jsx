const COLORS = { info: '#4ade80', warning: '#facc15', danger: '#f87171', success: '#34d399' }

export function LogEntry({ timestamp, message, type }) {
  const color = COLORS[type] ?? '#4ade80'
  return (
    <div style={{ display: 'flex', gap: '8px', lineHeight: '1.6', fontSize: '9px' }}>
      {timestamp && (
        <span style={{ color: '#4b5563', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>{timestamp}</span>
      )}
      <span style={{ color, fontFamily: 'monospace' }}>{message}</span>
    </div>
  )
}
