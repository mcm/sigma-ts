import { SigmaModifier } from './base.js'
import type { SigmaType } from '../types/index.js'

export class AllModifier extends SigmaModifier {
  static override readonly modifierName = 'all'
  override get changesValueLinking(): boolean {
    return true
  }

  apply(values: readonly SigmaType[]): SigmaType[] {
    // The 'all' modifier is a flag modifier - it doesn't transform values
    // It's handled by the changesValueLinking property
    return [...values]
  }
}
