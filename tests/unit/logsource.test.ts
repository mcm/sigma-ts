import { describe, it, expect } from 'vitest'
import { SigmaLogsource } from '../../src/logsource.ts'

describe('SigmaLogsource.fromDict()', () => {
  it('parses standard fields', () => {
    const ls = SigmaLogsource.fromDict({
      category: 'process_creation',
      product: 'windows',
      service: 'sysmon',
    })
    expect(ls.category).toBe('process_creation')
    expect(ls.product).toBe('windows')
    expect(ls.service).toBe('sysmon')
  })

  it('leaves undefined for missing fields', () => {
    const ls = SigmaLogsource.fromDict({ category: 'network' })
    expect(ls.category).toBe('network')
    expect(ls.product).toBeUndefined()
    expect(ls.service).toBeUndefined()
  })

  it('collects custom fields', () => {
    const ls = SigmaLogsource.fromDict({
      category: 'custom',
      custom_field: 'custom_value',
    })
    expect(ls.custom['custom_field']).toBe('custom_value')
  })

  it('parses definition field', () => {
    const ls = SigmaLogsource.fromDict({ definition: 'Custom definition text' })
    expect(ls.definition).toBe('Custom definition text')
  })
})

describe('SigmaLogsource.matches()', () => {
  it('matches when all fields equal', () => {
    const condition = new SigmaLogsource({ category: 'process_creation', product: 'windows' })
    const rule = new SigmaLogsource({ category: 'process_creation', product: 'windows' })
    expect(condition.matches(rule)).toBe(true)
  })

  it('undefined condition fields act as wildcards', () => {
    const condition = new SigmaLogsource({ product: 'windows' })
    const rule = new SigmaLogsource({ category: 'process_creation', product: 'windows' })
    expect(condition.matches(rule)).toBe(true)
  })

  it('returns false when category does not match', () => {
    const condition = new SigmaLogsource({ category: 'process_creation', product: 'windows' })
    const rule = new SigmaLogsource({ category: 'network', product: 'windows' })
    expect(condition.matches(rule)).toBe(false)
  })

  it('returns false when product does not match', () => {
    const condition = new SigmaLogsource({ product: 'linux' })
    const rule = new SigmaLogsource({ product: 'windows' })
    expect(condition.matches(rule)).toBe(false)
  })

  it('empty condition (all undefined) matches everything', () => {
    const condition = new SigmaLogsource({})
    const rule = new SigmaLogsource({ category: 'process_creation', product: 'windows' })
    expect(condition.matches(rule)).toBe(true)
  })
})
