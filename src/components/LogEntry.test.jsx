import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LogEntry } from './LogEntry'

describe('LogEntry', () => {
  it('renders message text', () => {
    render(<LogEntry message="Pet was fed!" type="success" />)
    expect(screen.getByText('Pet was fed!')).toBeInTheDocument()
  })

  it('renders timestamp when provided', () => {
    render(<LogEntry timestamp="12:00:00" message="hello" type="info" />)
    expect(screen.getByText('12:00:00')).toBeInTheDocument()
  })

  it('does not render timestamp element when not provided', () => {
    const { container } = render(<LogEntry message="hello" type="info" />)
    // only one span — the message
    expect(container.querySelectorAll('span').length).toBe(1)
  })

  it('applies green color for info type', () => {
    render(<LogEntry message="info msg" type="info" />)
    expect(screen.getByText('info msg')).toHaveStyle({ color: '#4ade80' })
  })

  it('applies yellow color for warning type', () => {
    render(<LogEntry message="warn msg" type="warning" />)
    expect(screen.getByText('warn msg')).toHaveStyle({ color: '#facc15' })
  })

  it('applies red color for danger type', () => {
    render(<LogEntry message="danger msg" type="danger" />)
    expect(screen.getByText('danger msg')).toHaveStyle({ color: '#f87171' })
  })

  it('applies teal color for success type', () => {
    render(<LogEntry message="success msg" type="success" />)
    expect(screen.getByText('success msg')).toHaveStyle({ color: '#34d399' })
  })

  it('falls back to green for unknown type', () => {
    render(<LogEntry message="unknown" type="whatever" />)
    expect(screen.getByText('unknown')).toHaveStyle({ color: '#4ade80' })
  })
})
