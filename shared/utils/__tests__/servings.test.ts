import { describe, it, expect } from 'vitest'
import { scaleQuantity, formatDuration } from '../servings'

describe('scaleQuantity', () => {
  it('returns empty string for null quantity', () => {
    expect(scaleQuantity(null, 2)).toBe('')
  })

  it('returns empty string when factor is 0', () => {
    expect(scaleQuantity(1, 0)).toBe('')
  })

  it('returns whole number string for integer result at scale 1.0', () => {
    expect(scaleQuantity(2, 1)).toBe('2')
  })

  it('returns whole number string for integer result from scaling', () => {
    expect(scaleQuantity(1, 2)).toBe('2')
  })

  it('returns whole number string for larger integer result', () => {
    expect(scaleQuantity(3, 2)).toBe('6')
  })

  it('returns ½ for exact half result', () => {
    expect(scaleQuantity(1, 0.5)).toBe('½')
  })

  it('returns ½ for half via scaling', () => {
    expect(scaleQuantity(2, 0.25)).toBe('½')
  })

  it('returns ¼ for exact quarter result', () => {
    expect(scaleQuantity(1, 0.25)).toBe('¼')
  })

  it('returns ¾ for exact three-quarter result', () => {
    expect(scaleQuantity(1, 0.75)).toBe('¾')
  })

  it('returns decimal string for 1.5 result', () => {
    expect(scaleQuantity(1, 1.5)).toBe('1.5')
  })

  it('returns one decimal place for 1.3 result', () => {
    expect(scaleQuantity(1, 1.3)).toBe('1.3')
  })

  it('rounds to one decimal place for 1.33 result', () => {
    expect(scaleQuantity(1, 1.33)).toBe('1.3')
  })

  it('returns integer string when decimal input yields integer result', () => {
    expect(scaleQuantity(0.5, 2)).toBe('1')
  })
})

describe('formatDuration', () => {
  it('formats 0 seconds as 0:00', () => {
    expect(formatDuration(0)).toBe('0:00')
  })

  it('formats 60 seconds as 1:00', () => {
    expect(formatDuration(60)).toBe('1:00')
  })

  it('formats 90 seconds as 1:30', () => {
    expect(formatDuration(90)).toBe('1:30')
  })

  it('zero-pads seconds less than 10', () => {
    expect(formatDuration(65)).toBe('1:05')
  })

  it('formats 3600 seconds as 60:00', () => {
    expect(formatDuration(3600)).toBe('60:00')
  })
})
