import { describe, expect, it } from 'vitest'

import { normalizePostalInput } from '../src'

describe('normalizePostalInput', () => {
  it('keeps digits only, converts Thai digits, and stops at 5', () => {
    expect(normalizePostalInput('83 100')).toBe('83100')
    expect(normalizePostalInput('๘๓๑๐๐')).toBe('83100')
    expect(normalizePostalInput('10-2a0b0')).toBe('10200')
    expect(normalizePostalInput('1020099')).toBe('10200')
    expect(normalizePostalInput('')).toBe('')
  })
})
