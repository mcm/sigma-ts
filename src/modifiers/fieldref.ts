import { SigmaModifier } from './base.js'
import type { SigmaType } from '../types/index.js'
import { SigmaString } from '../types/sigma-string.js'
import { SigmaFieldReference } from '../types/sigma-field-reference.js'
import { SigmaModifierError } from '../exceptions.js'

export class FieldrefModifier extends SigmaModifier {
  static override readonly modifierName = 'fieldref'
  override get isTypeConversion(): boolean {
    return true
  }

  apply(values: readonly SigmaType[]): SigmaType[] {
    return values.map((v) => {
      if (!(v instanceof SigmaString)) return v
      if (v.contains_wildcard()) {
        throw new SigmaModifierError('fieldref modifier cannot be applied to strings with wildcards')
      }
      return new SigmaFieldReference(v.plain_value())
    })
  }
}
