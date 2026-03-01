import { SigmaModifier } from './base.js'
import type { SigmaType } from '../types/index.js'

export class GtModifier extends SigmaModifier {
  static override readonly modifierName = 'gt'

  apply(values: readonly SigmaType[]): SigmaType[] {
    return [...values]
  }
}
