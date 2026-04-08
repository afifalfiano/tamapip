import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { GameHeader } from './GameHeader'

const basePet = { name: 'Mochi', stage: 0, age: 5, level: 1, exp: 0 }

describe('GameHeader', () => {
  it('renders the game title', () => {
    render(<GameHeader pet={basePet} onHelp={() => {}} />)
    expect(screen.getByText('TAMTAMPIP')).toBeInTheDocument()
  })

  it('renders pet name', () => {
    render(<GameHeader pet={basePet} onHelp={() => {}} />)
    expect(screen.getByText(/Mochi/)).toBeInTheDocument()
  })

  it('renders stage name in uppercase', () => {
    render(<GameHeader pet={basePet} onHelp={() => {}} />)
    expect(screen.getByText('EGG')).toBeInTheDocument()
  })

  it('renders pet age', () => {
    render(<GameHeader pet={basePet} onHelp={() => {}} />)
    expect(screen.getByText(/AGE 5/)).toBeInTheDocument()
  })

  it('does not show level info for stage < 2', () => {
    render(<GameHeader pet={basePet} onHelp={() => {}} />)
    expect(screen.queryByText(/LV/)).not.toBeInTheDocument()
  })

  it('shows level info for stage >= 2', () => {
    const pet = { ...basePet, stage: 2, level: 3 }
    render(<GameHeader pet={pet} onHelp={() => {}} />)
    expect(screen.getByText(/LV 3/)).toBeInTheDocument()
  })

  it('shows rank title when level qualifies', () => {
    const pet = { ...basePet, stage: 2, level: 5 }
    render(<GameHeader pet={pet} onHelp={() => {}} />)
    expect(screen.getByText(/FIGHTER/)).toBeInTheDocument()
  })

  it('calls onHelp when ? button is clicked', () => {
    const onHelp = vi.fn()
    render(<GameHeader pet={basePet} onHelp={onHelp} />)
    fireEvent.click(screen.getByText('?'))
    expect(onHelp).toHaveBeenCalledOnce()
  })
})
