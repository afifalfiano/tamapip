import { px } from '../constants/game'
import { LogEntry } from './LogEntry'

export function EventLog({ logs }) {
  return (
    <div style={{ background: '#020a02', border: '1px solid #14532d', padding: '8px', maxHeight: '130px', overflowY: 'auto' }}>
      <div style={{ fontFamily: px, fontSize: '6px', color: '#166534', letterSpacing: '2px', marginBottom: '6px' }}>
        ── EVENT LOG ──
      </div>
      {logs.length === 0
        ? <span style={{ fontFamily: 'monospace', fontSize: '9px', color: '#1f2937' }}>no events yet...</span>
        : logs.map(entry => (
            <LogEntry key={entry.id} timestamp={entry.timestamp} message={entry.message} type={entry.type} />
          ))
      }
    </div>
  )
}
