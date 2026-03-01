import { SigmaModifier } from './base.js'
import type { SigmaType } from '../types/index.js'

export class LtModifier extends SigmaModifier {
  static override readonly modifierName = 'lt'

  apply(values: readonly SigmaType[]): SigmaType[] {
    return [...values]
  }
}
