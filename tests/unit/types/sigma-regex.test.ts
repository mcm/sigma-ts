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

  it('toString returns the original pattern', () => {
    expect(new SigmaRegularExpression('foo.*bar').toString()).toBe('foo.*bar')
  })

  it('throws SigmaTypeError for patterns exceeding MAX_PATTERN_LENGTH', () => {
    const longPattern = 'a'.repeat(SigmaRegularExpression.MAX_PATTERN_LENGTH + 1)
    expect(() => new SigmaRegularExpression(longPattern)).toThrow(SigmaTypeError)
  })

  it('handles (?i) inline flag — compiles case-insensitively', () => {
    const r = new SigmaRegularExpression('(?i)hello')
    expect(r.regexp.flags).toContain('i')
    expect(r.regexp.test('HELLO')).toBe(true)
  })

  it('handles (?ms) inline flags', () => {
    const r = new SigmaRegularExpression('(?ms)^foo')
    expect(r.regexp.flags).toContain('m')
    expect(r.regexp.flags).toContain('s')
  })
})
