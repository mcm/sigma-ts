import { SigmaModifier } from './base.js'
import type { SigmaType } from '../types/index.js'

export class LteModifier extends SigmaModifier {
  static override readonly modifierName = 'lte'

  apply(values: readonly SigmaType[]): SigmaType[] {
    return [...values]
  }
}
