import { describe, it, expect } from 'vitest'
import { SigmaDetectionItem, SigmaDetection } from '../../src/detection.ts'
import { SigmaString } from '../../src/types/sigma-string.ts'
import { SigmaModifierError } from '../../src/exceptions.ts'

describe('SigmaDetectionItem.fromDict()', () => {
  it('parses field and string value', () => {
    const item = SigmaDetectionItem.fromDict('CommandLine', 'powershell.exe')
    expect(item.field).toBe('CommandLine')
    expect(item.value).toHaveLength(1)
    expect(item.value[0]).toBeInstanceOf(SigmaString)
    expect(item.isKeyword).toBe(false)
  })

  it('parses field with contains modifier', () => {
    const item = SigmaDetectionItem.fromDict('CommandLine|contains', 'powershell')
    expect(item.field).toBe('CommandLine')
    expect(item.modifiers).toContain('contains')
    const s = item.value[0] as SigmaString
    // Contains adds wildcards
    expect(s.contains_wildcard()).toBe(true)
  })

  it('parses field with contains|all modifier chain', () => {
    const item = SigmaDetectionItem.fromDict('CommandLine|contains|all', ['foo', 'bar'])
    expect(item.field).toBe('CommandLine')
    expect(item.modifiers).toContain('contains')
    expect(item.modifiers).toContain('all')
    expect(item.valueLinking).toBe('AND')
  })

  it('handles list of values', () => {
    const item = SigmaDetectionItem.fromDict('Status', ['error', 'warning'])
    expect(item.value).toHaveLength(2)
  })

  it('unknown modifier name throws SigmaModifierError', () => {
    expect(() => SigmaDetectionItem.fromDict('Field|unknownmod', 'value')).toThrow(SigmaModifierError)
  })
})

describe('SigmaDetectionItem.fromKeyword()', () => {
  it('creates keyword detection item with null field', () => {
    const item = SigmaDetectionItem.fromKeyword('powershell.exe')
    expect(item.field).toBeNull()
    expect(item.isKeyword).toBe(true)
  })
})

describe('SigmaDetection.fromYAMLValue()', () => {
  it('parses plain map', () => {
    const detection = SigmaDetection.fromYAMLValue({
      CommandLine: 'powershell.exe',
      Image: 'cmd.exe',
    })
    expect(detection.detectionItems).toHaveLength(2)
    expect(detection.isKeyword).toBe(false)
  })

  it('parses list-of-maps', () => {
    const detection = SigmaDetection.fromYAMLValue([
      { CommandLine: 'powershell.exe' },
      { Image: 'cmd.exe' },
    ])
    expect(detection.detectionItems).toHaveLength(2)
  })

  it('parses list-of-scalars as keyword detection', () => {
    const detection = SigmaDetection.fromYAMLValue(['keyword1', 'keyword2'])
    expect(detection.isKeyword).toBe(true)
    expect(detection.detectionItems).toHaveLength(2)
    expect(detection.detectionItems[0]!.field).toBeNull()
  })

  it('throws SigmaDetectionParseError for null input', () => {
    expect(() => SigmaDetection.fromYAMLValue(null)).toThrow()
  })

  it('returns empty detection for empty array input', () => {
    const detection = SigmaDetection.fromYAMLValue([])
    expect(detection.detectionItems).toHaveLength(0)
  })

  it('throws SigmaDetectionParseError for mixed list (object then non-object)', () => {
    expect(() => SigmaDetection.fromYAMLValue([{ CommandLine: 'test' }, 'scalar'])).toThrow()
  })

  it('throws SigmaDetectionParseError for non-object non-array value', () => {
    expect(() => SigmaDetection.fromYAMLValue(42)).toThrow()
  })
})
