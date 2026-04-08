import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EventLog } from './EventLog'

describe('EventLog', () => {
  it('shows empty state message when logs array is empty', () => {
    render(<EventLog logs={[]} />)
    expect(screen.getByText('no events yet...')).toBeInTheDocument()
  })

  it('renders all log entries', () => {
    const logs = [
      { id: 1, timestamp: '10:00:00', message: 'Pet was fed!', type: 'success' },
      { id: 2, timestamp: '10:01:00', message: 'Pet played!', type: 'success' },
    ]
    render(<EventLog logs={logs} />)
    expect(screen.getByText('Pet was fed!')).toBeInTheDocument()
    expect(screen.getByText('Pet played!')).toBeInTheDocument()
  })

  it('renders the EVENT LOG header', () => {
    render(<EventLog logs={[]} />)
    expect(screen.getByText(/EVENT LOG/)).toBeInTheDocument()
  })

  it('does not show empty state when logs exist', () => {
    const logs = [{ id: 1, timestamp: '', message: 'hello', type: 'info' }]
    render(<EventLog logs={logs} />)
    expect(screen.queryByText('no events yet...')).not.toBeInTheDocument()
  })
})
