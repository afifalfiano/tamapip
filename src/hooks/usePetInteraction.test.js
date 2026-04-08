import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePetInteraction } from './usePetInteraction'
import { DEFAULT_PET } from '../constants/game'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

function setup(overrides = {}) {
  const pet = { ...DEFAULT_PET('Mochi'), ...overrides }
  const setAnimation = vi.fn()
  const { result } = renderHook(() => usePetInteraction({ pet, setAnimation }))
  return { result, setAnimation }
}

describe('usePetInteraction - initial state', () => {
  it('starts with petX at 50', () => {
    const { result } = setup()
    expect(result.current.petX).toBe(50)
  })

  it('starts with no click reaction', () => {
    const { result } = setup()
    expect(result.current.clickReaction).toBeNull()
  })

  it('starts not nudging', () => {
    const { result } = setup()
    expect(result.current.isNudging).toBe(false)
  })

  it('frame starts at 0', () => {
    const { result } = setup()
    expect(result.current.frame).toBe(0)
  })
})

describe('usePetInteraction - frame ticker', () => {
  it('toggles frame between 0 and 1 every 600ms', () => {
    const { result } = setup()
    expect(result.current.frame).toBe(0)
    act(() => vi.advanceTimersByTime(600))
    expect(result.current.frame).toBe(1)
    act(() => vi.advanceTimersByTime(600))
    expect(result.current.frame).toBe(0)
  })
})

describe('usePetInteraction - handlePetClick', () => {
  it('sets clickReaction and isNudging on single click', () => {
    const { result } = setup({ hunger: 90, happiness: 90, cleanliness: 90 })
    act(() => result.current.handlePetClick())
    expect(result.current.clickReaction).toBe('♥')
    expect(result.current.isNudging).toBe(true)
  })

  it('shows "!" when mood is neutral (avg 40–70)', () => {
    const { result } = setup({ hunger: 50, happiness: 50, cleanliness: 50 })
    act(() => result.current.handlePetClick())
    expect(result.current.clickReaction).toBe('!')
  })

  it('shows "..." when mood is low (avg < 40)', () => {
    const { result } = setup({ hunger: 20, happiness: 20, cleanliness: 20 })
    act(() => result.current.handlePetClick())
    expect(result.current.clickReaction).toBe('...')
  })

  it('clears reaction after 800ms', () => {
    const { result } = setup({ hunger: 90, happiness: 90, cleanliness: 90 })
    act(() => result.current.handlePetClick())
    act(() => vi.advanceTimersByTime(800))
    expect(result.current.clickReaction).toBeNull()
    expect(result.current.isNudging).toBe(false)
  })

  it('triggers grumpy reaction after 4 rapid clicks', () => {
    const { result, setAnimation } = setup()
    act(() => {
      result.current.handlePetClick()
      result.current.handlePetClick()
      result.current.handlePetClick()
      result.current.handlePetClick()
    })
    expect(setAnimation).toHaveBeenCalledWith('grumpy')
    expect(result.current.clickReaction).toBe('(╯°□°）╯')
  })

  it('does nothing when pet is sleeping', () => {
    const { result } = setup({ sleeping: true })
    act(() => result.current.handlePetClick())
    expect(result.current.clickReaction).toBeNull()
  })

  it('does nothing when pet is not alive', () => {
    const { result } = setup({ alive: false })
    act(() => result.current.handlePetClick())
    expect(result.current.clickReaction).toBeNull()
  })
})
