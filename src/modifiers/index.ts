import { SigmaModifierError } from '../exceptions.js'
import type { SigmaType } from '../types/index.js'
import { SigmaModifier } from './base.js'

// Registry
export const modifierRegistry = new Map<string, new () => SigmaModifier>()

export function registerModifier(name: string, cls: new () => SigmaModifier): void {
  modifierRegistry.set(name, cls)
}

export function getModifier(name: string): new () => SigmaModifier {
  const cls = modifierRegistry.get(name)
  if (cls === undefined) {
    throw new SigmaModifierError(`Unknown modifier: "${name}"`)
  }
  return cls
}

// Apply a chain of modifiers left-to-right
export function applyModifierChain(
  modifierNames: readonly string[],
  values: readonly SigmaType[],
): { values: SigmaType[]; valueLinking: 'OR' | 'AND' } {
  let current: SigmaType[] = [...values]
  let valueLinking: 'OR' | 'AND' = 'OR'
  let hasTypeConversion = false

  for (const name of modifierNames) {
    const ModifierClass = getModifier(name)
    const modifier = new ModifierClass()

    // Validate: no value-content modifiers after a type conversion
    if (hasTypeConversion && !modifier.changesValueLinking) {
      // Only certain modifiers are invalid after type conversions like re, cidr
      // Check if modifier is a value-content modifier that's incompatible
      const incompatibleAfterTypeConversion = [
        're',
        'cidr',
        'base64',
        'base64offset',
        'wide',
        'utf16le',
        'utf16be',
        'utf16',
      ]
      if (incompatibleAfterTypeConversion.includes(name)) {
        throw new SigmaModifierError(
          `Modifier "${name}" cannot be applied after a type conversion modifier`,
        )
      }
    }

    if (modifier.isTypeConversion) {
      hasTypeConversion = true
    }

    if (modifier.changesValueLinking) {
      valueLinking = 'AND'
    } else {
      current = modifier.apply(current)
    }
  }

  return { values: current, valueLinking }
}

// Self-register all built-in modifiers
import { ContainsModifier } from './contains.js'
import { StartswithModifier } from './startswith.js'
import { EndswithModifier } from './endswith.js'
import { ReModifier } from './re.js'
import { CidrModifier } from './cidr.js'
import { Base64Modifier } from './base64.js'
import { Base64OffsetModifier } from './base64offset.js'
import { WideModifier } from './wide.js'
import { Utf16leModifier } from './utf16le.js'
import { Utf16beModifier } from './utf16be.js'
import { Utf16Modifier } from './utf16.js'
import { WindashModifier } from './windash.js'
import { LtModifier } from './lt.js'
import { LteModifier } from './lte.js'
import { GtModifier } from './gt.js'
import { GteModifier } from './gte.js'
import { ExistsModifier } from './exists.js'
import { FieldrefModifier } from './fieldref.js'
import { ExpandModifier } from './expand.js'
import { AllModifier } from './all.js'
import { CaseInsensitiveModifier } from './case-insensitive.js'

registerModifier('contains', ContainsModifier)
registerModifier('startswith', StartswithModifier)
registerModifier('endswith', EndswithModifier)
registerModifier('re', ReModifier)
registerModifier('cidr', CidrModifier)
registerModifier('base64', Base64Modifier)
registerModifier('base64offset', Base64OffsetModifier)
registerModifier('wide', WideModifier)
registerModifier('utf16le', Utf16leModifier)
registerModifier('utf16be', Utf16beModifier)
registerModifier('utf16', Utf16Modifier)
registerModifier('windash', WindashModifier)
registerModifier('lt', LtModifier)
registerModifier('lte', LteModifier)
registerModifier('gt', GtModifier)
registerModifier('gte', GteModifier)
registerModifier('exists', ExistsModifier)
registerModifier('fieldref', FieldrefModifier)
registerModifier('expand', ExpandModifier)
registerModifier('all', AllModifier)
registerModifier('i', CaseInsensitiveModifier)

export { SigmaModifier }
