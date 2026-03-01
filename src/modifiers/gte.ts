import { SigmaModifier } from './base.js'
import type { SigmaType } from '../types/index.js'

export class GteModifier extends SigmaModifier {
  static override readonly modifierName = 'gte'

  apply(values: readonly SigmaType[]): SigmaType[] {
    return [...values]
  }
}
