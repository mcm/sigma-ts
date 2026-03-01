import { SigmaModifier } from './base.js'
import type { SigmaType } from '../types/index.js'
import { SigmaRegularExpression } from '../types/sigma-regex.js'

/**
 * Case-insensitive modifier (`|re|i`).
 * When chained after `re`, re-creates the compiled regex with the `i` flag.
 */
export class CaseInsensitiveModifier extends SigmaModifier {
  static override readonly modifierName = 'i'

  apply(values: readonly SigmaType[]): SigmaType[] {
    return values.map((v) => {
      if (!(v instanceof SigmaRegularExpression)) return v
      return new SigmaRegularExpression(v.pattern, 'i')
    })
  }
}
