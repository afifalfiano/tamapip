import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ActionButton } from './ActionButton'

describe('ActionButton', () => {
  it('renders label and icon', () => {
    render(<ActionButton label="Feed" icon="🍖" disabled={false} cooldown={0} onClick={() => {}} />)
    expect(screen.getByText('Feed')).toBeInTheDocument()
    expect(screen.getByText('🍖')).toBeInTheDocument()
  })

  it('calls onClick when enabled and clicked', () => {
    const onClick = vi.fn()
    render(<ActionButton label="Feed" icon="🍖" disabled={false} cooldown={0} onClick={onClick} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('does not call onClick when disabled', () => {
    const onClick = vi.fn()
    render(<ActionButton label="Feed" icon="🍖" disabled={true} cooldown={0} onClick={onClick} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('does not call onClick when cooldown > 0', () => {
    const onClick = vi.fn()
    render(<ActionButton label="Feed" icon="🍖" disabled={false} cooldown={2} onClick={onClick} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('shows cooldown badge when cooldown > 0', () => {
    render(<ActionButton label="Feed" icon="🍖" disabled={false} cooldown={3} onClick={() => {}} />)
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('does not show cooldown badge when cooldown is 0', () => {
    render(<ActionButton label="Feed" icon="🍖" disabled={false} cooldown={0} onClick={() => {}} />)
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('button is disabled when disabled prop is true', () => {
    render(<ActionButton label="Feed" icon="🍖" disabled={true} cooldown={0} onClick={() => {}} />)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('button is disabled when cooldown > 0', () => {
    render(<ActionButton label="Feed" icon="🍖" disabled={false} cooldown={1} onClick={() => {}} />)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('button is enabled when not disabled and cooldown is 0', () => {
    render(<ActionButton label="Feed" icon="🍖" disabled={false} cooldown={0} onClick={() => {}} />)
    expect(screen.getByRole('button')).not.toBeDisabled()
  })
})
