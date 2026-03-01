import { describe, it, expect, vi, afterEach } from 'vitest'
import { SigmaCollection } from '../../src/collection.ts'
import { SigmaRule } from '../../src/rule.ts'

const RULE_1 = `
title: Rule One
id: 11111111-1111-1111-1111-111111111111
status: stable
level: high
tags:
  - attack.t1059
logsource:
  category: process_creation
  product: windows
detection:
  selection:
    CommandLine: powershell.exe
  condition: selection
`

const RULE_2 = `
title: Rule Two
id: 22222222-2222-2222-2222-222222222222
status: experimental
level: medium
tags:
  - attack.discovery
logsource:
  category: network_connection
  product: linux
detection:
  selection:
    DestinationPort: '443'
  condition: selection
`

const RULE_3 = `
title: Rule Three
id: 33333333-3333-3333-3333-333333333333
status: stable
level: high
logsource:
  category: process_creation
  product: windows
detection:
  selection:
    Image: cmd.exe
  condition: selection
`

const MULTI_DOC_YAML = `${RULE_1}---${RULE_2}---${RULE_3}`

describe('SigmaCollection.fromYAML()', () => {
  it('parses multi-document YAML stream with 3 rules', () => {
    const collection = SigmaCollection.fromYAML(MULTI_DOC_YAML)
    expect(collection.count).toBe(3)
    expect(collection.errorCount).toBe(0)
  })

  it('collects parse errors without failing for the whole stream', () => {
    const badRule = `
title: ""
logsource:
  category: process_creation
detection:
  selection:
    CommandLine: test.exe
  condition: selection
`
    const stream = RULE_1 + '---\n' + badRule
    const collection = SigmaCollection.fromYAML(stream)
    expect(collection.count).toBe(1)
    expect(collection.errorCount).toBe(1)
  })
})

describe('SigmaCollection.fromYAMLList()', () => {
  it('parses list of YAML strings', () => {
    const collection = SigmaCollection.fromYAMLList([RULE_1, RULE_2])
    expect(collection.count).toBe(2)
    expect(collection.errorCount).toBe(0)
  })

  it('returns empty collection for empty list', () => {
    const collection = SigmaCollection.fromYAMLList([])
    expect(collection.count).toBe(0)
    expect(collection.errorCount).toBe(0)
  })

  it('collects errors for invalid rules', () => {
    const badRule = 'title: \ndetection:\n  condition: selection'
    const collection = SigmaCollection.fromYAMLList([RULE_1, badRule])
    expect(collection.count).toBe(1)
    expect(collection.errorCount).toBe(1)
  })
})

describe('SigmaCollection iteration', () => {
  it('supports for...of iteration', () => {
    const collection = SigmaCollection.fromYAMLList([RULE_1, RULE_2])
    const titles: string[] = []
    for (const rule of collection) {
      titles.push(rule.title)
    }
    expect(titles).toContain('Rule One')
    expect(titles).toContain('Rule Two')
  })

  it('get(index) returns correct rule', () => {
    const collection = SigmaCollection.fromYAMLList([RULE_1, RULE_2])
    expect(collection.get(0).title).toBe('Rule One')
  })
})

describe('SigmaCollection filter methods', () => {
  it('filterByLevel returns only matching rules', () => {
    const collection = SigmaCollection.fromYAML(MULTI_DOC_YAML)
    const highOnly = collection.filterByLevel('high')
    expect(highOnly.count).toBe(2)
    for (const rule of highOnly) {
      expect(rule.level).toBe('high')
    }
  })

  it('filterByTag returns only matching rules', () => {
    const collection = SigmaCollection.fromYAML(MULTI_DOC_YAML)
    const filtered = collection.filterByTag('attack.t1059')
    expect(filtered.count).toBe(1)
    expect(filtered.get(0).title).toBe('Rule One')
  })

  it('filterByStatus returns only matching rules', () => {
    const collection = SigmaCollection.fromYAML(MULTI_DOC_YAML)
    const stableOnly = collection.filterByStatus('stable')
    expect(stableOnly.count).toBe(2)
  })

  it('filterByLogsource returns only matching rules', () => {
    const collection = SigmaCollection.fromYAML(MULTI_DOC_YAML)
    const winRules = collection.filterByLogsource({ product: 'windows' })
    expect(winRules.count).toBe(2)
  })

  it('generic filter with custom predicate', () => {
    const collection = SigmaCollection.fromYAML(MULTI_DOC_YAML)
    const filtered = collection.filter(r => r.title.startsWith('Rule T'))
    expect(filtered.count).toBe(2)
  })
})

describe('SigmaCollection non-SigmaError wrapping', () => {
  afterEach(() => vi.restoreAllMocks())

  it('wraps non-SigmaError from fromDict into SigmaRuleParseError (fromYAML path)', () => {
    vi.spyOn(SigmaRule, 'fromDict').mockImplementationOnce(() => {
      throw new TypeError('unexpected internal error')
    })
    const collection = SigmaCollection.fromYAML(RULE_1)
    expect(collection.errorCount).toBe(1)
    expect(collection.errors[0]!.error.message).toContain('Unknown parse error')
  })

  it('wraps non-SigmaError from fromYAML into SigmaRuleParseError (fromYAMLList path)', () => {
    vi.spyOn(SigmaRule, 'fromYAML').mockImplementationOnce(() => {
      throw new TypeError('unexpected internal error')
    })
    const collection = SigmaCollection.fromYAMLList([RULE_1])
    expect(collection.errorCount).toBe(1)
    expect(collection.errors[0]!.error.message).toContain('Unknown parse error')
  })
})
