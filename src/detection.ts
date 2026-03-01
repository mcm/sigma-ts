import { SigmaDetectionParseError, SigmaModifierError } from './exceptions.js'
import {
  SigmaString,
  SigmaNumber,
  SigmaBool,
  SigmaNull,
} from './types/index.js'
import type { SigmaType } from './types/index.js'
import { applyModifierChain } from './modifiers/index.js'

type ComparisonOperator = 'lt' | 'lte' | 'gt' | 'gte'

export class SigmaDetectionItem {
  readonly field: string | null
  readonly value: readonly SigmaType[]
  readonly modifiers: readonly string[]
  readonly valueLinking: 'OR' | 'AND'
  readonly comparison: ComparisonOperator | null

  constructor(params: {
    field: string | null
    value: readonly SigmaType[]
    modifiers?: readonly string[]
    valueLinking?: 'OR' | 'AND'
    comparison?: ComparisonOperator | null
  }) {
    this.field = params.field
    this.value = params.value
    this.modifiers = params.modifiers ?? []
    this.valueLinking = params.valueLinking ?? 'OR'
    this.comparison = params.comparison ?? null
  }

  get isKeyword(): boolean {
    return this.field === null
  }

  /**
   * Create a new SigmaDetectionItem with some fields overridden. Never mutates the original.
   */
  _clone(overrides: {
    field?: string | null
    value?: readonly SigmaType[]
    modifiers?: readonly string[]
    valueLinking?: 'OR' | 'AND'
  } = {}): SigmaDetectionItem {
    const params: {
      field: string | null
      value: readonly SigmaType[]
      modifiers?: readonly string[]
      valueLinking?: 'OR' | 'AND'
      comparison?: ComparisonOperator
    } = {
      field: overrides.field !== undefined ? overrides.field : this.field,
      value: overrides.value ?? this.value,
      modifiers: overrides.modifiers ?? this.modifiers,
      valueLinking: overrides.valueLinking ?? this.valueLinking,
    }
    if (this.comparison !== null) {
      params.comparison = this.comparison
    }
    return new SigmaDetectionItem(params)
  }

  /**
   * Create a SigmaDetectionItem from a YAML key (field|modifier chain) and raw value.
   */
  static fromDict(key: string, rawValue: unknown): SigmaDetectionItem {
    // Split key on | to get field name and modifiers
    const parts = key.split('|')
    const fieldName = parts[0] ?? ''
    const modifierNames = parts.slice(1).filter((m) => m.length > 0)

    const field = fieldName.length > 0 ? fieldName : null

    // Type-conversion modifiers (re, cidr) operate on raw strings, so wildcard
    // characters in the value must NOT be interpreted as Sigma wildcards.
    const usePlainStrings = modifierNames.some((m) => m === 're' || m === 'cidr')

    // Normalize raw values to SigmaType[]
    let baseValues: SigmaType[] = normalizeValues(rawValue, usePlainStrings)

    // Detect comparison modifier
    const comparisonModifiers: ComparisonOperator[] = ['lt', 'lte', 'gt', 'gte']
    const comparison = modifierNames.find((m) =>
      comparisonModifiers.includes(m as ComparisonOperator),
    ) as ComparisonOperator | undefined

    // Apply modifier chain
    let valueLinking: 'OR' | 'AND' = 'OR'
    try {
      const result = applyModifierChain(modifierNames, baseValues)
      baseValues = result.values
      valueLinking = result.valueLinking
    } catch (e) {
      if (e instanceof SigmaModifierError) throw e
      throw new SigmaDetectionParseError(`Failed to apply modifiers for field "${key}"`, {
        cause: e,
      })
    }

    return new SigmaDetectionItem({
      field,
      value: baseValues,
      modifiers: modifierNames,
      valueLinking,
      comparison: comparison ?? null,
    })
  }

  /**
   * Create a keyword detection item (field = null).
   */
  static fromKeyword(rawValue: unknown): SigmaDetectionItem {
    const values = normalizeValues(rawValue)
    return new SigmaDetectionItem({
      field: null,
      value: values,
      modifiers: [],
      valueLinking: 'OR',
      comparison: null,
    })
  }
}

/**
 * Normalize a raw YAML value to an array of SigmaType.
 * @param plain - When true, strings are treated as plain (no wildcard interpretation).
 *   Use for `re` and `cidr` modifier chains where `*` and `?` are literal characters.
 */
function normalizeValues(rawValue: unknown, plain = false): SigmaType[] {
  if (rawValue === null || rawValue === undefined) {
    return [SigmaNull.getInstance()]
  }

  if (Array.isArray(rawValue)) {
    return rawValue.flatMap((v) => normalizeValues(v, plain))
  }

  if (typeof rawValue === 'string') {
    return [plain ? SigmaString.plain(rawValue) : SigmaString.from(rawValue)]
  }

  if (typeof rawValue === 'number') {
    return [new SigmaNumber(rawValue)]
  }

  if (typeof rawValue === 'boolean') {
    return [new SigmaBool(rawValue)]
  }

  // Unknown type — convert to string
  return [SigmaString.from(String(rawValue))]
}

export class SigmaDetection {
  readonly detectionItems: readonly SigmaDetectionItem[]

  constructor(items: readonly SigmaDetectionItem[]) {
    this.detectionItems = items
  }

  get isKeyword(): boolean {
    return this.detectionItems.length > 0 && this.detectionItems[0]!.isKeyword
  }

  /**
   * Create a new SigmaDetection with a new set of items. Never mutates the original.
   */
  _clone(items: readonly SigmaDetectionItem[]): SigmaDetection {
    return new SigmaDetection(items)
  }

  /**
   * Parse a YAML detection value (the value of one named detection key).
   * Handles three shapes:
   * 1. List-of-maps: each map has field->value pairs, AND-joined
   * 2. List-of-scalars: keyword detection (null field)
   * 3. Plain map: field->value pairs as detection items
   */
  static fromYAMLValue(raw: unknown): SigmaDetection {
    if (raw === null || raw === undefined) {
      throw new SigmaDetectionParseError('Detection value cannot be null or undefined')
    }

    // List form
    if (Array.isArray(raw)) {
      if (raw.length === 0) {
        return new SigmaDetection([])
      }

      // Check if it's a list of maps (each map produces detection items joined by AND)
      // or a list of scalars (keyword detection)
      const firstItem = raw[0]
      if (firstItem !== null && typeof firstItem === 'object' && !Array.isArray(firstItem)) {
        // List of maps
        const items: SigmaDetectionItem[] = []
        for (const mapItem of raw) {
          if (typeof mapItem !== 'object' || mapItem === null || Array.isArray(mapItem)) {
            throw new SigmaDetectionParseError('Expected object in list-of-maps detection')
          }
          for (const [key, value] of Object.entries(mapItem as Record<string, unknown>)) {
            items.push(SigmaDetectionItem.fromDict(key, value))
          }
        }
        return new SigmaDetection(items)
      } else {
        // List of scalars — keyword detection
        const items: SigmaDetectionItem[] = raw.map((v) => SigmaDetectionItem.fromKeyword(v))
        return new SigmaDetection(items)
      }
    }

    // Plain map
    if (typeof raw === 'object' && raw !== null) {
      const items: SigmaDetectionItem[] = []
      for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
        items.push(SigmaDetectionItem.fromDict(key, value))
      }
      return new SigmaDetection(items)
    }

    throw new SigmaDetectionParseError(`Unexpected detection value type: ${typeof raw}`)
  }
}
