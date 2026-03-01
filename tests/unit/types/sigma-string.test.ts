import { describe, it, expect } from 'vitest'
import { SigmaString } from '../../../src/types/sigma-string.ts'

describe('SigmaString.from()', () => {
  it('parses a plain string with no wildcards', () => {
    const s = SigmaString.from('hello')
    expect(s.parts).toHaveLength(1)
    expect(s.parts[0]).toEqual({ kind: 'plain', value: 'hello' })
  })

  it('parses a string with a trailing *', () => {
    const s = SigmaString.from('foo*')
    expect(s.parts).toHaveLength(2)
    expect(s.parts[0]).toEqual({ kind: 'plain', value: 'foo' })
    expect(s.parts[1]).toEqual({ kind: 'wildcard', wildcard: '*' })
  })

  it('parses a string with a leading *', () => {
    const s = SigmaString.from('*bar')
    expect(s.parts).toHaveLength(2)
    expect(s.parts[0]).toEqual({ kind: 'wildcard', wildcard: '*' })
    expect(s.parts[1]).toEqual({ kind: 'plain', value: 'bar' })
  })

  it('parses "foo*bar?" into 4 parts', () => {
    const s = SigmaString.from('foo*bar?')
    expect(s.parts).toHaveLength(4)
    expect(s.parts[0]).toEqual({ kind: 'plain', value: 'foo' })
    expect(s.parts[1]).toEqual({ kind: 'wildcard', wildcard: '*' })
    expect(s.parts[2]).toEqual({ kind: 'plain', value: 'bar' })
    expect(s.parts[3]).toEqual({ kind: 'wildcard', wildcard: '?' })
  })

  it('backslash-escapes \\* as a plain asterisk', () => {
    const s = SigmaString.from('foo\\*bar')
    expect(s.parts).toHaveLength(1)
    expect(s.parts[0]).toEqual({ kind: 'plain', value: 'foo*bar' })
  })

  it('backslash-escapes \\? as a plain question mark', () => {
    const s = SigmaString.from('foo\\?bar')
    expect(s.parts).toHaveLength(1)
    expect(s.parts[0]).toEqual({ kind: 'plain', value: 'foo?bar' })
  })

  it('handles empty string', () => {
    const s = SigmaString.from('')
    expect(s.parts).toHaveLength(0)
  })

  it('handles a pure wildcard string "*"', () => {
    const s = SigmaString.from('*')
    expect(s.parts).toHaveLength(1)
    expect(s.parts[0]).toEqual({ kind: 'wildcard', wildcard: '*' })
  })

  it('merges adjacent plain parts (no wildcards between them)', () => {
    // foo\*bar stays as one plain part: "foo*bar"
    const s = SigmaString.from('foo\\*bar')
    expect(s.parts).toHaveLength(1)
  })
})

describe('SigmaString.contains_wildcard()', () => {
  it('returns false for plain string', () => {
    expect(SigmaString.from('hello').contains_wildcard()).toBe(false)
  })

  it('returns true for string with *', () => {
    expect(SigmaString.from('hello*').contains_wildcard()).toBe(true)
  })

  it('returns true for string with ?', () => {
    expect(SigmaString.from('hel?o').contains_wildcard()).toBe(true)
  })
})

describe('SigmaString.startswith()', () => {
  it('returns true when string starts with prefix', () => {
    expect(SigmaString.from('foobar').startswith('foo')).toBe(true)
  })

  it('returns false when string starts with a wildcard', () => {
    expect(SigmaString.from('*foobar').startswith('foo')).toBe(false)
  })

  it('returns true for empty prefix', () => {
    expect(SigmaString.from('anything').startswith('')).toBe(true)
  })

  it('returns false when prefix does not match', () => {
    expect(SigmaString.from('foobar').startswith('baz')).toBe(false)
  })
})

describe('SigmaString.endswith()', () => {
  it('returns true when string ends with suffix', () => {
    expect(SigmaString.from('foobar').endswith('bar')).toBe(true)
  })

  it('returns false when string ends with a wildcard', () => {
    expect(SigmaString.from('foobar*').endswith('bar')).toBe(false)
  })

  it('returns true for empty suffix', () => {
    expect(SigmaString.from('anything').endswith('')).toBe(true)
  })
})

describe('SigmaString.to_regex()', () => {
  it('escapes regex metacharacters in plain parts', () => {
    const s = SigmaString.from('foo.bar')
    expect(s.to_regex()).toBe('foo\\.bar')
  })

  it('converts * to .*', () => {
    const s = SigmaString.from('foo*bar')
    expect(s.to_regex()).toBe('foo.*bar')
  })

  it('converts ? to .', () => {
    const s = SigmaString.from('foo?bar')
    expect(s.to_regex()).toBe('foo.bar')
  })

  it('handles mixed wildcards and plain parts', () => {
    const s = SigmaString.from('*foo?')
    expect(s.to_regex()).toBe('.*foo.')
  })

  it('escapes all special regex characters', () => {
    const s = SigmaString.from('a+b[c]d^e$f(g)h{i}j|k\\l')
    const regex = s.to_regex()
    // Should not throw when used as regex
    expect(() => new RegExp(regex)).not.toThrow()
  })
})

describe('SigmaString.concat()', () => {
  it('concatenates two plain strings', () => {
    const a = SigmaString.from('foo')
    const b = SigmaString.from('bar')
    const c = a.concat(b)
    expect(c.parts).toHaveLength(1)
    expect(c.parts[0]).toEqual({ kind: 'plain', value: 'foobar' })
  })

  it('does not mutate original strings', () => {
    const a = SigmaString.from('foo')
    const b = SigmaString.from('*bar')
    a.concat(b)
    expect(a.parts).toHaveLength(1) // unchanged
  })

  it('concatenates wildcard-containing strings', () => {
    const a = SigmaString.from('foo*')
    const b = SigmaString.from('*bar')
    const c = a.concat(b)
    expect(c.contains_wildcard()).toBe(true)
    expect(c.parts).toHaveLength(4)
  })
})

describe('SigmaString.equals()', () => {
  it('equal for identical plain strings', () => {
    expect(SigmaString.from('foo').equals(SigmaString.from('foo'))).toBe(true)
  })

  it('not equal for different plain strings', () => {
    expect(SigmaString.from('foo').equals(SigmaString.from('bar'))).toBe(false)
  })

  it('equal for identical wildcard strings', () => {
    expect(SigmaString.from('foo*bar').equals(SigmaString.from('foo*bar'))).toBe(true)
  })

  it('not equal if one has wildcard and other does not', () => {
    expect(SigmaString.from('foo*').equals(SigmaString.from('foo'))).toBe(false)
  })
})

describe('SigmaString.toString()', () => {
  it('returns the plain value representation', () => {
    expect(SigmaString.from('foo*bar').toString()).toBe('foo*bar')
  })
})

describe('SigmaString.plain', () => {
  it('creates a plain string without wildcard parsing', () => {
    const s = SigmaString.plain('hello*world')
    // Should be treated as plain, no wildcard parsing
    expect(s.contains_wildcard()).toBe(false)
    expect(s.parts[0]).toEqual({ kind: 'plain', value: 'hello*world' })
  })
})
