import { describe, it, expect } from 'vitest'
import { SigmaRule } from '../../src/rule.ts'
import { SigmaRuleParseError } from '../../src/exceptions.ts'

const FULL_RULE_YAML = `
title: Test Rule
id: 12345678-1234-1234-1234-123456789012
name: test_rule
status: stable
description: A test rule for sigma-ts
author: Test Author
date: 2024-01-01
modified: 2024-06-15
license: MIT
level: high
references:
  - https://example.com
  - https://docs.example.com
tags:
  - attack.t1059
  - attack.execution
falsepositives:
  - Legitimate admin activity
related:
  - id: 11111111-1111-1111-1111-111111111111
    type: derived
logsource:
  category: process_creation
  product: windows
detection:
  selection:
    CommandLine|contains:
      - powershell
      - cmd.exe
  condition: selection
fields:
  - CommandLine
  - Image
`

describe('SigmaRule.fromYAML()', () => {
  it('parses a complete rule with all metadata fields', () => {
    const rule = SigmaRule.fromYAML(FULL_RULE_YAML)
    expect(rule.title).toBe('Test Rule')
    expect(rule.id).toBe('12345678-1234-1234-1234-123456789012')
    expect(rule.name).toBe('test_rule')
    expect(rule.status).toBe('stable')
    expect(rule.description).toBe('A test rule for sigma-ts')
    expect(rule.author).toBe('Test Author')
    expect(rule.level).toBe('high')
    expect(rule.license).toBe('MIT')
  })

  it('parses references', () => {
    const rule = SigmaRule.fromYAML(FULL_RULE_YAML)
    expect(rule.references).toHaveLength(2)
    expect(rule.references[0]).toBe('https://example.com')
  })

  it('parses tags into SigmaRuleTag objects', () => {
    const rule = SigmaRule.fromYAML(FULL_RULE_YAML)
    expect(rule.tags).toHaveLength(2)
    expect(rule.tags[0]!.namespace).toBe('attack')
    expect(rule.tags[0]!.name).toBe('t1059')
    expect(rule.tags[0]!.raw).toBe('attack.t1059')
  })

  it('parses falsepositives', () => {
    const rule = SigmaRule.fromYAML(FULL_RULE_YAML)
    expect(rule.falsepositives).toHaveLength(1)
  })

  it('parses logsource', () => {
    const rule = SigmaRule.fromYAML(FULL_RULE_YAML)
    expect(rule.logsource.category).toBe('process_creation')
    expect(rule.logsource.product).toBe('windows')
  })

  it('parses detection with condition', () => {
    const rule = SigmaRule.fromYAML(FULL_RULE_YAML)
    expect(rule.detection.detections.has('selection')).toBe(true)
    expect(rule.detection.condition).toHaveLength(1)
  })

  it('parses fields list', () => {
    const rule = SigmaRule.fromYAML(FULL_RULE_YAML)
    expect(rule.fields).toContain('CommandLine')
  })

  it('has empty defaults for missing optional fields', () => {
    const minimalYaml = `
title: Minimal Rule
logsource:
  category: process_creation
detection:
  selection:
    CommandLine: powershell.exe
  condition: selection
`
    const rule = SigmaRule.fromYAML(minimalYaml)
    expect(rule.id).toBeUndefined()
    expect(rule.tags).toHaveLength(0)
    expect(rule.references).toHaveLength(0)
    expect(rule.falsepositives).toHaveLength(0)
    expect(rule.fields).toHaveLength(0)
  })

  it('throws SigmaRuleParseError for missing title', () => {
    const noTitle = `
logsource:
  category: process_creation
detection:
  selection:
    CommandLine: powershell.exe
  condition: selection
`
    expect(() => SigmaRule.fromYAML(noTitle)).toThrow(SigmaRuleParseError)
  })

  it('throws SigmaRuleParseError for missing detection', () => {
    const noDetection = `
title: No Detection Rule
logsource:
  category: process_creation
`
    expect(() => SigmaRule.fromYAML(noDetection)).toThrow(SigmaRuleParseError)
  })

  it('parses multiple conditions as list', () => {
    const multiCondYaml = `
title: Multi Condition Rule
logsource:
  category: process_creation
detection:
  selection:
    CommandLine: powershell.exe
  filter:
    Image: svchost.exe
  condition:
    - selection
    - filter
`
    const rule = SigmaRule.fromYAML(multiCondYaml)
    expect(rule.detection.condition).toHaveLength(2)
  })
})
