import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePetActions } from './usePetActions'
import { DEFAULT_PET, DEFAULT_COOLDOWNS } from '../constants/game'

function setup(overrides = {}) {
  const pet = { ...DEFAULT_PET('Mochi'), ...overrides }
  const setPet = vi.fn()
  const setCooldowns = vi.fn()
  const setLogs = vi.fn()
  const setAnimation = vi.fn()
  const cooldowns = { ...DEFAULT_COOLDOWNS }

  const { result } = renderHook(() =>
    usePetActions({ pet, cooldowns, setPet, setCooldowns, setLogs, setAnimation })
  )
  return { result, pet, setPet, setCooldowns, setLogs, setAnimation }
}

describe('usePetActions - handleFeed', () => {
  it('calls setPet, setCooldowns, setLogs, setAnimation when conditions met', () => {
    const { result, setPet, setCooldowns, setLogs, setAnimation } = setup()
    act(() => result.current.handleFeed())
    expect(setPet).toHaveBeenCalled()
    expect(setCooldowns).toHaveBeenCalled()
    expect(setLogs).toHaveBeenCalled()
    expect(setAnimation).toHaveBeenCalledWith('eat')
  })

  it('does nothing when pet is sleeping', () => {
    const { result, setPet } = setup({ sleeping: true })
    act(() => result.current.handleFeed())
    expect(setPet).not.toHaveBeenCalled()
  })

  it('does nothing when pet is not alive', () => {
    const { result, setPet } = setup({ alive: false })
    act(() => result.current.handleFeed())
    expect(setPet).not.toHaveBeenCalled()
  })

  it('does nothing when health < 30', () => {
    const { result, setPet } = setup({ health: 20 })
    act(() => result.current.handleFeed())
    expect(setPet).not.toHaveBeenCalled()
  })
})

describe('usePetActions - handlePlay', () => {
  it('calls setPet when conditions met', () => {
    const { result, setPet } = setup({ energy: 50 })
    act(() => result.current.handlePlay())
    expect(setPet).toHaveBeenCalled()
  })

  it('does nothing when energy < 15', () => {
    const { result, setPet } = setup({ energy: 10 })
    act(() => result.current.handlePlay())
    expect(setPet).not.toHaveBeenCalled()
  })

  it('does nothing when sleeping', () => {
    const { result, setPet } = setup({ sleeping: true })
    act(() => result.current.handlePlay())
    expect(setPet).not.toHaveBeenCalled()
  })
})

describe('usePetActions - handleClean', () => {
  it('calls setPet when conditions met', () => {
    const { result, setPet } = setup()
    act(() => result.current.handleClean())
    expect(setPet).toHaveBeenCalled()
  })

  it('does nothing when sleeping', () => {
    const { result, setPet } = setup({ sleeping: true })
    act(() => result.current.handleClean())
    expect(setPet).not.toHaveBeenCalled()
  })
})

describe('usePetActions - handleMedicine', () => {
  it('calls setPet when alive', () => {
    const { result, setPet } = setup()
    act(() => result.current.handleMedicine())
    expect(setPet).toHaveBeenCalled()
  })

  it('does nothing when not alive', () => {
    const { result, setPet } = setup({ alive: false })
    act(() => result.current.handleMedicine())
    expect(setPet).not.toHaveBeenCalled()
  })
})

describe('usePetActions - handleSleep', () => {
  it('calls setPet and setAnimation when awake', () => {
    const { result, setPet, setAnimation } = setup({ sleeping: false })
    act(() => result.current.handleSleep())
    expect(setPet).toHaveBeenCalled()
    expect(setAnimation).toHaveBeenCalledWith('sleep')
  })

  it('does nothing when already sleeping', () => {
    const { result, setPet } = setup({ sleeping: true })
    act(() => result.current.handleSleep())
    expect(setPet).not.toHaveBeenCalled()
  })
})
