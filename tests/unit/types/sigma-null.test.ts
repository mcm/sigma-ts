import { describe, it, expect } from 'vitest'
import { SigmaNull } from '../../../src/types/sigma-null.ts'

describe('SigmaNull', () => {
  it('returns singleton via getInstance()', () => {
    const a = SigmaNull.getInstance()
    const b = SigmaNull.getInstance()
    expect(a).toBe(b)
  })

  it('equals another SigmaNull', () => {
    expect(SigmaNull.getInstance().equals(SigmaNull.getInstance())).toBe(true)
  })

  it('toString returns "null"', () => {
    expect(SigmaNull.getInstance().toString()).toBe('null')
  })
})
