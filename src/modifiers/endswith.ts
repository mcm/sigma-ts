import { SigmaModifier } from './base.js'
import type { SigmaType } from '../types/index.js'
import { SigmaString } from '../types/sigma-string.js'
import type { SigmaStringPart } from '../types/sigma-string.js'

export class EndswithModifier extends SigmaModifier {
  static override readonly modifierName = 'endswith'

  apply(values: readonly SigmaType[]): SigmaType[] {
    return values.map((v) => {
      if (!(v instanceof SigmaString)) return v
      const parts: SigmaStringPart[] = [
        { kind: 'wildcard', wildcard: '*' },
        ...v.parts,
      ]
      return SigmaString.fromParts(parts)
    })
  }
}
