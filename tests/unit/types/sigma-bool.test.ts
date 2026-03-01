import { describe, it, expect } from 'vitest'
import { SigmaBool } from '../../../src/types/sigma-bool.ts'

describe('SigmaBool', () => {
  it('creates from boolean true', () => {
    expect(new SigmaBool(true).value).toBe(true)
  })

  it('creates from boolean false', () => {
    expect(new SigmaBool(false).value).toBe(false)
  })

  it('from() handles YAML boolean-like values', () => {
    expect(SigmaBool.from(true).value).toBe(true)
    expect(SigmaBool.from(false).value).toBe(false)
    expect(SigmaBool.from(1).value).toBe(true)
    expect(SigmaBool.from(0).value).toBe(false)
    expect(SigmaBool.from('yes').value).toBe(true)
    expect(SigmaBool.from('no').value).toBe(false)
    expect(SigmaBool.from('true').value).toBe(true)
    expect(SigmaBool.from('false').value).toBe(false)
    expect(SigmaBool.from('1').value).toBe(true)
    expect(SigmaBool.from('0').value).toBe(false)
  })

  it('throws on invalid value', () => {
    expect(() => SigmaBool.from('maybe')).toThrow()
  })

  it('equals works', () => {
    expect(new SigmaBool(true).equals(new SigmaBool(true))).toBe(true)
    expect(new SigmaBool(true).equals(new SigmaBool(false))).toBe(false)
  })
})
