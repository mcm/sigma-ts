import { SigmaModifier } from './base.js'
import type { SigmaType } from '../types/index.js'
import { SigmaString } from '../types/sigma-string.js'
import type { SigmaStringPart } from '../types/sigma-string.js'

export class StartswithModifier extends SigmaModifier {
  static override readonly modifierName = 'startswith'

  apply(values: readonly SigmaType[]): SigmaType[] {
    return values.map((v) => {
      if (!(v instanceof SigmaString)) return v
      const parts: SigmaStringPart[] = [
        ...v.parts,
        { kind: 'wildcard', wildcard: '*' },
      ]
      return SigmaString.fromParts(parts)
    })
  }
}
