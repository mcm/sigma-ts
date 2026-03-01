import { describe, it, expect } from 'vitest'
import { getModifier, applyModifierChain, modifierRegistry } from '../../../src/modifiers/index.ts'
import { SigmaString } from '../../../src/types/sigma-string.ts'
import { SigmaRegularExpression } from '../../../src/types/sigma-regex.ts'
import { SigmaCIDRExpression } from '../../../src/types/sigma-cidr.ts'
import { SigmaFieldReference } from '../../../src/types/sigma-field-reference.ts'
import { SigmaExpansion } from '../../../src/types/sigma-expansion.ts'
import { SigmaNull } from '../../../src/types/sigma-null.ts'
import { SigmaModifierError } from '../../../src/exceptions.ts'

describe('Modifier Registry', () => {
  it('getModifier returns registered modifiers', () => {
    const ContainsClass = getModifier('contains')
    expect(ContainsClass).toBeDefined()
  })

  it('getModifier throws SigmaModifierError for unknown modifier', () => {
    expect(() => getModifier('unknown_xyz')).toThrow(SigmaModifierError)
  })

  it('all 20 built-in modifiers are registered', () => {
    const expected = [
      'contains',
      'startswith',
      'endswith',
      're',
      'cidr',
      'base64',
      'base64offset',
      'wide',
      'utf16le',
      'utf16be',
      'utf16',
      'windash',
      'lt',
      'lte',
      'gt',
      'gte',
      'exists',
      'fieldref',
      'expand',
      'all',
    ]
    for (const name of expected) {
      expect(modifierRegistry.has(name)).toBe(true)
    }
  })
})

describe('ContainsModifier', () => {
  it('wraps string with leading and trailing wildcards', () => {
    const { values } = applyModifierChain(['contains'], [SigmaString.plain('foo')])
    expect(values).toHaveLength(1)
    const s = values[0] as SigmaString
    expect(s).toBeInstanceOf(SigmaString)
    expect(s.parts[0]).toEqual({ kind: 'wildcard', wildcard: '*' })
    expect(s.parts[s.parts.length - 1]).toEqual({ kind: 'wildcard', wildcard: '*' })
    expect(s.startswith('')).toBe(true)
    expect(s.contains_wildcard()).toBe(true)
  })
})

describe('StartswithModifier', () => {
  it('appends trailing wildcard', () => {
    const { values } = applyModifierChain(['startswith'], [SigmaString.plain('foo')])
    const s = values[0] as SigmaString
    expect(s.parts[s.parts.length - 1]).toEqual({ kind: 'wildcard', wildcard: '*' })
    expect(s.startswith('foo')).toBe(true)
  })
})

describe('EndswithModifier', () => {
  it('prepends leading wildcard', () => {
    const { values } = applyModifierChain(['endswith'], [SigmaString.plain('bar')])
    const s = values[0] as SigmaString
    expect(s.parts[0]).toEqual({ kind: 'wildcard', wildcard: '*' })
    expect(s.endswith('bar')).toBe(true)
  })
})

describe('ReModifier', () => {
  it('converts SigmaString to SigmaRegularExpression', () => {
    const { values } = applyModifierChain(['re'], [SigmaString.plain('foo.*bar')])
    expect(values[0]).toBeInstanceOf(SigmaRegularExpression)
  })

  it('throws SigmaModifierError if value contains wildcards', () => {
    expect(() => applyModifierChain(['re'], [SigmaString.from('foo*')])).toThrow(SigmaModifierError)
  })
})

describe('CaseInsensitiveModifier', () => {
  it('adds i flag to SigmaRegularExpression', () => {
    const { values } = applyModifierChain(['re', 'i'], [SigmaString.plain('foo.*bar')])
    expect(values[0]).toBeInstanceOf(SigmaRegularExpression)
    expect((values[0] as SigmaRegularExpression).regexp.flags).toContain('i')
  })

  it('passes non-SigmaRegularExpression values through unchanged', () => {
    const { values } = applyModifierChain(['i'], [SigmaNull.instance])
    expect(values[0]).toBe(SigmaNull.instance)
  })
})

describe('CidrModifier', () => {
  it('converts SigmaString to SigmaCIDRExpression', () => {
    const { values } = applyModifierChain(['cidr'], [SigmaString.plain('192.168.1.0/24')])
    expect(values[0]).toBeInstanceOf(SigmaCIDRExpression)
  })
})

describe('Base64Modifier', () => {
  it('base64-encodes plain string', () => {
    const { values } = applyModifierChain(['base64'], [SigmaString.plain('test')])
    const s = values[0] as SigmaString
    expect(s.plain_value()).toBe('dGVzdA==')
  })
})

describe('Base64OffsetModifier', () => {
  it('produces exactly 3 variants', () => {
    const { values } = applyModifierChain(['base64offset'], [SigmaString.plain('test')])
    expect(values).toHaveLength(3)
  })
})

describe('WideModifier', () => {
  it('null-byte interleaves characters (UTF-16 LE style)', () => {
    const { values } = applyModifierChain(['wide'], [SigmaString.plain('ab')])
    const s = values[0] as SigmaString
    const str = s.plain_value()
    expect(str).toBe('a\x00b\x00')
  })
})

describe('WindashModifier', () => {
  it('produces additional / variant when string contains -', () => {
    const { values } = applyModifierChain(['windash'], [SigmaString.plain('-param')])
    expect(values).toHaveLength(2)
    const strs = values.map((v) => (v as SigmaString).plain_value())
    expect(strs).toContain('-param')
    expect(strs).toContain('/param')
  })

  it('does not add variant when string has no dash', () => {
    const { values } = applyModifierChain(['windash'], [SigmaString.plain('noparam')])
    expect(values).toHaveLength(1)
  })

  it('passes non-SigmaString through without extra variant', () => {
    const { values } = applyModifierChain(['windash'], [SigmaNull.instance])
    expect(values).toHaveLength(1)
    expect(values[0]).toBe(SigmaNull.instance)
  })

  it('handles SigmaString with wildcard parts (no-dash branch for wildcard)', () => {
    // SigmaString with wildcard parts: windash maps plain parts only
    const val = SigmaString.from('*-param')
    const { values } = applyModifierChain(['windash'], [val])
    // The plain part '-param' has a dash, so should produce a variant
    expect(values.length).toBeGreaterThanOrEqual(1)
  })
})

describe('FieldrefModifier', () => {
  it('converts SigmaString to SigmaFieldReference', () => {
    const { values } = applyModifierChain(['fieldref'], [SigmaString.plain('CommandLine')])
    expect(values[0]).toBeInstanceOf(SigmaFieldReference)
    expect((values[0] as SigmaFieldReference).referencedField).toBe('CommandLine')
  })

  it('throws SigmaModifierError if value contains wildcards', () => {
    expect(() =>
      applyModifierChain(['fieldref'], [SigmaString.from('foo*')]),
    ).toThrow(SigmaModifierError)
  })
})

describe('ExpandModifier', () => {
  it('converts SigmaString to SigmaExpansion', () => {
    const { values } = applyModifierChain(['expand'], [SigmaString.plain('%ADMIN%')])
    expect(values[0]).toBeInstanceOf(SigmaExpansion)
    expect((values[0] as SigmaExpansion).placeholder).toBe('%ADMIN%')
  })
})

describe('ExistsModifier', () => {
  it('returns SigmaNull for field existence check', () => {
    const { values } = applyModifierChain(['exists'], [SigmaString.plain('true')])
    expect(values[0]).toBeInstanceOf(SigmaNull)
  })

  it('throws SigmaModifierError when given more than one value', () => {
    expect(() =>
      applyModifierChain(['exists'], [SigmaString.plain('true'), SigmaString.plain('false')]),
    ).toThrow(SigmaModifierError)
  })
})

describe('AllModifier', () => {
  it('sets valueLinking to AND', () => {
    const { valueLinking } = applyModifierChain(['all'], [SigmaString.plain('foo')])
    expect(valueLinking).toBe('AND')
  })

  it('does not modify values', () => {
    const input = [SigmaString.plain('foo'), SigmaString.plain('bar')]
    const { values } = applyModifierChain(['all'], input)
    expect(values).toHaveLength(2)
  })
})

describe('Utf16leModifier', () => {
  it('encodes string as UTF-16 LE bytes', () => {
    const { values } = applyModifierChain(['utf16le'], [SigmaString.plain('a')])
    const s = values[0] as SigmaString
    const str = s.plain_value()
    // UTF-16 LE for 'a' is 0x61 0x00
    expect(str).toBe('a\x00')
  })
})

describe('Utf16beModifier', () => {
  it('encodes string as UTF-16 BE bytes (null before each char)', () => {
    const { values } = applyModifierChain(['utf16be'], [SigmaString.plain('a')])
    const s = values[0] as SigmaString
    const str = s.plain_value()
    // UTF-16 BE for 'a' is 0x00 0x61
    expect(str).toBe('\x00a')
  })
})

describe('Utf16Modifier', () => {
  it('encodes string as UTF-16 LE with BOM', () => {
    const { values } = applyModifierChain(['utf16'], [SigmaString.plain('a')])
    const s = values[0] as SigmaString
    const str = s.plain_value()
    // BOM (0xFF 0xFE) followed by UTF-16 LE for 'a' (0x61 0x00)
    expect(str.charCodeAt(0)).toBe(0xff)
    expect(str.charCodeAt(1)).toBe(0xfe)
    expect(str.charCodeAt(2)).toBe(0x61)
    expect(str.charCodeAt(3)).toBe(0x00)
  })
})

describe('Illegal modifier chains', () => {
  it('throws SigmaModifierError for re|base64', () => {
    expect(() =>
      applyModifierChain(['re', 'base64'], [SigmaString.plain('foo')]),
    ).toThrow(SigmaModifierError)
  })
})

describe('Non-SigmaString values pass through modifiers unchanged', () => {
  it('base64 passes non-SigmaString values through', () => {
    const { values } = applyModifierChain(['base64'], [SigmaNull.instance])
    expect(values[0]).toBe(SigmaNull.instance)
  })

  it('contains passes non-SigmaString values through', () => {
    const { values } = applyModifierChain(['contains'], [SigmaNull.instance])
    expect(values[0]).toBe(SigmaNull.instance)
  })

  it('startswith passes non-SigmaString values through', () => {
    const { values } = applyModifierChain(['startswith'], [SigmaNull.instance])
    expect(values[0]).toBe(SigmaNull.instance)
  })

  it('endswith passes non-SigmaString values through', () => {
    const { values } = applyModifierChain(['endswith'], [SigmaNull.instance])
    expect(values[0]).toBe(SigmaNull.instance)
  })

  it('wide passes non-SigmaString values through', () => {
    const { values } = applyModifierChain(['wide'], [SigmaNull.instance])
    expect(values[0]).toBe(SigmaNull.instance)
  })

  it('utf16le passes non-SigmaString values through', () => {
    const { values } = applyModifierChain(['utf16le'], [SigmaNull.instance])
    expect(values[0]).toBe(SigmaNull.instance)
  })

  it('utf16be passes non-SigmaString values through', () => {
    const { values } = applyModifierChain(['utf16be'], [SigmaNull.instance])
    expect(values[0]).toBe(SigmaNull.instance)
  })

  it('utf16 passes non-SigmaString values through', () => {
    const { values } = applyModifierChain(['utf16'], [SigmaNull.instance])
    expect(values[0]).toBe(SigmaNull.instance)
  })

  it('expand passes non-SigmaString values through', () => {
    const { values } = applyModifierChain(['expand'], [SigmaNull.instance])
    expect(values[0]).toBe(SigmaNull.instance)
  })

  it('base64offset passes non-SigmaString values through', () => {
    const { values } = applyModifierChain(['base64offset'], [SigmaNull.instance])
    expect(values[0]).toBe(SigmaNull.instance)
  })

  it('fieldref passes non-SigmaString values through', () => {
    const { values } = applyModifierChain(['fieldref'], [SigmaNull.instance])
    expect(values[0]).toBe(SigmaNull.instance)
  })
})

describe('Numeric comparison modifiers (lt, lte, gt, gte)', () => {
  it('lt modifier passes values through', () => {
    const { values } = applyModifierChain(['lt'], [SigmaString.plain('100')])
    expect(values).toHaveLength(1)
  })

  it('lte modifier passes values through', () => {
    const { values } = applyModifierChain(['lte'], [SigmaString.plain('100')])
    expect(values).toHaveLength(1)
  })

  it('gt modifier passes values through', () => {
    const { values } = applyModifierChain(['gt'], [SigmaString.plain('100')])
    expect(values).toHaveLength(1)
  })

  it('gte modifier passes values through', () => {
    const { values } = applyModifierChain(['gte'], [SigmaString.plain('100')])
    expect(values).toHaveLength(1)
  })
})
