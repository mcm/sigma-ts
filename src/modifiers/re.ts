import { SigmaModifier } from './base.js'
import type { SigmaType } from '../types/index.js'
import { SigmaString } from '../types/sigma-string.js'
import { SigmaRegularExpression } from '../types/sigma-regex.js'
import { SigmaModifierError } from '../exceptions.js'

export class ReModifier extends SigmaModifier {
  static override readonly modifierName = 're'
  override get isTypeConversion(): boolean {
    return true
  }

  apply(values: readonly SigmaType[]): SigmaType[] {
    return values.map((v) => {
      if (!(v instanceof SigmaString)) return v
      if (v.contains_wildcard()) {
        throw new SigmaModifierError('re modifier cannot be applied to strings with wildcards')
      }
      return new SigmaRegularExpression(v.plain_value())
    })
  }
}
