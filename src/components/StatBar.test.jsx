import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatBar } from './StatBar'

describe('StatBar', () => {
  it('renders label and icon', () => {
    render(<StatBar label="Hunger" icon="🍖" value={80} warning={false} />)
    expect(screen.getByText(/Hunger/)).toBeInTheDocument()
  })

  it('displays floored percentage value', () => {
    render(<StatBar label="Hunger" icon="🍖" value={73.9} warning={false} />)
    expect(screen.getByText('73')).toBeInTheDocument()
  })

  it('clamps value above 100 to 100', () => {
    render(<StatBar label="Energy" icon="⚡" value={150} warning={false} />)
    expect(screen.getByText('100')).toBeInTheDocument()
  })

  it('clamps value below 0 to 0', () => {
    render(<StatBar label="Energy" icon="⚡" value={-10} warning={false} />)
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('renders 20 segment divs', () => {
    const { container } = render(<StatBar label="HP" icon="❤️" value={50} warning={false} />)
    // outer div > row div > 20 segment divs
    const segments = container.querySelectorAll('div > div:last-child > div')
    expect(segments.length).toBe(20)
  })

  it('applies warning color to label when warning=true', () => {
    render(<StatBar label="Health" icon="❤️" value={20} warning={true} />)
    const label = screen.getByText(/Health/)
    // warning=true → label color matches fillColor (red at pct=20)
    expect(label).toHaveStyle({ color: '#f87171' })
  })

  it('uses green fill color when value > 60', () => {
    render(<StatBar label="Hunger" icon="🍖" value={80} warning={false} />)
    const pctSpan = screen.getByText('80')
    expect(pctSpan).toHaveStyle({ color: '#4ade80' })
  })

  it('uses yellow fill color when value between 30 and 60', () => {
    render(<StatBar label="Hunger" icon="🍖" value={45} warning={false} />)
    const pctSpan = screen.getByText('45')
    expect(pctSpan).toHaveStyle({ color: '#facc15' })
  })

  it('uses red fill color when value <= 30', () => {
    render(<StatBar label="Hunger" icon="🍖" value={20} warning={false} />)
    const pctSpan = screen.getByText('20')
    expect(pctSpan).toHaveStyle({ color: '#f87171' })
  })
})
