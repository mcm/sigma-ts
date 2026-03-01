import { describe, it, expect } from 'vitest'
import { SigmaQueryExpression } from '../../../src/types/sigma-query-expression.ts'
import { SigmaExpansion } from '../../../src/types/sigma-expansion.ts'
import { SigmaFieldReference } from '../../../src/types/sigma-field-reference.ts'

describe('SigmaQueryExpression', () => {
  it('stores opaque query', () => {
    const q = new SigmaQueryExpression('index=main')
    expect(q.query).toBe('index=main')
    expect(q.isOpaque).toBe(true)
  })

  it('equals works', () => {
    expect(new SigmaQueryExpression('a').equals(new SigmaQueryExpression('a'))).toBe(true)
    expect(new SigmaQueryExpression('a').equals(new SigmaQueryExpression('b'))).toBe(false)
  })
})

describe('SigmaExpansion', () => {
  it('stores placeholder', () => {
    const e = new SigmaExpansion('%ADMIN_SHARES%')
    expect(e.placeholder).toBe('%ADMIN_SHARES%')
  })

  it('equals works', () => {
    expect(new SigmaExpansion('x').equals(new SigmaExpansion('x'))).toBe(true)
    expect(new SigmaExpansion('x').equals(new SigmaExpansion('y'))).toBe(false)
  })
})

describe('SigmaFieldReference', () => {
  it('stores referenced field name', () => {
    const r = new SigmaFieldReference('CommandLine')
    expect(r.referencedField).toBe('CommandLine')
  })

  it('equals works', () => {
    expect(new SigmaFieldReference('a').equals(new SigmaFieldReference('a'))).toBe(true)
    expect(new SigmaFieldReference('a').equals(new SigmaFieldReference('b'))).toBe(false)
  })
})
