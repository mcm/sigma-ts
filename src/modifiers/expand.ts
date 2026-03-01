import { SigmaModifier } from './base.js'
import type { SigmaType } from '../types/index.js'
import { SigmaString } from '../types/sigma-string.js'
import { SigmaExpansion } from '../types/sigma-expansion.js'

export class ExpandModifier extends SigmaModifier {
  static override readonly modifierName = 'expand'

  apply(values: readonly SigmaType[]): SigmaType[] {
    return values.map((v) => {
      if (!(v instanceof SigmaString)) return v
      return new SigmaExpansion(v.plain_value())
    })
  }
}
