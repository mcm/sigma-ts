import { describe, it, expect } from 'vitest'
import { SigmaRegularExpression } from '../../../src/types/sigma-regex.ts'
import { SigmaTypeError } from '../../../src/exceptions.ts'

describe('SigmaRegularExpression', () => {
  it('creates from valid pattern', () => {
    const r = new SigmaRegularExpression('foo.*bar')
    expect(r.pattern).toBe('foo.*bar')
  })

  it('exposes regexp getter', () => {
    const r = new SigmaRegularExpression('\\d+')
    expect(r.regexp).toBeInstanceOf(RegExp)
    expect(r.regexp.test('123')).toBe(true)
  })

  it('throws SigmaTypeError for invalid pattern', () => {
    expect(() => new SigmaRegularExpression('[invalid')).toThrow(SigmaTypeError)
  })

  it('equals works', () => {
    expect(new SigmaRegularExpression('abc').equals(new SigmaRegularExpression('abc'))).toBe(true)
    expect(new SigmaRegularExpression('abc').equals(new SigmaRegularExpression('def'))).toBe(false)
  })
})
