import { describe, it, expect } from 'vitest'
import { SigmaNumber } from '../../../src/types/sigma-number.ts'

describe('SigmaNumber', () => {
  it('creates from integer', () => {
    const n = new SigmaNumber(42)
    expect(n.value).toBe(42)
  })

  it('creates from float', () => {
    const n = new SigmaNumber(3.14)
    expect(n.value).toBe(3.14)
  })

  it('creates from numeric value via from()', () => {
    expect(SigmaNumber.from(42).value).toBe(42)
    expect(SigmaNumber.from('3.14').value).toBe(3.14)
  })

  it('throws on non-numeric string', () => {
    expect(() => SigmaNumber.from('abc')).toThrow()
  })

  it('equals works', () => {
    expect(new SigmaNumber(5).equals(new SigmaNumber(5))).toBe(true)
    expect(new SigmaNumber(5).equals(new SigmaNumber(6))).toBe(false)
  })
})
