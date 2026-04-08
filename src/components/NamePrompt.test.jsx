import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { NamePrompt } from './NamePrompt'

describe('NamePrompt', () => {
  it('renders the game title', () => {
    render(<NamePrompt onStart={() => {}} />)
    expect(screen.getByText('TAMTAMPIP')).toBeInTheDocument()
  })

  it('renders the START button', () => {
    render(<NamePrompt onStart={() => {}} />)
    expect(screen.getByText(/START/)).toBeInTheDocument()
  })

  it('calls onStart with typed name when START is clicked', () => {
    const onStart = vi.fn()
    render(<NamePrompt onStart={onStart} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Boba' } })
    fireEvent.click(screen.getByText(/START/))
    expect(onStart).toHaveBeenCalledWith('Boba')
  })

  it('calls onStart with empty string when no name typed', () => {
    const onStart = vi.fn()
    render(<NamePrompt onStart={onStart} />)
    fireEvent.click(screen.getByText(/START/))
    expect(onStart).toHaveBeenCalledWith('')
  })

  it('calls onStart when Enter key is pressed in input', () => {
    const onStart = vi.fn()
    render(<NamePrompt onStart={onStart} />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'Noodle' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onStart).toHaveBeenCalledWith('Noodle')
  })

  it('does not call onStart on non-Enter key press', () => {
    const onStart = vi.fn()
    render(<NamePrompt onStart={onStart} />)
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'a' })
    expect(onStart).not.toHaveBeenCalled()
  })

  it('input respects maxLength of 12', () => {
    render(<NamePrompt onStart={() => {}} />)
    expect(screen.getByRole('textbox')).toHaveAttribute('maxLength', '12')
  })
})
